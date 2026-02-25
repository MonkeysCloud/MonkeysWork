import { Suspense } from "react";
import type { Metadata } from "next";
import BlogIndexClient from "./BlogIndexClient";

export const metadata: Metadata = {
    title: "Blog — MonkeysWorks | Freelancing Insights & Platform News",
    description:
        "Read the latest articles on freelancing, hiring remote talent, AI-powered project management, and MonkeysWorks platform updates.",
    openGraph: {
        title: "Blog — MonkeysWorks",
        description:
            "Freelancing insights, hiring tips, and platform news from MonkeysWorks.",
        type: "website",
        siteName: "MonkeysWorks",
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog — MonkeysWorks",
        description:
            "Freelancing insights, hiring tips, and platform news from MonkeysWorks.",
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
