"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Region → Country code mappings ──────────────────── */
const REGIONS: Record<string, { label: string; emoji: string; countries: string[] }> = {
    latam: {
        label: "Latin America", emoji: "🌎",
        countries: ["MX", "BR", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "DO", "HN", "PY", "PA", "CR", "SV", "UY", "NI", "BO"],
    },
    na: {
        label: "North America", emoji: "🌎",
        countries: ["US", "CA"],
    },
    europe: {
        label: "Europe", emoji: "🌍",
        countries: ["GB", "DE", "FR", "ES", "IT", "NL", "PT", "SE", "NO", "DK", "FI", "PL", "CZ", "AT", "CH", "BE", "IE", "RO", "UA", "HR", "BG", "GR"],
    },
    asia: {
        label: "Asia", emoji: "🌏",
        countries: ["IN", "CN", "JP", "KR", "PH", "VN", "TH", "ID", "MY", "SG", "BD", "PK", "LK", "NP"],
    },
    africa: {
        label: "Africa", emoji: "🌍",
        countries: ["NG", "ZA", "KE", "GH", "EG", "MA", "TZ", "UG", "ET", "CM", "SN"],
    },
    oceania: {
        label: "Oceania", emoji: "🌏",
        countries: ["AU", "NZ"],
    },
    mena: {
        label: "Middle East", emoji: "🌍",
        countries: ["AE", "SA", "IL", "TR", "QA", "KW", "BH", "OM", "JO", "LB"],
    },
};

const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
    CO: "Colombia", CL: "Chile", PE: "Peru", VE: "Venezuela", EC: "Ecuador",
    GT: "Guatemala", CU: "Cuba", DO: "Dominican Rep.", HN: "Honduras", PY: "Paraguay",
    PA: "Panama", CR: "Costa Rica", SV: "El Salvador", UY: "Uruguay", NI: "Nicaragua",
    BO: "Bolivia", GB: "United Kingdom", DE: "Germany", FR: "France", ES: "Spain",
    IT: "Italy", NL: "Netherlands", PT: "Portugal", SE: "Sweden", NO: "Norway",
    DK: "Denmark", FI: "Finland", PL: "Poland", CZ: "Czechia", AT: "Austria",
    CH: "Switzerland", BE: "Belgium", IE: "Ireland", RO: "Romania", UA: "Ukraine",
    HR: "Croatia", BG: "Bulgaria", GR: "Greece", IN: "India", CN: "China",
    JP: "Japan", KR: "South Korea", PH: "Philippines", VN: "Vietnam", TH: "Thailand",
    ID: "Indonesia", MY: "Malaysia", SG: "Singapore", BD: "Bangladesh", PK: "Pakistan",
    LK: "Sri Lanka", NP: "Nepal", NG: "Nigeria", ZA: "South Africa", KE: "Kenya",
    GH: "Ghana", EG: "Egypt", MA: "Morocco", TZ: "Tanzania", UG: "Uganda",
    ET: "Ethiopia", CM: "Cameroon", SN: "Senegal", AU: "Australia", NZ: "New Zealand",
    AE: "UAE", SA: "Saudi Arabia", IL: "Israel", TR: "Turkey", QA: "Qatar",
    KW: "Kuwait", BH: "Bahrain", OM: "Oman", JO: "Jordan", LB: "Lebanon",
};

/* sorted list for dropdown */
const SORTED_COUNTRIES = Object.entries(COUNTRY_NAMES)
    .sort(([, a], [, b]) => a.localeCompare(b));

/* ── Types ─────────────────────────────────── */
interface Freelancer {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    email: string;
    country: string | null;
    headline: string | null;
    hourly_rate: string | null;
    avg_rating: string | null;
    total_jobs_completed: number;
    availability_status: string | null;
    verification_level: string | null;
    skills: { name: string; slug: string }[];
}

interface Skill {
    id: string;
    name: string;
    slug: string;
}

interface Job {
    id: string;
    title: string;
    status: string;
}

