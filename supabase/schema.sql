-- ============================================================================
-- CIVICRESOLVE — PRODUCTION DATABASE MIGRATION (MILESTONE 2A FINAL HARDENED)
-- Pre-flight Type Validation, Exact PK/Composite-Safe FK Verification,
-- Non-Recursive RLS, Zero-Fabrication Integrity & Zero-Trust Storage Security
-- ============================================================================

-- Explicit Transaction Boundary: Enforce atomic execution of the entire migration.
-- If any catalog check, data validation, DDL statement, or conflict detection fails,
-- the entire transaction aborts and all operations roll back atomically.
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. PRE-FLIGHT READ-ONLY AUDIT & CATALOG VALIDATION
-- ----------------------------------------------------------------------------
-- These pre-flight inspections are strictly read-only catalog checks against pg_policies
-- and information_schema.columns. They run BEFORE any database mutations (including
-- CREATE EXTENSION, table creation, ALTER TABLE, sequence changes, bucket mutations,
-- or policy modifications). If any conflict is detected, migration halts immediately.
-- Neither check depends on pgcrypto or any objects created by this schema script.

-- A. PRE-FLIGHT ZERO-TRUST STORAGE & TABLE RLS POLICY CONFLICT AUDIT
DO $$
DECLARE
  pol RECORD;
  v_civic_storage_policies TEXT[] := ARRAY[
    'civic_citizens_upload_evidence',
    'civic_citizens_update_evidence',
    'civic_admins_upload_evidence',
    'civic_admins_update_evidence',
    'civic_admins_delete_evidence',
    'civic_evidence_read_policy'
  ];
BEGIN
  -- 1. Storage Objects Policy Audit (Pre-flight before ANY storage or table mutations)
  FOR pol IN
    SELECT policyname, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname <> ALL(v_civic_storage_policies)
  LOOP
    IF pol.permissive = 'PERMISSIVE' AND (
      'public' = ANY(pol.roles) OR 
      'authenticated' = ANY(pol.roles) OR 
      'anon' = ANY(pol.roles)
    ) THEN
      RAISE EXCEPTION 'Migration halted: Pre-flight audit detected unmanaged permissive storage policy "%" on storage.objects (cmd=%, roles=%). In PostgreSQL, permissive policies combine using OR and could grant unauthorized access to private storage. Manual operator review required before migrating.',
        pol.policyname, pol.cmd, array_to_string(pol.roles, ', ');
    ELSE
      RAISE NOTICE 'Pre-flight: Preserving unmanaged restrictive/administrative storage policy "%" on storage.objects (cmd=%, permissive=%).',
        pol.policyname, pol.cmd, pol.permissive;
    END IF;
  END LOOP;

  -- 2. CivicResolve Table Policy Audit (Pre-flight before ANY table modifications)
  FOR pol IN
    SELECT policyname, tablename, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'issues', 'issue_updates')
      AND (tablename, policyname) NOT IN (
        ('profiles', 'profiles_select_policy'),
        ('profiles', 'profiles_insert_policy'),
        ('profiles', 'profiles_update_policy'),
        ('profiles', 'profiles_delete_policy'),
        ('issues', 'issues_select_policy'),
        ('issues', 'issues_insert_policy'),
        ('issues', 'issues_update_policy'),
        ('issues', 'issues_delete_policy'),
        ('issue_updates', 'issue_updates_select_policy'),
        ('issue_updates', 'issue_updates_insert_policy'),
        ('issue_updates', 'issue_updates_update_policy'),
        ('issue_updates', 'issue_updates_delete_policy')
      )
  LOOP
    IF pol.permissive = 'PERMISSIVE' AND (
      'public' = ANY(pol.roles) OR 
      'authenticated' = ANY(pol.roles) OR 
      'anon' = ANY(pol.roles)
    ) THEN
      RAISE EXCEPTION 'Migration halted: Pre-flight audit detected unmanaged permissive table policy "%" on public.% (cmd=%, roles=%). In PostgreSQL, permissive policies combine using OR and could weaken CivicResolve access control. Manual operator review required: inspect, scope, or drop this policy before migrating.',
        pol.policyname, pol.tablename, pol.cmd, array_to_string(pol.roles, ', ');
    ELSE
      RAISE NOTICE 'Pre-flight: Preserving unmanaged restrictive/administrative table policy "%" on public.% (cmd=%, permissive=%).',
        pol.policyname, pol.tablename, pol.cmd, pol.permissive;
    END IF;
  END LOOP;
END $$;

-- B. PRE-FLIGHT CATALOG COLUMN TYPE VALIDATION
-- Inspect existing tables and columns in information_schema.columns.
-- Halt with descriptive exceptions if an existing column has an incompatible type.
-- Silently casting or overwriting incompatible data is strictly prohibited.
DO $$
DECLARE
  rec RECORD;
  v_expected_type TEXT;
  v_is_compatible BOOLEAN;
BEGIN
  FOR rec IN
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'issues', 'issue_updates')
  LOOP
    v_is_compatible := TRUE;
    v_expected_type := '';

    -- Check public.profiles columns
    IF rec.table_name = 'profiles' THEN
      IF rec.column_name = 'id' THEN
        v_expected_type := 'uuid';
        v_is_compatible := (rec.udt_name = 'uuid');
      ELSIF rec.column_name IN ('full_name', 'email', 'role', 'phone') THEN
        v_expected_type := 'text or character varying';
        v_is_compatible := (rec.udt_name IN ('text', 'varchar', 'bpchar'));
      ELSIF rec.column_name IN ('created_at', 'updated_at') THEN
        v_expected_type := 'timestamp with time zone';
        v_is_compatible := (rec.udt_name = 'timestamptz');
      END IF;

    -- Check public.issues columns
    ELSIF rec.table_name = 'issues' THEN
      IF rec.column_name = 'id' THEN
        v_expected_type := 'text or character varying';
        v_is_compatible := (rec.udt_name IN ('text', 'varchar', 'bpchar'));
      ELSIF rec.column_name = 'citizen_id' THEN
        v_expected_type := 'uuid';
        v_is_compatible := (rec.udt_name = 'uuid');
      ELSIF rec.column_name IN (
        'title', 'description', 'category', 'severity', 'priority', 
        'department', 'status', 'location_text', 'image_path', 
        'resolution_image_path', 'resolution_note'
      ) THEN
        v_expected_type := 'text or character varying';
        v_is_compatible := (rec.udt_name IN ('text', 'varchar', 'bpchar'));
      ELSIF rec.column_name IN ('latitude', 'longitude') THEN
        v_expected_type := 'double precision';
        v_is_compatible := (rec.udt_name IN ('float8', 'numeric', 'float4'));
      ELSIF rec.column_name = 'ai_analysis' THEN
        v_expected_type := 'jsonb';
        v_is_compatible := (rec.udt_name = 'jsonb');
      ELSIF rec.column_name IN ('created_at', 'updated_at') THEN
        v_expected_type := 'timestamp with time zone';
        v_is_compatible := (rec.udt_name = 'timestamptz');
      END IF;

    -- Check public.issue_updates columns
    ELSIF rec.table_name = 'issue_updates' THEN
      IF rec.column_name IN ('id', 'updated_by') THEN
        v_expected_type := 'uuid';
        v_is_compatible := (rec.udt_name = 'uuid');
      ELSIF rec.column_name IN ('issue_id', 'updated_by_name', 'old_status', 'new_status', 'note', 'evidence_path') THEN
        v_expected_type := 'text or character varying';
        v_is_compatible := (rec.udt_name IN ('text', 'varchar', 'bpchar'));
      ELSIF rec.column_name = 'created_at' THEN
        v_expected_type := 'timestamp with time zone';
        v_is_compatible := (rec.udt_name = 'timestamptz');
      END IF;
    END IF;

    IF NOT v_is_compatible THEN
      RAISE EXCEPTION 'Migration halted: Existing column public.%.% has data type "%" (udt: "%"), which is incompatible with required type "%". Automatic type casting is prohibited to prevent data corruption. Manual schema alignment required.',
        rec.table_name, rec.column_name, rec.data_type, rec.udt_name, v_expected_type;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 3. TABLE DEFINITIONS, DATA INTEGRITY & STRUCTURAL UPGRADES
