import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://eventos.agency";
  const routes = [
    "",
    "/pricing",
    "/privacy",
    "/terms",
    "/refund",
    "/cookies",
    "/sla",
    "/contact",
    "/solutions",
    "/about",
    "/demo"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/pricing" || route === "/contact" ? 0.9 : 0.8,
  }));
}
