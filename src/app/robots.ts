import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://civicresolve.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/track", "/login", "/privacy", "/terms", "/contact"],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/complaints",
          "/complaints/*",
          "/profile",
          "/profile/*",
          "/report",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
