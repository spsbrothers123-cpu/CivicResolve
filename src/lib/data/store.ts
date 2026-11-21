/**
 * @deprecated
 * CIVICRESOLVE — LEGACY DEMO-ONLY DATA STORE
 *
 * This module is preserved strictly as an offline demo fallback when no Supabase
 * backend is configured. It is NOT the primary production data store.
 * The primary production backend is Supabase PostgreSQL (via /api/issues and Supabase SDK).
 */

import { useState, useEffect } from "react";
import { Issue, IssueStatus, MunicipalDepartment, IssuePriority } from "@/types";
import { INITIAL_ISSUES } from "./mock-db";

const STORAGE_KEY = "civicresolve_demo_issues_backup";

export function getDemoStoredIssues(): Issue[] {
  if (typeof window === "undefined") {
    return INITIAL_ISSUES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_ISSUES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ISSUES;
  }
}

export function saveDemoStoredIssues(issues: Issue[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch (e) {
    console.warn("Could not save demo issues to localStorage:", e);
  }
}
