import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private areas, auth, tracked redirects, and APIs are never indexed.
        disallow: [
          "/admin",
          "/brand-dashboard",
          "/auth",
          "/go/",
          "/api/",
          "/newsletter/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
