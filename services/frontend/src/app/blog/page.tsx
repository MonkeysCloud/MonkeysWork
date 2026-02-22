import { Suspense } from "react";
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
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-brand-surface flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-orange border-t-transparent" />
            </div>
        }>
            <BlogIndexClient />
        </Suspense>
    );
}