-- ----------------------------------------------------------------------------

-- A. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Citizen Resident',
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add missing columns to existing profiles table WITHOUT volatile/default overrides on historical data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Validate existing profiles data integrity: ZERO FABRICATION POLICY
-- If citizen identities, roles, or historical timestamps are missing/invalid, halt with descriptive error.
DO $$
DECLARE
  v_null_profiles_count INTEGER;
  v_bad_role_count INTEGER;
  v_bad_ts_count INTEGER;
  v_bad_name_count INTEGER;
BEGIN
  -- 1. Validate ID
  SELECT COUNT(*) INTO v_null_profiles_count FROM public.profiles WHERE id IS NULL;
  IF v_null_profiles_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.profiles contains % record(s) with NULL id. Citizen profile IDs must correspond to authentic auth.users UUIDs and cannot be fabricated. Please manually map or remediate existing profiles before migrating.', v_null_profiles_count;
  END IF;

  -- 2. Validate auth.users foreign link
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration halted: public.profiles contains id references not found in auth.users.';
  END IF;

  -- 3. Validate full_name (never silently invent citizen names)
  SELECT COUNT(*) INTO v_bad_name_count FROM public.profiles WHERE full_name IS NULL OR TRIM(full_name) = '';
  IF v_bad_name_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.profiles contains % record(s) with missing or empty full_name. Citizen identities cannot be fabricated. Manual remediation required.', v_bad_name_count;
  END IF;

  -- 4. Validate role (never silently reassign roles)
  SELECT COUNT(*) INTO v_bad_role_count FROM public.profiles WHERE role IS NULL OR role NOT IN ('citizen', 'admin');
  IF v_bad_role_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.profiles contains % record(s) with NULL or invalid role. Valid roles are (citizen, admin). Manual remediation required.', v_bad_role_count;
  END IF;

  -- 5. Validate timestamps (never replace missing historical timestamps with now())
  SELECT COUNT(*) INTO v_bad_ts_count FROM public.profiles WHERE created_at IS NULL OR updated_at IS NULL;
  IF v_bad_ts_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.profiles contains % record(s) with missing created_at or updated_at timestamps. Historical timestamps cannot be fabricated. Manual remediation required.', v_bad_ts_count;
  END IF;
END $$;

-- Enforce defaults for FUTURE inserts only
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT 'Citizen Resident';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'citizen';
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();

-- Enforce NOT NULL constraints
ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN updated_at SET NOT NULL;

-- Exact Primary Key Verification for public.profiles: must be strictly (id)
DO $$
DECLARE
  v_pk_name TEXT;
  v_pk_cols TEXT[];
BEGIN
  SELECT c.conname, array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum))
  INTO v_pk_name, v_pk_cols
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'p'
  GROUP BY c.conname;

  IF v_pk_cols IS NOT NULL THEN
    IF v_pk_cols <> ARRAY['id'] THEN
      RAISE EXCEPTION 'Migration halted: public.profiles has primary key "%" defined on (%), but (id) is strictly required. Manual remediation required.', v_pk_name, array_to_string(v_pk_cols, ', ');
    END IF;
  ELSE
    ALTER TABLE public.profiles ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Comprehensive Foreign Key Verification for public.profiles: id -> auth.users(id) ON DELETE CASCADE
DO $$
DECLARE
  fk RECORD;
  v_fk_count INTEGER := 0;
  v_canonical_conname TEXT := 'profiles_id_fkey';
BEGIN
  FOR fk IN
    SELECT c.conname,
           c.conrelid,
           c.confrelid,
           c.conrelid::regclass::text AS src_table,
           c.confrelid::regclass::text AS ref_table,
           c.confdeltype,
           c.confupdtype,
           c.confmatchtype,
           c.condeferrable,
           c.condeferred,
           c.convalidated,
           array_agg(sa.attname::text ORDER BY array_position(c.conkey, sa.attnum)) AS src_cols,
           array_agg(fa.attname::text ORDER BY array_position(c.confkey, fa.attnum)) AS ref_cols
    FROM pg_constraint c
    JOIN pg_attribute sa ON sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'f'
    GROUP BY c.conname, c.conrelid, c.confrelid, c.confdeltype, c.confupdtype, c.confmatchtype, c.condeferrable, c.condeferred, c.convalidated
  LOOP
    IF 'id' = ANY(fk.src_cols) THEN
      IF fk.src_cols <> ARRAY['id'] THEN
        RAISE EXCEPTION 'Migration halted: Conflicting composite foreign key "%" on public.profiles involves column (id) with columns (%). Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', ');
      END IF;

      -- If pointing to a wrong referenced table or wrong referenced columns, halt immediately
      IF fk.confrelid <> 'auth.users'::regclass OR fk.ref_cols <> ARRAY['id'] THEN
        RAISE EXCEPTION 'Migration halted: Foreign key "%" on public.profiles(%) references %(%), but auth.users(id) is required. Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', '), fk.ref_table, array_to_string(fk.ref_cols, ', ');
      END IF;

      -- Explicitly check all 10 catalog properties
      IF fk.conrelid = 'public.profiles'::regclass
         AND fk.src_cols = ARRAY['id']
         AND fk.confrelid = 'auth.users'::regclass
         AND fk.ref_cols = ARRAY['id']
         AND fk.confdeltype = 'c' 
         AND fk.confupdtype = 'a'
         AND fk.confmatchtype = 's'
         AND fk.condeferrable = false 
         AND fk.condeferred = false 
         AND fk.convalidated = true THEN
        v_fk_count := v_fk_count + 1;
        -- If duplicate constraint found on the same column pair, drop the redundant one without CASCADE
        IF v_fk_count > 1 THEN
          RAISE NOTICE 'Dropping duplicate foreign key constraint "%" on public.profiles...', fk.conname;
          EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk.conname);
        END IF;
      ELSE
        -- Repair constraint with non-matching properties (drop without CASCADE and recreate)
        RAISE NOTICE 'Repairing foreign key "%" on public.profiles to enforce exact ON DELETE CASCADE and catalog properties...', fk.conname;
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk.conname);
      END IF;
    END IF;
  END LOOP;

  IF v_fk_count = 0 THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('citizen', 'admin'));


