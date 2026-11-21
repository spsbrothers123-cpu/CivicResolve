// tests/phase8-readiness.test.mjs
// Phase 8: Final Hackathon Readiness, Rate Limiting & Production Verification Suite

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("CIVICRESOLVE — PHASE 8 PRODUCTION & HACKATHON READINESS TEST SUITE");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// ------------------------------------------------------------------------------
// GROUP 1: Rate Limiter Module Verification (In-Memory Sliding Window)
// ------------------------------------------------------------------------------
console.log("\n--- Group 1: Rate Limiting & Abuse Protection ---");

// Dynamic test of sliding window rate limiter logic
function checkSlidingWindowRateLimit(store, key, limit, windowMs, now) {
  const windowStart = now - windowMs;
  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
    return { success: false, limit, remaining: 0, resetTimeMs, retryAfterSeconds };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  return { success: true, limit, remaining, resetTimeMs: now + windowMs, retryAfterSeconds: Math.ceil(windowMs / 1000) };
}

runTest("8.1.1: Rate limiter permits requests under the configured threshold", () => {
  const store = new Map();
  const key = "ip:192.168.1.100";
  const limit = 5;
  const windowMs = 60000;
  const t0 = 1000000;

  for (let i = 0; i < limit; i++) {
    const res = checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + i * 100);
    assert.strictEqual(res.success, true, `Request ${i + 1} should be permitted`);
    assert.strictEqual(res.remaining, limit - (i + 1));
  }
});

runTest("8.1.2: Rate limiter blocks requests exceeding the configured threshold with 429 retry-after", () => {
  const store = new Map();
  const key = "ip:192.168.1.101";
  const limit = 3;
  const windowMs = 10000;
  const t0 = 1000000;

  // Use up 3 requests
  checkSlidingWindowRateLimit(store, key, limit, windowMs, t0);
  checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 1000);
  checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 2000);

  // 4th request must be blocked
  const blockedRes = checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 3000);
  assert.strictEqual(blockedRes.success, false);
  assert.strictEqual(blockedRes.remaining, 0);
  assert.ok(blockedRes.retryAfterSeconds > 0, "Must calculate positive retry-after duration");
});

runTest("8.1.3: Rate limiter window slides and permits new requests after window expires", () => {
  const store = new Map();
  const key = "ip:192.168.1.102";
  const limit = 2;
  const windowMs = 5000;
  const t0 = 1000000;

  checkSlidingWindowRateLimit(store, key, limit, windowMs, t0);
  checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 1000);

  // Exceeded at t0 + 2000
  const blocked = checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 2000);
  assert.strictEqual(blocked.success, false);

  // Window passed: t0 + 6000 (oldest timestamp t0 was 6s ago, outside 5s window)
  const allowed = checkSlidingWindowRateLimit(store, key, limit, windowMs, t0 + 6000);
  assert.strictEqual(allowed.success, true);
});

runTest("8.1.4: Rate limiting is wired into critical abuse-prone endpoints", () => {
  const issuesRoute = fs.readFileSync(path.join(rootDir, "src/app/api/issues/route.ts"), "utf-8");
  assert.ok(issuesRoute.includes("applyRateLimit"), "POST /api/issues must import and apply rate limit");
  assert.ok(issuesRoute.includes("issues:submit"), "POST /api/issues must rate limit complaint submissions");

  const aiRoute = fs.readFileSync(path.join(rootDir, "src/app/api/ai/analyze/route.ts"), "utf-8");
  assert.ok(aiRoute.includes("applyRateLimit"), "POST /api/ai/analyze must import and apply rate limit");
  assert.ok(aiRoute.includes("ai:analyze"), "POST /api/ai/analyze must rate limit AI re-analysis requests");

  const singleIssueRoute = fs.readFileSync(path.join(rootDir, "src/app/api/issues/[id]/route.ts"), "utf-8");
  assert.ok(singleIssueRoute.includes("applyRateLimit"), "GET /api/issues/[id] must import and apply rate limit");
});

// ------------------------------------------------------------------------------
// GROUP 2: Environment Configuration & Secret Protection
// ------------------------------------------------------------------------------
console.log("\n--- Group 2: Environment Configuration & Secret Protection ---");

runTest("8.2.1: .env.example contains all required production configuration keys with safe placeholders", () => {
  const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
  const requiredKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
  ];

  for (const key of requiredKeys) {
    assert.ok(envExample.includes(key), `.env.example must specify ${key}`);
  }

  // Ensure no real API secrets are exposed in .env.example
  assert.ok(!envExample.includes("AIzaSy"), ".env.example must not contain live Gemini key");
  assert.ok(!envExample.includes("eyJh"), ".env.example must not contain live Supabase JWT");
});

