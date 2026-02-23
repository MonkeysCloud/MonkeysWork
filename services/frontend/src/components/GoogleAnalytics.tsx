"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Checks localStorage for analytics consent */
function hasConsent(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const raw = localStorage.getItem("mw_cookie_consent");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return parsed?.consent?.analytics === true;
    } catch {
        return false;
    }
}

/** Send a pageview to GA */
export function gaPageview(url: string) {
    if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
    window.gtag("config", GA_ID, { page_path: url });
}

/** Send a custom event to GA */
export function gaEvent(action: string, params?: Record<string, unknown>) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", action, params);
}

/** Declare gtag on window */
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}

export default function GoogleAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [consentGiven, setConsentGiven] = useState(false);

    // Check consent on mount and listen for updates
    useEffect(() => {
        setConsentGiven(hasConsent());
        const handler = () => setConsentGiven(hasConsent());
        window.addEventListener("cookie_consent_update", handler);
        return () => window.removeEventListener("cookie_consent_update", handler);
    }, []);

    // Track page views
    useEffect(() => {
        if (!consentGiven || !GA_ID) return;
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        gaPageview(url);
    }, [pathname, searchParams, consentGiven]);

    if (!GA_ID || !consentGiven) return null;

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_ID}', {
                            page_path: window.location.pathname,
                            anonymize_ip: true,
                            cookie_flags: 'SameSite=None;Secure',
                        });
                    `,
                }}
            />
        </>
    );
}
