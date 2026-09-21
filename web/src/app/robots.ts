import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.eventosapp.in";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/portal/settings/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