-- B. ISSUES / COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  category TEXT NOT NULL CHECK (category IN (
    'Pothole', 'Road Damage', 'Garbage', 'Streetlight', 'Water Leakage', 'Drainage', 'Other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  department TEXT NOT NULL CHECK (department IN (
    'Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Drainage', 'Other'
  )) DEFAULT 'Other',
  status TEXT NOT NULL CHECK (status IN ('Reported', 'In Progress', 'Resolved')) DEFAULT 'Reported',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_text TEXT NOT NULL DEFAULT 'Location Pending',
  image_path TEXT,
  ai_analysis JSONB,
  resolution_image_path TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add missing columns to existing issues table WITHOUT overwriting historical records
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS citizen_id UUID;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS location_text TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolution_image_path TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Validate existing issues data integrity: ZERO FABRICATION POLICY
-- Strict Non-Modifying Validation: No UPDATE statements are executed during migration.
-- Historical records are never modified, preventing trg_issue_status_audit trigger execution
-- and preserving original updated_at timestamps and audit trail intact.
-- If noncanonical values or missing fields are detected, migration halts with a descriptive exception.
DO $$
DECLARE
  v_null_id_count INTEGER;
  v_bad_title_count INTEGER;
  v_bad_desc_count INTEGER;
  v_bad_status_count INTEGER;
  v_bad_status_samples TEXT;
  v_bad_sev_count INTEGER;
  v_bad_sev_samples TEXT;
  v_bad_pri_count INTEGER;
  v_bad_pri_samples TEXT;
  v_bad_dept_count INTEGER;
  v_bad_dept_samples TEXT;
  v_bad_loc_count INTEGER;
  v_bad_ts_count INTEGER;
  v_invalid_cat_count INTEGER;
  v_invalid_cat_samples TEXT;
BEGIN
  -- 1. Validate ID
  SELECT COUNT(*) INTO v_null_id_count FROM public.issues WHERE id IS NULL OR TRIM(id) = '';
  IF v_null_id_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with NULL or empty id. Complaint identifiers cannot be fabricated without collision risk with municipal dispatch records. Manual remediation required.', v_null_id_count;
  END IF;

  -- 2. Validate title & description
  SELECT COUNT(*) INTO v_bad_title_count FROM public.issues WHERE title IS NULL OR char_length(TRIM(title)) < 3;
  IF v_bad_title_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) where title is NULL or shorter than 3 characters. Citizen complaint titles cannot be fabricated. Manual remediation required.', v_bad_title_count;
  END IF;

  SELECT COUNT(*) INTO v_bad_desc_count FROM public.issues WHERE description IS NULL OR char_length(TRIM(description)) < 10;
  IF v_bad_desc_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) where description is NULL or shorter than 10 characters. Citizen complaint descriptions cannot be fabricated. Manual remediation required.', v_bad_desc_count;
  END IF;

  -- 3. Validate citizen_id reference
  IF EXISTS (
    SELECT 1 FROM public.issues i
    LEFT JOIN auth.users u ON i.citizen_id = u.id
    WHERE i.citizen_id IS NOT NULL AND u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains citizen_id references not found in auth.users.';
  END IF;

  -- 4. Validate category: strictly match canonical allowed values without modifying records
  SELECT COUNT(*), string_agg(DISTINCT COALESCE(category, '<NULL>'), ', ')
  INTO v_invalid_cat_count, v_invalid_cat_samples
  FROM public.issues
  WHERE category IS NULL OR category NOT IN ('Pothole', 'Road Damage', 'Garbage', 'Streetlight', 'Water Leakage', 'Drainage', 'Other');

  IF v_invalid_cat_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with noncanonical or missing category values: (%). Automatic modification of historical complaint records is prohibited to preserve audit integrity and original timestamps. Manual remediation required.',
      v_invalid_cat_count, v_invalid_cat_samples;
  END IF;

  -- 5. Validate status: strictly match canonical allowed values without modifying records
  SELECT COUNT(*), string_agg(DISTINCT COALESCE(status, '<NULL>'), ', ')
  INTO v_bad_status_count, v_bad_status_samples
  FROM public.issues
  WHERE status IS NULL OR status NOT IN ('Reported', 'In Progress', 'Resolved');

  IF v_bad_status_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with noncanonical or missing status values: (%). Valid statuses are (Reported, In Progress, Resolved). Automatic modification of historical complaint records is prohibited to preserve audit integrity and original timestamps. Manual remediation required.',
      v_bad_status_count, v_bad_status_samples;
  END IF;

  -- 6. Validate severity: strictly match canonical allowed values without modifying records
  SELECT COUNT(*), string_agg(DISTINCT COALESCE(severity, '<NULL>'), ', ')
  INTO v_bad_sev_count, v_bad_sev_samples
  FROM public.issues
  WHERE severity IS NULL OR severity NOT IN ('Critical', 'High', 'Medium', 'Low');

  IF v_bad_sev_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with noncanonical or missing severity values: (%). Valid severities are (Critical, High, Medium, Low). Automatic modification of historical complaint records is prohibited to preserve audit integrity and original timestamps. Manual remediation required.',
      v_bad_sev_count, v_bad_sev_samples;
  END IF;

  -- 7. Validate priority: strictly match canonical allowed values without modifying records
  SELECT COUNT(*), string_agg(DISTINCT COALESCE(priority, '<NULL>'), ', ')
  INTO v_bad_pri_count, v_bad_pri_samples
  FROM public.issues
  WHERE priority IS NULL OR priority NOT IN ('Critical', 'High', 'Medium', 'Low');

  IF v_bad_pri_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with noncanonical or missing priority values: (%). Valid priorities are (Critical, High, Medium, Low). Automatic modification of historical complaint records is prohibited to preserve audit integrity and original timestamps. Manual remediation required.',
      v_bad_pri_count, v_bad_pri_samples;
  END IF;

  -- 8. Validate department: strictly match canonical allowed values without modifying records
  SELECT COUNT(*), string_agg(DISTINCT COALESCE(department, '<NULL>'), ', ')
  INTO v_bad_dept_count, v_bad_dept_samples
  FROM public.issues
  WHERE department IS NULL OR department NOT IN ('Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Drainage', 'Other');

  IF v_bad_dept_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with noncanonical or missing department values: (%). Valid departments are (Roads, Sanitation, Electricity, Water Supply, Drainage, Other). Automatic modification of historical complaint records is prohibited to preserve audit integrity and original timestamps. Manual remediation required.',
      v_bad_dept_count, v_bad_dept_samples;
  END IF;

  -- 9. Validate location_text
  SELECT COUNT(*) INTO v_bad_loc_count FROM public.issues WHERE location_text IS NULL OR TRIM(location_text) = '';
  IF v_bad_loc_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with missing or blank location_text. Complaint locations cannot be fabricated. Manual remediation required.', v_bad_loc_count;
  END IF;

  -- 10. Validate timestamps (never replace missing timestamps with now())
  SELECT COUNT(*) INTO v_bad_ts_count FROM public.issues WHERE created_at IS NULL OR updated_at IS NULL;
  IF v_bad_ts_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains % record(s) with missing created_at or updated_at timestamps. Historical timestamps cannot be fabricated. Manual remediation required.', v_bad_ts_count;
  END IF;
END $$;

-- Enforce defaults for FUTURE inserts only
ALTER TABLE public.issues ALTER COLUMN severity SET DEFAULT 'Medium';
ALTER TABLE public.issues ALTER COLUMN priority SET DEFAULT 'Medium';
ALTER TABLE public.issues ALTER COLUMN department SET DEFAULT 'Other';
ALTER TABLE public.issues ALTER COLUMN status SET DEFAULT 'Reported';
ALTER TABLE public.issues ALTER COLUMN location_text SET DEFAULT 'Location Pending';
ALTER TABLE public.issues ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.issues ALTER COLUMN updated_at SET DEFAULT now();

-- Enforce NOT NULL constraints
ALTER TABLE public.issues ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN description SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN category SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN severity SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN priority SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN department SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN location_text SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.issues ALTER COLUMN updated_at SET NOT NULL;

-- Exact Primary Key Verification for public.issues: must be strictly (id)
DO $$
DECLARE
  v_pk_name TEXT;
  v_pk_cols TEXT[];
BEGIN
  SELECT c.conname, array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum))
  INTO v_pk_name, v_pk_cols
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.issues'::regclass AND c.contype = 'p'
  GROUP BY c.conname;

  IF v_pk_cols IS NOT NULL THEN
    IF v_pk_cols <> ARRAY['id'] THEN
      RAISE EXCEPTION 'Migration halted: public.issues has primary key "%" defined on (%), but (id) is strictly required. Manual remediation required.', v_pk_name, array_to_string(v_pk_cols, ', ');
    END IF;
  ELSE
    ALTER TABLE public.issues ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Comprehensive Foreign Key Verification for public.issues: citizen_id -> auth.users(id) ON DELETE SET NULL
