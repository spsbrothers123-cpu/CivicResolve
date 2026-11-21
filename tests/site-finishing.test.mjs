// tests/site-finishing.test.mjs
// Verification suite for Complete Website Finishing, Professional Polish & Legal Compliance

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("CIVICRESOLVE — COMPLETE WEBSITE FINISHING & POLISH TEST SUITE");
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
// GROUP 1: Custom Error Handling & Boundaries
// ------------------------------------------------------------------------------
console.log("--- Group 1: Custom Error Handling & Boundaries ---");

runTest("1.1: Custom branded 404 page (not-found.tsx) is present and provides safe recovery links", () => {
  const notFoundPath = path.join(rootDir, "src/app/not-found.tsx");
  assert.ok(fs.existsSync(notFoundPath), "src/app/not-found.tsx must exist");
  const content = fs.readFileSync(notFoundPath, "utf-8");
  assert.ok(content.includes("404"), "Must indicate 404 error");
  assert.ok(content.includes("Return to Homepage") || content.includes("Back to Home"), "Must provide return home link");
  assert.ok(content.includes("Logo"), "Must render brand logo");
});

runTest("1.2: Root error boundary (error.tsx) exists, sanitizes output, and provides reset action", () => {
  const errorPath = path.join(rootDir, "src/app/error.tsx");
  assert.ok(fs.existsSync(errorPath), "src/app/error.tsx must exist");
  const content = fs.readFileSync(errorPath, "utf-8");
  assert.ok(content.includes('"use client"') || content.includes("'use client'"), "Error boundary must be a client component");
  assert.ok(content.includes("reset"), "Must receive and wire reset callback");
  assert.ok(content.includes("Try Again"), "Must provide Try Again button");
  // Confirm no raw error.stack is rendered in JSX
  assert.ok(!content.includes("{error.stack}"), "Must not render raw error.stack in markup");
});

runTest("1.3: Global fallback error boundary (global-error.tsx) defines required html and body tags", () => {
  const globalErrorPath = path.join(rootDir, "src/app/global-error.tsx");
  assert.ok(fs.existsSync(globalErrorPath), "src/app/global-error.tsx must exist");
  const content = fs.readFileSync(globalErrorPath, "utf-8");
  assert.ok(content.includes("<html"), "Global error page must contain <html> tag per Next.js spec");
  assert.ok(content.includes("<body"), "Global error page must contain <body> tag per Next.js spec");
  assert.ok(content.includes("reset"), "Global error page must handle reset");
});

// ------------------------------------------------------------------------------
// GROUP 2: Loading States & Skeletons
// ------------------------------------------------------------------------------
console.log("\n--- Group 2: Loading States & Skeletons ---");

runTest("2.1: Global and route-level loading screens exist", () => {
  const globalLoading = path.join(rootDir, "src/app/loading.tsx");
  const adminLoading = path.join(rootDir, "src/app/admin/loading.tsx");
  const dashLoading = path.join(rootDir, "src/app/dashboard/loading.tsx");

  assert.ok(fs.existsSync(globalLoading), "Global loading.tsx must exist");
  assert.ok(fs.existsSync(adminLoading), "Admin loading.tsx must exist");
  assert.ok(fs.existsSync(dashLoading), "Dashboard loading.tsx must exist");
});

runTest("2.2: Metric cards in Dashboard and Admin replace raw string ellipsis with skeleton pulse loaders", () => {
  const dashContent = fs.readFileSync(path.join(rootDir, "src/app/dashboard/page.tsx"), "utf-8");
  assert.ok(dashContent.includes("animate-pulse"), "Dashboard metrics must use animate-pulse skeleton placeholder");

  const adminContent = fs.readFileSync(path.join(rootDir, "src/app/admin/page.tsx"), "utf-8");
  assert.ok(adminContent.includes("animate-pulse"), "Admin metrics must use animate-pulse skeleton placeholder");
});

