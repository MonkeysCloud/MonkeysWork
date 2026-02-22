import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://monkeysworks.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard/", "/api/", "/login", "/register"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