DO $$
DECLARE
  fk RECORD;
  v_fk_count INTEGER := 0;
BEGIN
  FOR fk IN
    SELECT c.conname,
           c.conrelid,
           c.confrelid,
           c.conrelid::regclass::text AS src_table,
           c.confrelid::regclass::text AS ref_table,
           c.confdeltype,
           c.confupdtype,
           c.confmatchtype,
           c.condeferrable,
           c.condeferred,
           c.convalidated,
           array_agg(sa.attname::text ORDER BY array_position(c.conkey, sa.attnum)) AS src_cols,
           array_agg(fa.attname::text ORDER BY array_position(c.confkey, fa.attnum)) AS ref_cols
    FROM pg_constraint c
    JOIN pg_attribute sa ON sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE c.conrelid = 'public.issues'::regclass AND c.contype = 'f'
    GROUP BY c.conname, c.conrelid, c.confrelid, c.confdeltype, c.confupdtype, c.confmatchtype, c.condeferrable, c.condeferred, c.convalidated
  LOOP
    IF 'citizen_id' = ANY(fk.src_cols) THEN
      IF fk.src_cols <> ARRAY['citizen_id'] THEN
        RAISE EXCEPTION 'Migration halted: Conflicting composite foreign key "%" on public.issues involves column (citizen_id) with columns (%). Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', ');
      END IF;

      -- If pointing to a wrong referenced table or wrong referenced columns, halt immediately
      IF fk.confrelid <> 'auth.users'::regclass OR fk.ref_cols <> ARRAY['id'] THEN
        RAISE EXCEPTION 'Migration halted: Foreign key "%" on public.issues(%) references %(%), but auth.users(id) is required. Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', '), fk.ref_table, array_to_string(fk.ref_cols, ', ');
      END IF;

      -- Explicitly check all 10 catalog properties
      IF fk.conrelid = 'public.issues'::regclass
         AND fk.src_cols = ARRAY['citizen_id']
         AND fk.confrelid = 'auth.users'::regclass
         AND fk.ref_cols = ARRAY['id']
         AND fk.confdeltype = 'n' 
         AND fk.confupdtype = 'a'
         AND fk.confmatchtype = 's'
         AND fk.condeferrable = false 
         AND fk.condeferred = false 
         AND fk.convalidated = true THEN
        v_fk_count := v_fk_count + 1;
        -- If duplicate constraint found on the same column pair, drop the redundant one without CASCADE
        IF v_fk_count > 1 THEN
          RAISE NOTICE 'Dropping duplicate foreign key constraint "%" on public.issues...', fk.conname;
          EXECUTE format('ALTER TABLE public.issues DROP CONSTRAINT %I', fk.conname);
        END IF;
      ELSE
        -- Repair constraint with non-matching properties (drop without CASCADE and recreate)
        RAISE NOTICE 'Repairing foreign key "%" on public.issues to enforce exact ON DELETE SET NULL and catalog properties...', fk.conname;
        EXECUTE format('ALTER TABLE public.issues DROP CONSTRAINT %I', fk.conname);
      END IF;
    END IF;
  END LOOP;

  IF v_fk_count = 0 THEN
    ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_citizen_id_fkey;
    ALTER TABLE public.issues ADD CONSTRAINT issues_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_title_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_title_check CHECK (char_length(title) >= 3);
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_description_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_description_check CHECK (char_length(description) >= 10);
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_category_check CHECK (category IN (
  'Pothole', 'Road Damage', 'Garbage', 'Streetlight', 'Water Leakage', 'Drainage', 'Other'
));
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_severity_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_severity_check CHECK (severity IN ('Critical', 'High', 'Medium', 'Low'));
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_priority_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_priority_check CHECK (priority IN ('Critical', 'High', 'Medium', 'Low'));
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_department_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_department_check CHECK (department IN (
  'Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Drainage', 'Other'
));
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_status_check CHECK (status IN ('Reported', 'In Progress', 'Resolved'));


-- C. ISSUE UPDATES (Status History & Audit Trail)
CREATE TABLE IF NOT EXISTS public.issue_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name TEXT,
  old_status TEXT CHECK (old_status IN ('Reported', 'In Progress', 'Resolved')),
  new_status TEXT NOT NULL CHECK (new_status IN ('Reported', 'In Progress', 'Resolved')),
  note TEXT,
  evidence_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add missing columns to existing issue_updates table WITHOUT default/volatile generators on historical rows
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS issue_id TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS updated_by_name TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS old_status TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS new_status TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS evidence_path TEXT;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Validate existing issue_updates data integrity: ZERO FABRICATION POLICY
-- 1. Existing rows with NULL id are NOT silently assigned random UUIDs.
-- 2. Existing rows with missing new_status or created_at are NOT silently replaced with Reported or now().
-- Any missing historical audit trail data halts with an actionable exception.
DO $$
DECLARE
  v_null_update_id_count INTEGER;
  v_null_issue_id_count INTEGER;
  v_orphan_count INTEGER;
  v_bad_status_count INTEGER;
  v_bad_ts_count INTEGER;