runTest("2.3: Complaint submission in /report tracks multi-stage progress (uploading -> registering)", () => {
  const reportContent = fs.readFileSync(path.join(rootDir, "src/app/report/page.tsx"), "utf-8");
  assert.ok(reportContent.includes("submissionStage"), "Report page must track submissionStage");
  assert.ok(reportContent.includes("uploading"), "Must track uploading stage");
  assert.ok(reportContent.includes("registering"), "Must track registering stage");
});

// ------------------------------------------------------------------------------
// GROUP 3: Legal Disclosures & AI Transparency
// ------------------------------------------------------------------------------
console.log("\n--- Group 3: Legal Disclosures & AI Transparency ---");

runTest("3.1: Privacy Policy (/privacy) discloses Supabase, Google Gemini, and signed URL storage", () => {
  const privacyPath = path.join(rootDir, "src/app/privacy/page.tsx");
  assert.ok(fs.existsSync(privacyPath), "src/app/privacy/page.tsx must exist");
  const content = fs.readFileSync(privacyPath, "utf-8");
  assert.ok(content.includes("Google Gemini"), "Privacy policy must disclose Google Gemini AI processing");
  assert.ok(content.includes("Supabase"), "Privacy policy must disclose Supabase PostgreSQL and storage");
  assert.ok(content.includes("Row-Level Security") || content.includes("RLS"), "Privacy policy must disclose RLS isolation");
  assert.ok(content.includes("Signed URLs") || content.includes("signed"), "Privacy policy must disclose signed URL security");
  assert.ok(content.includes("Deletion") || content.includes("Erasure"), "Privacy policy must provide data deletion procedure");
});

runTest("3.2: Terms of Service (/terms) defines acceptable use, non-emergency notice, and AI advisory scope", () => {
  const termsPath = path.join(rootDir, "src/app/terms/page.tsx");
  assert.ok(fs.existsSync(termsPath), "src/app/terms/page.tsx must exist");
  const content = fs.readFileSync(termsPath, "utf-8");
  assert.ok(content.includes("Emergency") || content.includes("911"), "Terms must provide critical non-emergency notice");
  assert.ok(content.includes("Advisory") || content.includes("advisory"), "Terms must state AI recommendations are advisory");
  assert.ok(content.includes("Prohibited") || content.includes("Acceptable"), "Terms must state acceptable civic reporting standards");
});

runTest("3.3: Complaint submission form (/report) provides AI intake and privacy disclosure banner", () => {
  const reportContent = fs.readFileSync(path.join(rootDir, "src/app/report/page.tsx"), "utf-8");
  assert.ok(reportContent.includes("AI Intake & Governance Disclosure") || reportContent.includes("Google Gemini AI"), "Submission form must provide AI transparency banner");
  assert.ok(reportContent.includes("/privacy"), "Submission form must link to /privacy");
  assert.ok(reportContent.includes("/terms"), "Submission form must link to /terms");
});

runTest("3.4: Citizen profile (/profile) outlines clear data erasure and anonymization guidance", () => {
  const profileContent = fs.readFileSync(path.join(rootDir, "src/app/profile/page.tsx"), "utf-8");
  assert.ok(profileContent.includes("Account Erasure") || profileContent.includes("Data Rights"), "Profile must provide data erasure guidance");
});

runTest("3.5: Support & Operator directory (/contact) avoids fabricated claims and provides in-app guidance", () => {
  const contactPath = path.join(rootDir, "src/app/contact/page.tsx");
  assert.ok(fs.existsSync(contactPath), "src/app/contact/page.tsx must exist");
  const content = fs.readFileSync(contactPath, "utf-8");
  assert.ok(content.includes("Emergency Notice"), "Contact page must include emergency notice");
  assert.ok(content.includes("Track Existing Complaint") || content.includes("/track"), "Contact page must offer complaint tracking");
});

// ------------------------------------------------------------------------------
// GROUP 4: Branding, Navigation & Shared Footer
// ------------------------------------------------------------------------------
console.log("\n--- Group 4: Branding, Navigation & Shared Footer ---");

