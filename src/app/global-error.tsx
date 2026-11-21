"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CivicResolve Global Root Error]:", error?.message);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#F5F5EF", color: "#102C35" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "32px", border: "1px solid #E2E8F0", textAlign: "center", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#102C35", color: "#D6F36A", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontWeight: "bold", fontSize: "20px" }}>
              CR
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px 0" }}>
              System Temporarily Unavailable
            </h1>
            <p style={{ fontSize: "14px", color: "#71838A", lineHeight: "1.6", margin: "0 0 24px 0" }}>
              The civic portal experienced an unexpected initialization error. Please reload the application.
            </p>
            <button
              onClick={() => reset()}
              style={{ padding: "12px 24px", backgroundColor: "#102C35", color: "#FFFFFF", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