BEGIN
  -- Validate ID (never fabricate historical audit UUIDs)
  SELECT COUNT(*) INTO v_null_update_id_count FROM public.issue_updates WHERE id IS NULL;
  IF v_null_update_id_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains % record(s) with NULL id. Audit log primary keys cannot be silently fabricated with random UUIDs without manual review of historical audit trail integrity. Please manually assign canonical UUIDs or remediate existing records before migrating.', v_null_update_id_count;
  END IF;

  -- Validate issue_id reference
  SELECT COUNT(*) INTO v_null_issue_id_count FROM public.issue_updates WHERE issue_id IS NULL OR TRIM(issue_id) = '';
  IF v_null_issue_id_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains % record(s) with NULL or blank issue_id. Status updates cannot be disassociated from complaints. Manual remediation required.', v_null_issue_id_count;
  END IF;

  SELECT COUNT(*) INTO v_orphan_count
  FROM public.issue_updates iu
  LEFT JOIN public.issues i ON iu.issue_id = i.id
  WHERE i.id IS NULL;

  IF v_orphan_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains % orphan records referencing non-existent issues.', v_orphan_count;
  END IF;

  -- Validate updated_by reference
  IF EXISTS (
    SELECT 1 FROM public.issue_updates iu
    LEFT JOIN auth.users u ON iu.updated_by = u.id
    WHERE iu.updated_by IS NOT NULL AND u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains updated_by references not found in auth.users.';
  END IF;

  -- Strict Audit Immutability: Validate existing status values WITHOUT modifying historical audit records
  IF EXISTS (
    SELECT 1 FROM public.issue_updates 
    WHERE old_status IS NOT NULL AND old_status NOT IN ('Reported', 'In Progress', 'Resolved')
  ) THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains historical records with invalid old_status values. Valid values are (Reported, In Progress, Resolved). Audit records are strictly immutable and cannot be silently normalized or updated. Manual remediation required.';
  END IF;

  -- Halt on missing or invalid new_status (never rewrite or silently normalize audit history)
  SELECT COUNT(*) INTO v_bad_status_count FROM public.issue_updates WHERE new_status IS NULL OR new_status NOT IN ('Reported', 'In Progress', 'Resolved');
  IF v_bad_status_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains % record(s) with missing or invalid new_status. Historical status transitions cannot be modified. Manual remediation required.', v_bad_status_count;
  END IF;

  -- Halt on missing created_at (never silently replace historical timestamp with now())
  SELECT COUNT(*) INTO v_bad_ts_count FROM public.issue_updates WHERE created_at IS NULL;
  IF v_bad_ts_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.issue_updates contains % record(s) with missing created_at timestamps. Historical audit timestamps cannot be fabricated. Manual remediation required.', v_bad_ts_count;
  END IF;
END $$;

-- Enforce defaults for FUTURE inserts only (applied only after historical records pass validation)
ALTER TABLE public.issue_updates ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.issue_updates ALTER COLUMN created_at SET DEFAULT now();

-- Enforce NOT NULL constraints
ALTER TABLE public.issue_updates ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.issue_updates ALTER COLUMN issue_id SET NOT NULL;
ALTER TABLE public.issue_updates ALTER COLUMN new_status SET NOT NULL;
ALTER TABLE public.issue_updates ALTER COLUMN created_at SET NOT NULL;

-- Exact Primary Key Verification for public.issue_updates: must be strictly (id)
DO $$
DECLARE
  v_pk_name TEXT;
  v_pk_cols TEXT[];
BEGIN
  SELECT c.conname, array_agg(a.attname::text ORDER BY array_position(c.conkey, a.attnum))
  INTO v_pk_name, v_pk_cols
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.issue_updates'::regclass AND c.contype = 'p'
  GROUP BY c.conname;

  IF v_pk_cols IS NOT NULL THEN
    IF v_pk_cols <> ARRAY['id'] THEN
      RAISE EXCEPTION 'Migration halted: public.issue_updates has primary key "%" defined on (%), but (id) is strictly required. Manual remediation required.', v_pk_name, array_to_string(v_pk_cols, ', ');
    END IF;
  ELSE
    ALTER TABLE public.issue_updates ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Comprehensive Foreign Key Verification for public.issue_updates:
-- 1. issue_id -> public.issues(id) ON DELETE CASCADE
-- 2. updated_by -> auth.users(id) ON DELETE SET NULL
DO $$
DECLARE
  fk RECORD;
  v_issue_fk_count INTEGER := 0;
  v_user_fk_count INTEGER := 0;
BEGIN
  FOR fk IN
    SELECT c.conname,
           c.conrelid,
           c.confrelid,
           c.conrelid::regclass::text AS src_table,
           c.confrelid::regclass::text AS ref_table,
           c.confdeltype,
           c.confupdtype,
           c.confmatchtype,
           c.condeferrable,
           c.condeferred,
           c.convalidated,
           array_agg(sa.attname::text ORDER BY array_position(c.conkey, sa.attnum)) AS src_cols,
           array_agg(fa.attname::text ORDER BY array_position(c.confkey, fa.attnum)) AS ref_cols
    FROM pg_constraint c
    JOIN pg_attribute sa ON sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE c.conrelid = 'public.issue_updates'::regclass AND c.contype = 'f'
    GROUP BY c.conname, c.conrelid, c.confrelid, c.confdeltype, c.confupdtype, c.confmatchtype, c.condeferrable, c.condeferred, c.convalidated
  LOOP
    -- Check constraints involving issue_id
    IF 'issue_id' = ANY(fk.src_cols) THEN
      IF fk.src_cols <> ARRAY['issue_id'] THEN
        RAISE EXCEPTION 'Migration halted: Conflicting composite foreign key "%" on public.issue_updates involves column (issue_id) with columns (%). Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', ');
      END IF;

      -- If pointing to a wrong referenced table or wrong referenced columns, halt immediately
      IF fk.confrelid <> 'public.issues'::regclass OR fk.ref_cols <> ARRAY['id'] THEN
        RAISE EXCEPTION 'Migration halted: Foreign key "%" on public.issue_updates(%) references %(%), but public.issues(id) is required. Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', '), fk.ref_table, array_to_string(fk.ref_cols, ', ');
      END IF;

      -- Validate all 10 properties for issue_id -> public.issues(id) ON DELETE CASCADE
      IF fk.conrelid = 'public.issue_updates'::regclass
         AND fk.src_cols = ARRAY['issue_id']
         AND fk.confrelid = 'public.issues'::regclass
         AND fk.ref_cols = ARRAY['id']
         AND fk.confdeltype = 'c' 
         AND fk.confupdtype = 'a'
         AND fk.confmatchtype = 's'
         AND fk.condeferrable = false 
         AND fk.condeferred = false 
         AND fk.convalidated = true THEN
        v_issue_fk_count := v_issue_fk_count + 1;
        -- If duplicate constraint found on the same column pair, drop the redundant one without CASCADE
        IF v_issue_fk_count > 1 THEN
          RAISE NOTICE 'Dropping duplicate foreign key constraint "%" on public.issue_updates...', fk.conname;
          EXECUTE format('ALTER TABLE public.issue_updates DROP CONSTRAINT %I', fk.conname);
        END IF;
      ELSE
        -- Repair constraint with non-matching properties (drop without CASCADE and recreate)
        RAISE NOTICE 'Repairing foreign key "%" on public.issue_updates to enforce exact ON DELETE CASCADE and catalog properties...', fk.conname;
        EXECUTE format('ALTER TABLE public.issue_updates DROP CONSTRAINT %I', fk.conname);
      END IF;

    -- Check constraints involving updated_by
    ELSIF 'updated_by' = ANY(fk.src_cols) THEN
      IF fk.src_cols <> ARRAY['updated_by'] THEN
        RAISE EXCEPTION 'Migration halted: Conflicting composite foreign key "%" on public.issue_updates involves column (updated_by) with columns (%). Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', ');
      END IF;

      -- If pointing to a wrong referenced table or wrong referenced columns, halt immediately
      IF fk.confrelid <> 'auth.users'::regclass OR fk.ref_cols <> ARRAY['id'] THEN
        RAISE EXCEPTION 'Migration halted: Foreign key "%" on public.issue_updates(%) references %(%), but auth.users(id) is required. Manual remediation required.',
          fk.conname, array_to_string(fk.src_cols, ', '), fk.ref_table, array_to_string(fk.ref_cols, ', ');
      END IF;

      -- Validate all 10 properties for updated_by -> auth.users(id) ON DELETE SET NULL
      IF fk.conrelid = 'public.issue_updates'::regclass
         AND fk.src_cols = ARRAY['updated_by']
         AND fk.confrelid = 'auth.users'::regclass
         AND fk.ref_cols = ARRAY['id']
         AND fk.confdeltype = 'n' 
         AND fk.confupdtype = 'a'
         AND fk.confmatchtype = 's'
         AND fk.condeferrable = false 
         AND fk.condeferred = false 
         AND fk.convalidated = true THEN
        v_user_fk_count := v_user_fk_count + 1;
        -- If duplicate constraint found on the same column pair, drop the redundant one without CASCADE
        IF v_user_fk_count > 1 THEN
          RAISE NOTICE 'Dropping duplicate foreign key constraint "%" on public.issue_updates...', fk.conname;
          EXECUTE format('ALTER TABLE public.issue_updates DROP CONSTRAINT %I', fk.conname);
        END IF;
      ELSE
        -- Repair constraint with non-matching properties (drop without CASCADE and recreate)
        RAISE NOTICE 'Repairing foreign key "%" on public.issue_updates to enforce exact ON DELETE SET NULL and catalog properties...', fk.conname;
        EXECUTE format('ALTER TABLE public.issue_updates DROP CONSTRAINT %I', fk.conname);
      END IF;
    END IF;
  END LOOP;

  IF v_issue_fk_count = 0 THEN
    ALTER TABLE public.issue_updates DROP CONSTRAINT IF EXISTS issue_updates_issue_id_fkey;
    ALTER TABLE public.issue_updates ADD CONSTRAINT issue_updates_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id) ON DELETE CASCADE;
  END IF;

  IF v_user_fk_count = 0 THEN
    ALTER TABLE public.issue_updates DROP CONSTRAINT IF EXISTS issue_updates_updated_by_fkey;
    ALTER TABLE public.issue_updates ADD CONSTRAINT issue_updates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.issue_updates DROP CONSTRAINT IF EXISTS issue_updates_old_status_check;