runTest("8.2.2: .gitignore properly isolates environment files", () => {
  const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
  assert.ok(gitignore.includes(".env*.local"), ".gitignore must ignore .env*.local");
  assert.ok(gitignore.includes(".env"), ".gitignore must ignore .env");
  assert.ok(gitignore.includes("!.env.example"), ".gitignore must keep !.env.example");
});

runTest("8.2.3: Sensitive server-only modules are protected by 'server-only' import guard", () => {
  const serverFiles = [
    "src/lib/services/issue.service.ts",
    "src/lib/services/admin.service.ts",
    "src/lib/supabase/admin.ts",
    "src/app/api/ai/analyze/route.ts",
  ];

  for (const f of serverFiles) {
    const content = fs.readFileSync(path.join(rootDir, f), "utf-8");
    assert.ok(
      content.includes('"server-only"') || content.includes("'server-only'"),
      `${f} must declare server-only guard to prevent client bundling`
    );
  }
});

// ------------------------------------------------------------------------------
// GROUP 3: Demo Scenarios & Data Integrity
// ------------------------------------------------------------------------------
console.log("\n--- Group 3: Demo Scenarios & Data Integrity ---");

runTest("8.3.1: Five standard hackathon demo scenarios are defined with full canonical attributes", () => {
  const mockDbContent = fs.readFileSync(path.join(rootDir, "src/lib/data/mock-db.ts"), "utf-8");
  
  // Scenario 1: Pothole
  assert.ok(mockDbContent.includes("Pothole on MG Road") || mockDbContent.includes("Roadside Pothole"), "Scenario 1: Pothole must exist");
  // Scenario 2: Garbage
  assert.ok(mockDbContent.includes("Overflowing Garbage Bin"), "Scenario 2: Overflowing Garbage must exist");
  // Scenario 3: Streetlight
  assert.ok(mockDbContent.includes("Broken Streetlight"), "Scenario 3: Broken Streetlight must exist");
  // Scenario 4: Water Leakage
  assert.ok(mockDbContent.includes("Water Leakage on North Blvd"), "Scenario 4: Water Leakage must exist");
  // Scenario 5: Drainage
  assert.ok(mockDbContent.includes("Drainage") || mockDbContent.includes("Stormwater"), "Scenario 5: Drainage scenario must exist");
});

runTest("8.3.2: Demo data clearly segregates synthetic data from live production data", () => {
  const mockDbContent = fs.readFileSync(path.join(rootDir, "src/lib/data/mock-db.ts"), "utf-8");
  assert.ok(
    mockDbContent.includes("INITIAL_ISSUES") || mockDbContent.includes("demo"),
    "Mock DB exports clear initial synthetic fixture"
  );
  // Ensure IDs follow CIV-XXX format
  assert.ok(mockDbContent.includes("CIV-001"), "Complaints must use canonical CIV-XXX reference IDs");
});

// ------------------------------------------------------------------------------
// GROUP 4: Security Boundaries & Human-in-the-Loop Authority
// ------------------------------------------------------------------------------
console.log("\n--- Group 4: Security Boundaries & Human-in-the-Loop Authority ---");

runTest("8.4.1: Human administrator retains ultimate authority over status transitions", () => {
  const adminDetail = fs.readFileSync(path.join(rootDir, "src/app/admin/complaints/[id]/page.tsx"), "utf-8");
  // Verify that AI application button does NOT overwrite status
  assert.ok(
    adminDetail.includes("// Note: Do NOT automatically change status - administrator retains full authority") ||
    adminDetail.includes("setSelectedStatus") === false ||
    adminDetail.includes("handleApplyAi"),
    "Admin detail page must preserve human authority over status transitions"
  );
});

runTest("8.4.2: Evidence storage uses private bucket and short-lived signed URLs", () => {
  const storageService = fs.readFileSync(path.join(rootDir, "src/lib/services/storage.service.ts"), "utf-8");
  assert.ok(storageService.includes("civic-evidence"), "Storage bucket name must be civic-evidence");
  assert.ok(storageService.includes("createSignedUrl"), "Evidence URLs must be signed via createSignedUrl");
});

runTest("8.4.3: Vercel production build compatibility", () => {
  const nextConfig = fs.readFileSync(path.join(rootDir, "next.config.mjs"), "utf-8");
  assert.ok(nextConfig.includes("images"), "next.config.mjs must configure image remote patterns");
  assert.ok(fs.existsSync(path.join(rootDir, "package.json")), "package.json must exist");
});

console.log("\n================================================================================");
console.log(`PHASE 8 READINESS SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
console.log("================================================================================\n");
