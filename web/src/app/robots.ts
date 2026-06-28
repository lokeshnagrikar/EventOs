import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://eventos.io";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/portal/settings/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