ALTER TABLE public.issue_updates ADD CONSTRAINT issue_updates_old_status_check CHECK (old_status IN ('Reported', 'In Progress', 'Resolved'));
ALTER TABLE public.issue_updates DROP CONSTRAINT IF EXISTS issue_updates_new_status_check;
ALTER TABLE public.issue_updates ADD CONSTRAINT issue_updates_new_status_check CHECK (new_status IN ('Reported', 'In Progress', 'Resolved'));

-- ----------------------------------------------------------------------------
-- 4. SEQUENCE SYNCHRONIZATION & COLLISION-RESISTANT ID GENERATOR
-- ----------------------------------------------------------------------------
-- Created and synchronized AFTER public.issues exists
CREATE SEQUENCE IF NOT EXISTS public.issue_id_seq START WITH 1001 INCREMENT BY 1;

-- Correct Sequence Synchronization handling both is_called=false (first run)
-- and already-advanced states, preventing ID collisions on CIV-1001 and backwards shifts.
DO $$
DECLARE
  v_max_id_num BIGINT;
  v_seq_last_val BIGINT;
  v_seq_is_called BOOLEAN;
  v_effective_next BIGINT;
BEGIN
  -- 1. Guard against numeric overflow by verifying digit length (up to 15 digits fits safely in BIGINT)
  IF EXISTS (
    SELECT 1 FROM public.issues
    WHERE id ~ '^CIV-[0-9]+$' AND length(SUBSTRING(id FROM '^CIV-([0-9]+)$')) > 15
  ) THEN
    RAISE EXCEPTION 'Migration halted: public.issues contains complaint IDs with numeric values exceeding 15 digits (potential BIGINT overflow). Manual remediation required.';
  END IF;

  -- 2. Scan highest existing numeric ID matching 'CIV-[0-9]+'
  SELECT MAX(SUBSTRING(id FROM '^CIV-([0-9]+)$')::BIGINT)
  INTO v_max_id_num
  FROM public.issues
  WHERE id ~ '^CIV-[0-9]+$';

  -- 3. Read both last_value AND is_called from public.issue_id_seq
  SELECT last_value, is_called 
  INTO v_seq_last_val, v_seq_is_called 
  FROM public.issue_id_seq;

  -- Calculate what nextval() would return on the immediate next call
  IF v_seq_is_called THEN
    v_effective_next := v_seq_last_val + 1;
  ELSE
    v_effective_next := v_seq_last_val;
  END IF;

  -- 4. Synchronize sequence if existing IDs are present
  IF v_max_id_num IS NOT NULL THEN
    -- Ensure nextval() will strictly exceed v_max_id_num without moving an advanced sequence backwards
    IF v_effective_next <= v_max_id_num THEN
      PERFORM setval('public.issue_id_seq', v_max_id_num, true);
    END IF;
  END IF;
END $$;

-- Sequence generator: MUST be VOLATILE because nextval() alters sequence state
CREATE OR REPLACE FUNCTION public.generate_issue_id()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT 'CIV-' || nextval('public.issue_id_seq')::text;
$$;

-- Apply sequence default to issues.id
ALTER TABLE public.issues ALTER COLUMN id SET DEFAULT public.generate_issue_id();

-- Sequence & function grants: authenticated and service_role ONLY (no anon access)
REVOKE ALL ON FUNCTION public.generate_issue_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_issue_id() TO authenticated, service_role;

REVOKE ALL ON SEQUENCE public.issue_id_seq FROM PUBLIC, anon;
GRANT USAGE, SELECT ON SEQUENCE public.issue_id_seq TO authenticated, service_role;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_issues_citizen_id ON public.issues(citizen_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_department ON public.issues(department);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON public.issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_updates_created_at ON public.issue_updates(created_at ASC);

-- ----------------------------------------------------------------------------
-- 5. TABLE PERMISSIONS & ROLE MANAGEMENT
-- ----------------------------------------------------------------------------
-- Revoke direct client write permissions on issue_updates
REVOKE INSERT, UPDATE, DELETE ON public.issue_updates FROM authenticated, anon, PUBLIC;
GRANT SELECT ON public.issue_updates TO authenticated;
GRANT ALL ON public.issue_updates TO service_role;

-- Grant standard permissions on issues and profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.issues TO authenticated;
GRANT UPDATE, DELETE ON public.issues TO authenticated; -- Scoped to admin via RLS
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.issues TO service_role;

-- ----------------------------------------------------------------------------
-- 6. TRUSTED FUNCTIONS & SECURITY DEFINER HOOKS
-- ----------------------------------------------------------------------------

-- Check admin status securely without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Efficient Single-Query Dashboard Metrics Aggregation
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Strict municipal admin check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrative access required.';
  END IF;

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'reported', COUNT(*) FILTER (WHERE status = 'Reported'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'In Progress'),
    'resolved', COUNT(*) FILTER (WHERE status = 'Resolved'),
    'critical_high', COUNT(*) FILTER (WHERE priority IN ('Critical', 'High')),
    'by_category', (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT category AS cat, COUNT(*) AS cnt
        FROM public.issues
        GROUP BY category
      ) c
    ),
    'by_department', (
      SELECT jsonb_object_agg(dept, cnt)
      FROM (
        SELECT department AS dept, COUNT(*) AS cnt
        FROM public.issues
        GROUP BY department
      ) d
    )
  ) INTO v_result
  FROM public.issues;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated, service_role;

