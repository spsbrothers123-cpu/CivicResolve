-- ============================================================================
-- CIVICRESOLVE — PHASE 3 DATABASE MIGRATION & BACKEND ALIGNMENT
-- ============================================================================
-- 1. Add optional phone column to public.profiles if not exists
-- 2. Add admin dashboard metrics aggregation helper function
-- ============================================================================

-- 1. Profiles: Add optional phone column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Admin Dashboard Metrics Function (Efficient Single-Query Aggregation)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Strict admin check
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