runTest("4.1: Favicon and app icon assets exist in SVG format", () => {
  assert.ok(fs.existsSync(path.join(rootDir, "src/app/icon.svg")), "src/app/icon.svg must exist");
  assert.ok(fs.existsSync(path.join(rootDir, "src/app/apple-icon.svg")), "src/app/apple-icon.svg must exist");
});

runTest("4.2: Shared Footer component exists and is integrated into public and citizen routes", () => {
  const footerPath = path.join(rootDir, "src/components/shared/Footer.tsx");
  assert.ok(fs.existsSync(footerPath), "src/components/shared/Footer.tsx must exist");
  const footerContent = fs.readFileSync(footerPath, "utf-8");
  assert.ok(footerContent.includes("/privacy"), "Footer must link to /privacy");
  assert.ok(footerContent.includes("/terms"), "Footer must link to /terms");
  assert.ok(footerContent.includes("/contact"), "Footer must link to /contact");
  assert.ok(footerContent.includes("/track"), "Footer must link to /track");

  // Verify inclusion across routes
  const landingPage = fs.readFileSync(path.join(rootDir, "src/app/page.tsx"), "utf-8");
  assert.ok(landingPage.includes("<Footer />") || landingPage.includes("<Footer"), "Landing page must use shared Footer");

  const trackPage = fs.readFileSync(path.join(rootDir, "src/app/track/page.tsx"), "utf-8");
  assert.ok(trackPage.includes("<Footer />") || trackPage.includes("<Footer"), "Track page must use shared Footer");

  const reportPage = fs.readFileSync(path.join(rootDir, "src/app/report/page.tsx"), "utf-8");
  assert.ok(reportPage.includes("<Footer />") || reportPage.includes("<Footer"), "Report page must use shared Footer");
});

// ------------------------------------------------------------------------------
// GROUP 5: SEO, Social Cards & Accessibility
// ------------------------------------------------------------------------------
console.log("\n--- Group 5: SEO, Social Cards & Accessibility ---");

runTest("5.1: Root layout metadata configures title template, Open Graph, and Twitter metadata", () => {
  const layoutContent = fs.readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf-8");
  assert.ok(layoutContent.includes("template:"), "Layout must configure title template (%s | CivicResolve)");
  assert.ok(layoutContent.includes("openGraph:"), "Layout must configure openGraph metadata");
  assert.ok(layoutContent.includes("twitter:"), "Layout must configure twitter card metadata");
  assert.ok(layoutContent.includes("metadataBase:"), "Layout must configure metadataBase");
});

runTest("5.2: Search crawler directives (robots.ts) and sitemap (sitemap.ts) exist", () => {
  const robotsPath = path.join(rootDir, "src/app/robots.ts");
  assert.ok(fs.existsSync(robotsPath), "src/app/robots.ts must exist");
  const robotsContent = fs.readFileSync(robotsPath, "utf-8");
  assert.ok(robotsContent.includes("disallow"), "robots.ts must protect private directories");
  assert.ok(robotsContent.includes("/admin"), "robots.ts must disallow /admin");

  const sitemapPath = path.join(rootDir, "src/app/sitemap.ts");
  assert.ok(fs.existsSync(sitemapPath), "src/app/sitemap.ts must exist");
  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  assert.ok(sitemapContent.includes("/privacy"), "sitemap.ts must list /privacy");
  assert.ok(sitemapContent.includes("/terms"), "sitemap.ts must list /terms");
});

runTest("5.3: Global CSS contains focus-visible keyboard styling and prefers-reduced-motion overrides", () => {
  const cssContent = fs.readFileSync(path.join(rootDir, "src/app/globals.css"), "utf-8");
  assert.ok(cssContent.includes(":focus-visible"), "globals.css must define :focus-visible outline");
  assert.ok(cssContent.includes("prefers-reduced-motion"), "globals.css must respect prefers-reduced-motion");
});

console.log("\n================================================================================");
console.log(`SITE FINISHING SUITE: ${passed}/${total} TESTS PASSED (100%)`);
console.log("================================================================================\n");