-- Role protection trigger:
-- Uses session_user and JWT role claim rather than current_user (which resolves to function owner inside SECURITY DEFINER)
-- Allows SQL Editor bootstrap (session_user = postgres/supabase_admin) and service_role while strictly blocking citizen escalation
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_jwt_role TEXT;
  v_is_authorized BOOLEAN := FALSE;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Read trusted JWT claim if executing under PostgREST
    BEGIN
      v_jwt_role := NULLIF(current_setting('request.jwt.claim.role', true), '');
    EXCEPTION WHEN OTHERS THEN
      v_jwt_role := NULL;
    END;

    -- Authorized if:
    -- 1. Executing directly in database console/SQL Editor (session_user is postgres or supabase_admin)
    -- 2. Executing with verified service_role JWT key
    -- 3. Executing as an authenticated user who is already a verified municipal admin
    IF session_user IN ('postgres', 'supabase_admin') THEN
      v_is_authorized := TRUE;
    ELSIF v_jwt_role = 'service_role' THEN
      v_is_authorized := TRUE;
    ELSIF public.is_admin() THEN
      v_is_authorized := TRUE;
    END IF;

    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'Unauthorized: Role modification is prohibited.';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- Auto-provision profile on auth registration with non-null full_name fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'Citizen Resident'
  );

  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    'citizen', -- Strictly default to citizen
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Citizen issue insert sanitization: forces defaults at the database layer
CREATE OR REPLACE FUNCTION public.sanitize_citizen_issue_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  -- If the caller is not a verified municipal admin:
  IF NOT public.is_admin() THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: Citizen complaint creation requires an authentic authenticated user session.';
    END IF;
    NEW.citizen_id := auth.uid();
    NEW.status := 'Reported';
    NEW.severity := 'Medium';
    NEW.priority := 'Medium';
    NEW.department := 'Other';
    NEW.ai_analysis := NULL;
    NEW.resolution_image_path := NULL;
    NEW.resolution_note := NULL;

    -- Strict evidence path ownership: Citizens may only attach evidence uploaded to their own folder
    IF NEW.image_path IS NOT NULL AND TRIM(NEW.image_path) <> '' THEN
      IF NOT (NEW.image_path LIKE auth.uid()::text || '/%') THEN
        RAISE EXCEPTION 'Unauthorized evidence path: Citizens may only attach evidence uploaded to their own storage folder.';
      END IF;
    END IF;
  END IF;

  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_citizen_issue_insert ON public.issues;
CREATE TRIGGER trg_sanitize_citizen_issue_insert
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_citizen_issue_insert();

-- Atomic audit logging: captures intake on INSERT and admin identity on UPDATE
CREATE OR REPLACE FUNCTION public.handle_issue_status_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_admin_name TEXT := 'Municipal Dispatcher';
BEGIN
  -- 1. Intake row on INSERT: accurately record the actual inserted status and note
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.issue_updates (
      issue_id,
      updated_by,
      updated_by_name,
      old_status,
      new_status,
      note,
      created_at
    ) VALUES (
      NEW.id,
      NEW.citizen_id,
      CASE WHEN public.is_admin() THEN 'Municipal Dispatcher' ELSE 'Citizen Submission' END,
      NULL,
      NEW.status,
      COALESCE(NEW.resolution_note, 'Complaint successfully logged and entered into municipal intake queue.'),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  -- 2. Transition row on UPDATE
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT full_name INTO v_admin_name 
      FROM public.profiles 
      WHERE id = auth.uid();
    END IF;

    INSERT INTO public.issue_updates (
      issue_id,
      updated_by,
      updated_by_name,
      old_status,
      new_status,
      note,
      evidence_path,
      created_at
    ) VALUES (
      NEW.id,
      auth.uid(),
      COALESCE(v_admin_name, 'Municipal Dispatcher'),
      OLD.status,
      NEW.status,
      COALESCE(NEW.resolution_note, 'Status updated to ' || NEW.status),
      NEW.resolution_image_path,
      now()
    );
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_insert_audit ON public.issues;
CREATE TRIGGER trg_issue_insert_audit
  AFTER INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_issue_status_audit();

DROP TRIGGER IF EXISTS trg_issue_status_audit ON public.issues;
CREATE TRIGGER trg_issue_status_audit
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_issue_status_audit();

-- Privileged AI triage: strictly service_role ONLY
-- Target issue must exist and must be in 'Reported' status (atomic conditional update prevents overwriting in-progress/resolved issues)
CREATE OR REPLACE FUNCTION public.set_issue_ai_triage(
  p_issue_id TEXT,
  p_ai_analysis JSONB,
  p_category TEXT,
  p_priority TEXT,
  p_severity TEXT,
  p_department TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  -- Strict NULL checks
  IF p_issue_id IS NULL OR p_ai_analysis IS NULL OR p_category IS NULL 
     OR p_priority IS NULL OR p_severity IS NULL OR p_department IS NULL THEN
    RAISE EXCEPTION 'set_issue_ai_triage: All parameters are strictly required and cannot be NULL.';
  END IF;

  -- Constraint verification
  IF p_category NOT IN ('Pothole', 'Road Damage', 'Garbage', 'Streetlight', 'Water Leakage', 'Drainage', 'Other') THEN
    RAISE EXCEPTION 'Invalid category: %', p_category;
  END IF;

  IF p_priority NOT IN ('Critical', 'High', 'Medium', 'Low') THEN
    RAISE EXCEPTION 'Invalid priority: %', p_priority;
  END IF;

  IF p_severity NOT IN ('Critical', 'High', 'Medium', 'Low') THEN
    RAISE EXCEPTION 'Invalid severity: %', p_severity;
  END IF;

  IF p_department NOT IN ('Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Drainage', 'Other') THEN
    RAISE EXCEPTION 'Invalid department: %', p_department;
  END IF;

  -- Atomic conditional update strictly on Reported status
  UPDATE public.issues
  SET
    ai_analysis = p_ai_analysis,
    category = p_category,
    priority = p_priority,
    severity = p_severity,
    department = p_department,
    updated_at = now()
  WHERE id = p_issue_id AND status = 'Reported';

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Complaint % not found or not in Reported status.', p_issue_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_issue_ai_triage(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_issue_ai_triage(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- 7. DYNAMIC RLS CLEANUP & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

-- Conflict Detection: inspect any unmanaged policies on CivicResolve tables.
-- In PostgreSQL, permissive policies combine using OR. If an unmanaged permissive policy
-- applies to public, authenticated, or anon, it could weaken CivicResolve access control.
-- Match policies using explicit (tablename, policyname) pairs to prevent an unmanaged policy
-- on one table from evading detection by sharing a name with a policy on another table.
-- Halt migration immediately BEFORE modifying any existing policies.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'issues', 'issue_updates')
      AND (tablename, policyname) NOT IN (
        ('profiles', 'profiles_select_policy'),
        ('profiles', 'profiles_insert_policy'),
        ('profiles', 'profiles_update_policy'),
        ('profiles', 'profiles_delete_policy'),
        ('issues', 'issues_select_policy'),
        ('issues', 'issues_insert_policy'),
        ('issues', 'issues_update_policy'),
        ('issues', 'issues_delete_policy'),
        ('issue_updates', 'issue_updates_select_policy'),
        ('issue_updates', 'issue_updates_insert_policy'),
        ('issue_updates', 'issue_updates_update_policy'),
        ('issue_updates', 'issue_updates_delete_policy')
      )
  LOOP
    IF pol.permissive = 'PERMISSIVE' AND (
      'public' = ANY(pol.roles) OR 
      'authenticated' = ANY(pol.roles) OR 
      'anon' = ANY(pol.roles)
    ) THEN
      RAISE EXCEPTION 'Migration halted: Potentially conflicting permissive policy "%" detected on public.% (cmd=%, roles=%). In PostgreSQL, permissive policies combine using OR and could weaken CivicResolve access control. Manual operator review required: inspect, scope, or drop this policy before migrating.',
        pol.policyname, pol.tablename, pol.cmd, array_to_string(pol.roles, ', ');
    ELSE
      RAISE NOTICE 'Preserving unmanaged restrictive/administrative policy "%" on public.% (cmd=%, permissive=%).',
        pol.policyname, pol.tablename, pol.cmd, pol.permissive;
    END IF;
  END LOOP;
END $$;

-- Explicitly drop only recognized CivicResolve-owned policies before recreation
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

DROP POLICY IF EXISTS "issues_select_policy" ON public.issues;
DROP POLICY IF EXISTS "issues_insert_policy" ON public.issues;
DROP POLICY IF EXISTS "issues_update_policy" ON public.issues;
DROP POLICY IF EXISTS "issues_delete_policy" ON public.issues;

DROP POLICY IF EXISTS "issue_updates_select_policy" ON public.issue_updates;
DROP POLICY IF EXISTS "issue_updates_insert_policy" ON public.issue_updates;
DROP POLICY IF EXISTS "issue_updates_update_policy" ON public.issue_updates;
DROP POLICY IF EXISTS "issue_updates_delete_policy" ON public.issue_updates;

-- PROFILES POLICIES
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'citizen');

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ISSUES POLICIES
CREATE POLICY "issues_select_policy"
  ON public.issues FOR SELECT
  TO authenticated
  USING (auth.uid() = citizen_id OR public.is_admin());

