import type { MetadataRoute } from "next";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://monkeysworks.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
        { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/freelancers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ];

    // Fetch published blog posts
    try {
        const res = await fetch(`${API}/blog?per_page=100`, { next: { revalidate: 3600 } });
        const json = await res.json();
        const posts = json.data ?? [];

        const blogPages: MetadataRoute.Sitemap = posts.map(
            (post: { slug: string; published_at: string }) => ({
                url: `${SITE_URL}/blog/${post.slug}`,
                lastModified: new Date(post.published_at),
                changeFrequency: "weekly" as const,
                priority: 0.8,
            })
        );

        return [...staticPages, ...blogPages];
    } catch {
        return staticPages;
    }
}