/* ── TagInput: reusable multi-select with dropdown ── */
function TagInput<T extends { key: string; label: string; group?: string }>({
    tags,
    onRemove,
    placeholder,
    searchValue,
    onSearchChange,
    dropdownOpen,
    onDropdownOpen,
    onDropdownClose,
    items,
    onSelect,
    groupLabels,
}: {
    tags: { key: string; label: string }[];
    onRemove: (key: string) => void;
    placeholder: string;
    searchValue: string;
    onSearchChange: (v: string) => void;
    dropdownOpen: boolean;
    onDropdownOpen: () => void;
    onDropdownClose: () => void;
    items: T[];
    onSelect: (item: T) => void;
    groupLabels?: Record<string, string>;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onDropdownClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onDropdownClose]);

    /* group items */
    const grouped: Record<string, T[]> = {};
    for (const item of items) {
        const g = item.group || "__default";
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(item);
    }

    return (
        <div className="relative" ref={ref}>
            <div
                className="w-full min-h-[42px] px-3 py-1.5 rounded-lg border border-brand-border bg-gray-50 text-sm flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange/40 transition-all"
                onClick={onDropdownOpen}
            >
                {tags.map((tag) => (
                    <span
                        key={tag.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-xs font-medium rounded-full animate-[fadeIn_0.15s_ease-out]"
                    >
                        {tag.label}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(tag.key);
                            }}
                            className="hover:text-red-500 transition-colors"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        onDropdownOpen();
                    }}
                    onFocus={onDropdownOpen}
                    placeholder={tags.length ? "" : placeholder}
                    className="flex-1 min-w-[80px] bg-transparent outline-none text-sm text-brand-dark placeholder-brand-muted/50 py-1"
                />
            </div>

            {dropdownOpen && items.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-brand-border shadow-xl max-h-56 overflow-y-auto">
                    {Object.entries(grouped).map(([group, groupItems]) => (
                        <div key={group}>
                            {group !== "__default" && groupLabels?.[group] && (
                                <div className="px-3 py-1.5 text-[10px] font-bold text-brand-muted/60 uppercase tracking-wider bg-gray-50 sticky top-0">
                                    {groupLabels[group]}
                                </div>
                            )}
                            {groupItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => onSelect(item)}
                                    className="w-full text-left px-3 py-2 text-sm text-brand-dark hover:bg-brand-orange/5 hover:text-brand-orange transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── FreelancerCard ──────────────────────── */
function FreelancerCard({
    f,
    selected,
    onToggle,
}: {
    f: Freelancer;
    selected: boolean;
    onToggle: () => void;
}) {
    const rating = f.avg_rating ? parseFloat(f.avg_rating) : 0;

    return (
        <div
            className={`
                relative bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg group cursor-pointer
                ${selected
                    ? "border-brand-orange shadow-[0_0_0_3px_rgba(240,138,17,0.15)]"
                    : "border-brand-border/60 hover:border-brand-orange/40"
                }
            `}
            onClick={onToggle}
        >
            {/* Selection checkbox */}
            <div className="absolute top-3 right-3 z-10">
                <div
                    className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150
                        ${selected
                            ? "bg-brand-orange border-brand-orange"
                            : "border-gray-300 bg-white group-hover:border-brand-orange/50"
                        }
                    `}
                >
                    {selected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="p-5">
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-3">
                    {f.avatar_url ? (
                        <img
                            src={f.avatar_url.startsWith("http") ? f.avatar_url : `${new URL(API).origin}${f.avatar_url}`}
                            alt={f.display_name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center text-brand-orange font-bold text-base flex-shrink-0">
                            {f.display_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/freelancers/${f.user_id}`}
                            className="text-sm font-bold text-brand-dark hover:text-brand-orange transition-colors block truncate"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {f.display_name}
                        </Link>
                        {f.headline && (
                            <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">{f.headline}</p>
                        )}
                        {f.country && (
                            <span className="text-[11px] text-brand-muted/70 mt-0.5 block">
                                📍 {COUNTRY_NAMES[f.country] || f.country}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-3 text-xs">
                    {f.hourly_rate && (
                        <span className="font-semibold text-brand-dark">
                            ${parseFloat(f.hourly_rate).toFixed(0)}/hr
                        </span>
                    )}
                    {rating > 0 && (
                        <span className="text-amber-500 font-medium">
                            ★ {rating.toFixed(1)}
                        </span>
                    )}
                    <span className="text-brand-muted">
                        {f.total_jobs_completed} job{f.total_jobs_completed !== 1 ? "s" : ""}
                    </span>
                    {f.availability_status === "available" && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full">
                            Available
                        </span>
                    )}
                </div>

                {/* Skills */}
                {f.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {f.skills.slice(0, 5).map((s) => (
                            <span
                                key={s.slug}
                                className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full"
                            >
                                {s.name}
                            </span>
                        ))}
                        {f.skills.length > 5 && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-400 rounded-full">
                                +{f.skills.length - 5}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── InviteModal ─────────────────────────── */
function InviteModal({
    selected,
    jobs,
    onClose,
    onInvite,
    sending,
}: {
    selected: Freelancer[];
    jobs: Job[];
    onClose: () => void;
    onInvite: (jobId: string, message: string) => void;
    sending: boolean;
}) {
    const [jobId, setJobId] = useState("");
    const [message, setMessage] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-[slideUp_0.2s_ease-out]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <h3 className="text-lg font-bold text-brand-dark mb-1">Invite to Job</h3>
                <p className="text-sm text-brand-muted mb-4">
                    Invite {selected.length} freelancer{selected.length > 1 ? "s" : ""} to apply to your job posting.
                </p>

                {/* Selected freelancers */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {selected.map((f) => (
                        <span
                            key={f.user_id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-orange/10 text-brand-orange text-xs font-medium rounded-full"
                        >
                            {f.display_name}
                        </span>
                    ))}
                </div>

                {/* Job select */}
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">Select Job</label>
                <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-white text-sm text-brand-dark focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none mb-4"
                >
                    <option value="">Choose a job posting...</option>
                    {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                            {j.title} ({j.status})
                        </option>
                    ))}
                </select>

                {/* Message */}
                <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                    Personal Message <span className="font-normal text-brand-muted">(optional)</span>
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Tell them why you think they'd be a great fit..."
                    className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-white text-sm text-brand-dark focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none resize-none mb-5"
                />

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onInvite(jobId, message)}
                        disabled={!jobId || sending}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange rounded-lg hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow-md"
                    >
                        {sending ? "Sending..." : `Send Invite${selected.length > 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────── */
/* ── Main Page ───────────────────────────── */
/* ─────────────────────────────────────────── */
export default function FindTalentPage() {
    const { token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ── Helper: resolve a location key to a display label ── */
    const locationKeyToLabel = (key: string): string => {
        if (key.startsWith("region:")) {
            const r = REGIONS[key.replace("region:", "")];
            return r ? `${r.emoji} ${r.label}` : key;
        }
        if (key.startsWith("country:")) {
            const code = key.replace("country:", "");
            return COUNTRY_NAMES[code] || code;
        }
        return key;
    };

    /* ── Initialize state from URL query params ── */
    const initSearch = searchParams.get("search") || "";
    const initPage = parseInt(searchParams.get("page") || "1", 10) || 1;
    const initLocationKeys = (searchParams.get("location") || "").split(",").filter(Boolean);
    const initSkillKeys = (searchParams.get("skills") || "").split(",").filter(Boolean);

    /* ── Data state ── */
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(initPage);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ── Filter state ── */
    const [search, setSearch] = useState(initSearch);

    const [locationTags, setLocationTags] = useState<{ key: string; label: string }[]>(
        initLocationKeys.map((k) => ({ key: k, label: locationKeyToLabel(k) }))
    );
    const [locationSearch, setLocationSearch] = useState("");
    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

    const [skillTags, setSkillTags] = useState<{ key: string; label: string }[]>(
        initSkillKeys.map((k) => ({ key: k, label: k }))
    );
    const [skillSearch, setSkillSearch] = useState("");
    const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
    const [availSkills, setAvailSkills] = useState<Skill[]>([]);

    /* ── Selection & invite ── */
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showInvite, setShowInvite] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [sending, setSending] = useState(false);

    const perPage = 20;
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);

    /* ── Sync filters → URL ── */
    const syncUrl = useCallback(
        (s: string, loc: { key: string }[], sk: { key: string }[], p: number) => {
            const params = new URLSearchParams();
            if (s.trim()) params.set("search", s.trim());
            if (loc.length > 0) params.set("location", loc.map((t) => t.key).join(","));
            if (sk.length > 0) params.set("skills", sk.map((t) => t.key).join(","));
            if (p > 1) params.set("page", String(p));
            const qs = params.toString();
            router.replace(`/dashboard/freelancers${qs ? `?${qs}` : ""}`, { scroll: false });
        },
        [router]
    );

    /* ── Resolve location tags → country codes for API ── */
    const resolveCountryCodes = useCallback((): string[] => {
        const codes = new Set<string>();
        for (const tag of locationTags) {
            if (tag.key.startsWith("region:")) {
                const regionKey = tag.key.replace("region:", "");
                const region = REGIONS[regionKey];
                if (region) region.countries.forEach((c) => codes.add(c));
            } else if (tag.key.startsWith("country:")) {
                codes.add(tag.key.replace("country:", ""));
            }
        }
        return Array.from(codes);
    }, [locationTags]);

    /* ── Fetch freelancers ── */
    const fetchFreelancers = useCallback(
        async (p: number) => {
            if (!token) return;
            setLoading(true);
            setError("");
            try {
                const params = new URLSearchParams();
                params.set("page", String(p));
                params.set("per_page", String(perPage));

                if (search.trim()) params.set("search", search.trim());

                const countryCodes = resolveCountryCodes();
                if (countryCodes.length > 0) params.set("country", countryCodes.join(","));

                const skillSlugs = skillTags.map((t) => t.key);
                if (skillSlugs.length > 0) params.set("skills", skillSlugs.join(","));

                const res = await fetch(`${API}/freelancers?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`API error: ${res.status}`);

                const json = await res.json();
                setFreelancers(json.data ?? []);
                setTotal(json.meta?.total ?? 0);
            } catch (err: unknown) {
                console.error("[FindTalent] fetch error:", err);
                setError("Failed to load freelancers");
                setFreelancers([]);
            } finally {
                setLoading(false);
            }
        },
        [token, search, resolveCountryCodes, skillTags]
    );

    /* ── Load skills ── */
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/skills?per_page=200`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => {
                setAvailSkills(j.data ?? []);
                // Backfill skill labels from API data
                if (initSkillKeys.length > 0 && j.data) {
                    const skillMap = new Map((j.data as Skill[]).map((s) => [s.slug, s.name]));
                    setSkillTags((prev) =>
                        prev.map((t) => ({ key: t.key, label: skillMap.get(t.key) || t.key }))
                    );
                }
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    /* ── Load jobs ── */
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/jobs?per_page=100`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => {
                const allJobs = j.data ?? [];
                setJobs(allJobs.filter((job: Job) => job.status === "open" || job.status === "draft"));
            })
            .catch(() => { });
    }, [token]);

    /* ── Debounced filter effect → fetch + URL sync ── */
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            if (isInitialMount.current) {
                isInitialMount.current = false;
                fetchFreelancers(page);
                return;
            }
            setPage(1);
            fetchFreelancers(1);
            syncUrl(search, locationTags, skillTags, 1);
        }, 400);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, locationTags, skillTags, token]);

    /* ── Page change ── */
    useEffect(() => {
        if (isInitialMount.current) return;
        fetchFreelancers(page);
        syncUrl(search, locationTags, skillTags, page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    /* ── Location dropdown items ── */
    const locationItems = (() => {
        const selectedKeys = new Set(locationTags.map((t) => t.key));
        const items: { key: string; label: string; group: string }[] = [];
        const q = locationSearch.toLowerCase();

        // Regions
        for (const [rKey, { label, emoji }] of Object.entries(REGIONS)) {
            const key = `region:${rKey}`;
            if (selectedKeys.has(key)) continue;
            if (q && !label.toLowerCase().includes(q)) continue;
            items.push({ key, label: `${emoji} ${label}`, group: "regions" });
        }

        // Countries
        for (const [code, name] of SORTED_COUNTRIES) {
            const key = `country:${code}`;
            if (selectedKeys.has(key)) continue;
            if (q && !name.toLowerCase().includes(q) && !code.toLowerCase().includes(q)) continue;
            items.push({ key, label: `${name}`, group: "countries" });
        }

        return items.slice(0, 25);
    })();

    /* ── Skills dropdown items ── */
    const skillItems = (() => {
        const selectedSlugs = new Set(skillTags.map((t) => t.key));
        const q = skillSearch.toLowerCase();
        return availSkills
            .filter((s) => !selectedSlugs.has(s.slug) && (!q || s.name.toLowerCase().includes(q)))
            .slice(0, 20)
            .map((s) => ({ key: s.slug, label: s.name, group: "__default" }));
    })();

    /* ── Helpers ── */
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === freelancers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(freelancers.map((f) => f.user_id)));
        }
    };

    const selectedFreelancers = freelancers.filter((f) => selectedIds.has(f.user_id));

    const handleInvite = async (jobId: string, message: string) => {
        if (!token || !jobId) return;
        setSending(true);
        try {
            for (const f of selectedFreelancers) {
                await fetch(`${API}/jobs/${jobId}/invite`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        freelancer_id: f.user_id,
                        message: message || undefined,
                    }),
                });
            }
            setShowInvite(false);
            setSelectedIds(new Set());
            alert(`Invited ${selectedFreelancers.length} freelancer${selectedFreelancers.length > 1 ? "s" : ""} successfully!`);
        } catch {
            alert("Failed to send invitations. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const totalPages = Math.ceil(total / perPage);
    const hasFilters = search || locationTags.length > 0 || skillTags.length > 0;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">Find Talent</h1>
                    <p className="text-sm text-brand-muted mt-0.5">
                        Search, filter, and invite freelancers to your projects
                    </p>
                </div>
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-orange rounded-lg hover:bg-brand-orange/90 transition-all duration-150 shadow-md hover:shadow-lg"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 2L11 13" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                        Invite {selectedIds.size} to Job
                    </button>
                )}
            </div>

            {/* Filters bar */}
            <div className="bg-white rounded-xl border border-brand-border/60 p-4 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-4 relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted/60 pointer-events-none"
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-brand-border bg-gray-50 text-sm text-brand-dark placeholder-brand-muted/50 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange/40 outline-none transition-all"
                        />
                    </div>

                    {/* Location multi-select */}
                    <div className="lg:col-span-4">
                        <TagInput
                            tags={locationTags}
                            onRemove={(key) =>
                                setLocationTags((prev) => prev.filter((t) => t.key !== key))
                            }
                            placeholder="🌍 Filter by region or country..."
                            searchValue={locationSearch}
                            onSearchChange={setLocationSearch}
                            dropdownOpen={locationDropdownOpen}
                            onDropdownOpen={() => setLocationDropdownOpen(true)}
                            onDropdownClose={() => setLocationDropdownOpen(false)}
                            items={locationItems}
                            onSelect={(item) => {
                                setLocationTags((prev) => [
                                    ...prev,
                                    { key: item.key, label: item.label },
                                ]);
                                setLocationSearch("");
                            }}
                            groupLabels={{
                                regions: "Regions",
                                countries: "Countries",
                            }}
                        />
                    </div>

                    {/* Skills multi-select */}
                    <div className="lg:col-span-3">
                        <TagInput
                            tags={skillTags}
                            onRemove={(key) =>
                                setSkillTags((prev) => prev.filter((t) => t.key !== key))
                            }
                            placeholder="Filter by skills..."
                            searchValue={skillSearch}
                            onSearchChange={setSkillSearch}
                            dropdownOpen={skillDropdownOpen}
                            onDropdownOpen={() => setSkillDropdownOpen(true)}
                            onDropdownClose={() => setSkillDropdownOpen(false)}
                            items={skillItems}
                            onSelect={(item) => {
                                setSkillTags((prev) => [
                                    ...prev,
                                    { key: item.key, label: item.label },
                                ]);
                                setSkillSearch("");
                            }}
                        />
                    </div>

                    {/* Clear */}
                    <div className="lg:col-span-1 flex items-center justify-center">
                        {hasFilters && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setLocationTags([]);
                                    setSkillTags([]);
                                }}
                                className="text-xs font-medium text-brand-muted hover:text-red-500 transition-colors whitespace-nowrap"
                                title="Clear all filters"
                            >
                                ✕ Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Results toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={selectAll}
                        className="text-xs font-medium text-brand-muted hover:text-brand-orange transition-colors"
                    >
                        {selectedIds.size === freelancers.length && freelancers.length > 0
                            ? "Deselect All"
                            : "Select All"}
                    </button>
                    <span className="text-xs text-brand-muted">
                        {total} freelancer{total !== 1 ? "s" : ""} found
                        {selectedIds.size > 0 && (
                            <span className="text-brand-orange font-semibold ml-1">
                                · {selectedIds.size} selected
                            </span>
                        )}
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-dark disabled:opacity-30 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className="text-xs font-medium text-brand-dark px-2">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-dark disabled:opacity-30 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-brand-muted">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm font-medium">Loading freelancers...</span>
                    </div>
                </div>
            ) : freelancers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-brand-border/60">
                    <span className="text-5xl mb-4 block">🔍</span>
                    <h3 className="text-lg font-bold text-brand-dark mb-1">No freelancers found</h3>
                    <p className="text-sm text-brand-muted">
                        {hasFilters
                            ? "Try adjusting your search or filters"
                            : "No freelancers have registered yet"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {freelancers.map((f) => (
                        <FreelancerCard
                            key={f.user_id}
                            f={f}
                            selected={selectedIds.has(f.user_id)}
                            onToggle={() => toggleSelect(f.user_id)}
                        />
                    ))}
                </div>
            )}

            {/* Bottom pagination */}
            {totalPages > 1 && !loading && (
                <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let p: number;
                            if (totalPages <= 7) p = i + 1;
                            else if (page <= 4) p = i + 1;
                            else if (page >= totalPages - 3) p = totalPages - 6 + i;
                            else p = page - 3 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 ${p === page
                                        ? "bg-brand-orange text-white shadow-sm"
                                        : "text-brand-muted hover:bg-gray-100 hover:text-brand-dark"
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInvite && (
                <InviteModal
                    selected={selectedFreelancers}
                    jobs={jobs}
                    onClose={() => setShowInvite(false)}
                    onInvite={handleInvite}
                    sending={sending}
                />
            )}
        </div>
    );
}