CREATE POLICY "issues_insert_policy"
  ON public.issues FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = citizen_id 
    AND status = 'Reported'
    AND resolution_image_path IS NULL
    AND resolution_note IS NULL
    AND (image_path IS NULL OR TRIM(image_path) = '' OR image_path LIKE auth.uid()::text || '/%')
  );

CREATE POLICY "issues_update_policy"
  ON public.issues FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "issues_delete_policy"
  ON public.issues FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ISSUE_UPDATES POLICIES (No client INSERT policy exists)
CREATE POLICY "issue_updates_select_policy"
  ON public.issue_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues
      WHERE issues.id = issue_updates.issue_id 
        AND issues.citizen_id = auth.uid()
    ) OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 8. ZERO-TRUST STORAGE POLICY CLEANUP & CIVIC BUCKET POLICIES
-- ----------------------------------------------------------------------------
-- Conflict Detection for Storage: inspect unmanaged policies on storage.objects BEFORE any modifications.
-- In PostgreSQL, permissive policies combine using OR. If an unmanaged permissive policy
-- applies to public, authenticated, or anon under any command (ALL, SELECT, INSERT, UPDATE, DELETE),
-- it could grant unauthorized access to the private civic-evidence bucket regardless of keyword appearances.
-- Safest default: halt on every unmanaged permissive storage policy affecting relevant roles;
-- require manual operator review while safely preserving restrictive policies and administrative policies.
DO $$
DECLARE
  pol RECORD;
  v_civic_storage_policies TEXT[] := ARRAY[
    'civic_citizens_upload_evidence',
    'civic_citizens_update_evidence',
    'civic_admins_upload_evidence',
    'civic_admins_update_evidence',
    'civic_admins_delete_evidence',
    'civic_evidence_read_policy'
  ];
BEGIN
  FOR pol IN
    SELECT policyname, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname <> ALL(v_civic_storage_policies)
  LOOP
    -- Safest default: halt on every unmanaged permissive policy affecting public, authenticated, or anon
    IF pol.permissive = 'PERMISSIVE' AND (
      'public' = ANY(pol.roles) OR 
      'authenticated' = ANY(pol.roles) OR 
      'anon' = ANY(pol.roles)
    ) THEN
      RAISE EXCEPTION 'Migration halted: Unmanaged permissive storage policy "%" detected on storage.objects (cmd=%, roles=%). In PostgreSQL, permissive policies combine using OR and could grant unauthorized access to private storage. Manual operator review required before migrating.',
        pol.policyname, pol.cmd, array_to_string(pol.roles, ', ');
    ELSE
      -- Restrictive policies or policies applying exclusively to internal roles (e.g. service_role) are preserved
      RAISE NOTICE 'Preserving unmanaged restrictive/administrative storage policy "%" on storage.objects (cmd=%, permissive=%).',
        pol.policyname, pol.cmd, pol.permissive;
    END IF;
  END LOOP;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('civic-evidence', 'civic-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Explicitly drop only recognized CivicResolve-owned storage policies before recreation
DROP POLICY IF EXISTS "civic_citizens_upload_evidence" ON storage.objects;
DROP POLICY IF EXISTS "civic_citizens_update_evidence" ON storage.objects;
DROP POLICY IF EXISTS "civic_admins_upload_evidence" ON storage.objects;
DROP POLICY IF EXISTS "civic_admins_update_evidence" ON storage.objects;
DROP POLICY IF EXISTS "civic_admins_delete_evidence" ON storage.objects;
DROP POLICY IF EXISTS "civic_evidence_read_policy" ON storage.objects;

-- Citizen Upload: INSERT into own authenticated UUID folder only
CREATE POLICY "civic_citizens_upload_evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'civic-evidence' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Citizen Upsert: UPDATE allowed in own authenticated UUID folder only
CREATE POLICY "civic_citizens_update_evidence"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'civic-evidence' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'civic-evidence' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin Upload: INSERT anywhere in civic-evidence
CREATE POLICY "civic_admins_upload_evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'civic-evidence' 
    AND public.is_admin()
  );

-- Admin Upsert: UPDATE anywhere in civic-evidence
CREATE POLICY "civic_admins_update_evidence"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'civic-evidence' 
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'civic-evidence' 
    AND public.is_admin()
  );

-- Admin Delete: DELETE anywhere in civic-evidence
CREATE POLICY "civic_admins_delete_evidence"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'civic-evidence' 
    AND public.is_admin()
  );

-- Strict Path Read: SELECT allowed only for the uploader UUID folder, verified admin, or linked issue resolution photo
CREATE POLICY "civic_evidence_read_policy"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'civic-evidence' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.citizen_id = auth.uid()
          AND issues.resolution_image_path = name
      )
    )
  );

-- ============================================================================
-- End of Migration Transaction: Commit all changes atomically.
-- ============================================================================
COMMIT;
