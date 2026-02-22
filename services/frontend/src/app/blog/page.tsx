import type { Metadata } from "next";
import BlogIndexClient from "./BlogIndexClient";

export const metadata: Metadata = {
    title: "Blog — MonkeysWork | Freelancing Insights & Platform News",
    description:
        "Read the latest articles on freelancing, hiring remote talent, AI-powered project management, and MonkeysWork platform updates.",
    openGraph: {
        title: "Blog — MonkeysWork",
        description:
            "Freelancing insights, hiring tips, and platform news from MonkeysWork.",
        type: "website",
        siteName: "MonkeysWork",
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog — MonkeysWork",
        description:
            "Freelancing insights, hiring tips, and platform news from MonkeysWork.",
    },
};

export default function BlogPage() {
    return <BlogIndexClient />;
}
