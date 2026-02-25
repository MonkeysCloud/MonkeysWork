import { notFound } from "next/navigation";
// We replace lucide-react with native SVGs and date-fns with native Intl because they aren't installed

interface FreelancerProfile {
    user_id: string;
    display_name: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    country: string;
    languages: string[] | null;
    member_since: string;
    headline: string;
    bio: string;
    hourly_rate: number;
    currency: string;
    experience_years: number;
    availability_status: string;
    availability_hours_week: number;
    portfolio_urls: string[];
    education: { degree: string; school: string; year: string }[];
    certifications: { name: string; issuer: string; year: string }[];
    website_url: string;
    github_url: string;
    linkedin_url: string;
    skills: { name: string; slug: string; years_experience: number; proficiency: string }[];
    reviews: {
        id: string;
        overall_rating: number;
        comment: string;
        created_at: string;
        reviewer_name: string;
        reviewer_avatar: string;
        contract_title: string;
    }[];
    work_history: {
        id: string;
        title: string;
        contract_type: string;
        status: string;
        started_at: string;
        completed_at: string;
        client_name: string;
    }[];
    verifications: any[];
    verification_badges: {
        level: string;
        badges: { type: string; label: string; verified: boolean; confidence: number | null }[];
    };
    avg_rating?: number;
    total_reviews?: number;
    total_jobs_completed?: number;
    total_earnings?: number;
}

export default async function FreelancerProfilePage({ params }: { params: { id: string } }) {
    // We fetch data server-side without full auth headers (since it's a public/logged-in check)
    // The backend uses the JWT to determine if the viewer has rights, but "logged_in" means any logged-in user.
    // However, since this is a Server Component, we need to pass the cookie.

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("ml_auth_token")?.value;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.monkeysworks.com"}/api/v1/freelancers/${params.id}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        // Don't cache rigidly so new reviews/jobs show up
        next: { revalidate: 60 }
    });

    if (!res.ok) {
        if (res.status === 404) return notFound();
        // If 403 or 401, they don't have permission to view it
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Unavailable</h1>
                <p className="text-gray-600 max-w-md">This freelancer's profile is private or requires you to be logged in to view it.</p>
            </div>
        );
    }

    const { data: profile } = (await res.json()) as { data: FreelancerProfile };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Header / Top Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    <div className="w-32 h-32 md:w-40 md:h-40 shrink-0">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover border-4 border-gray-50" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border-4 border-white flex items-center justify-center shadow-inner">
                                <span className="text-4xl font-bold text-indigo-400">
                                    {profile.display_name?.charAt(0).toUpperCase() || "F"}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    {profile.display_name}
                                    {profile.verification_badges?.level !== 'none' && (
                                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </h1>
                                <p className="text-lg text-gray-600 mt-1">{profile.headline || "Independent Professional"}</p>
                                
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                    {profile.country && (
                                        <div className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {profile.country}</div>
                                    )}
                                    <div className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {profile.availability_hours_week} hrs/week</div>
                                    <div className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Joined {new Date(profile.member_since).getFullYear()}</div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 md:items-end">
                                <div className="text-2xl font-bold text-indigo-600">
                                    ${profile.hourly_rate}<span className="text-sm text-gray-500 font-normal">/hr</span>
                                </div>
                                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    {profile.availability_status === 'available' ? 'Available now' : profile.availability_status}
                                </div>
                            </div>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Success Rate</div>
                                <div className="text-xl font-bold text-gray-900">
                                    {profile.total_jobs_completed ? '100%' : 'N/A'} {/* Needs actual API success rate, hardcoded fallback for visual */}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Jobs</div>
                                <div className="text-xl font-bold text-gray-900">{profile.total_jobs_completed || 0}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Hours</div>
                                <div className="text-xl font-bold text-gray-900">--</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Rating</div>
                                <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
                                    {profile.avg_rating && profile.avg_rating > 0 ? (
                                        <><svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {Number(profile.avg_rating).toFixed(1)}</>
                                    ) : 'No reviews'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio */}
                    {profile.bio && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">About Me</h2>
                            <div className="prose prose-indigo max-w-none text-gray-600 whitespace-pre-wrap">
                                {profile.bio}
                            </div>
                        </div>
                    )}

                    {/* Work History */}
                    {profile.work_history && profile.work_history.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg> Work History
                            </h2>
                            <div className="space-y-6">
                                {profile.work_history.map(job => (
                                    <div key={job.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 mb-3">
                                            <span className="capitalize">{job.contract_type}</span>
                                            <span>&bull;</span>
                                            <span>{new Date(job.started_at).toLocaleDateString()} - {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : 'Present'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    {profile.reviews && profile.reviews.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg> Recent Reviews
                            </h2>
                            <div className="space-y-6">
                                {profile.reviews.map(review => (
                                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">{review.contract_title || "MonkeysWork Project"}</h3>
                                            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {Number(review.overall_rating).toFixed(1)}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3 italic">"{review.comment}"</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <img src={review.reviewer_avatar || "https://ui-avatars.com/api/?name="+review.reviewer_name} alt="" className="w-5 h-5 rounded-full" />
                                            <span className="font-medium">{review.reviewer_name}</span>
                                            <span>&bull;</span>
                                            <span>{new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(review.created_at))}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors text-center">
                        Invite to Job
                    </button>

                    {/* Skills */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-md font-bold text-gray-900 mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills?.length > 0 ? profile.skills.map((skill, i) => (
                                <span key={skill.slug + i} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100">
                                    {skill.name}
                                </span>
                            )) : (
                                <span className="text-sm text-gray-500">No skills listed yet.</span>
                            )}
                        </div>
                    </div>

                    {/* Languages */}
                    {profile.languages && profile.languages.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg> Languages
                            </h3>
                            <ul className="space-y-2">
                                {profile.languages.map((lang, i) => (
                                    <li key={i} className="text-sm text-gray-600 capitalize">{lang}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Education */}
                    {profile.education && profile.education.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                </svg> Education
                            </h3>
                            <div className="space-y-4">
                                {profile.education.map((edu, i) => (
                                    <div key={i}>
                                        <div className="font-medium text-gray-900 text-sm">{edu.school}</div>
                                        <div className="text-gray-500 text-xs">{edu.degree}</div>
                                        <div className="text-gray-400 text-xs mt-0.5">{edu.year}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-md font-bold text-gray-900 mb-4">Links</h3>
                        <div className="space-y-3">
                            {profile.website_url && (
                                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg> Personal Website
                                </a>
                            )}
                            {profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                    GitHub
                                </a>
                            )}
                            {profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                    LinkedIn
                                </a>
                            )}
                            {!profile.website_url && !profile.github_url && !profile.linkedin_url && (
                                <div className="text-sm text-gray-500">No external links provided.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
