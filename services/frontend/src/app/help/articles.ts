/* ── Help Center Article Content ─────────────────────── */

export interface HelpArticle {
    slug: string;
    title: string;
    category: string;
    categoryIcon: string;
    content: string; // HTML content
}

const articles: HelpArticle[] = [
    /* ── Getting Started ─────────────────────────────── */
    {
        slug: "creating-account",
        title: "Creating Your Account",
        category: "Getting Started",
        categoryIcon: "🚀",
        content: `
<h2>Sign Up in 3 Easy Steps</h2>
<p>Creating a MonkeysWorks account is free and takes less than 2 minutes.</p>

<h3>Step 1: Visit the Registration Page</h3>
<p>Go to <strong>monkeysworks.com/register</strong> or click the <strong>"Get Started Free"</strong> button on the homepage.</p>

<h3>Step 2: Enter Your Details</h3>
<ul>
<li><strong>Full Name</strong> — Your real name, as it will appear on your profile</li>
<li><strong>Email Address</strong> — A valid email you have access to (used for notifications and verification)</li>
<li><strong>Password</strong> — At least 8 characters, including a number and a special character</li>
</ul>

<h3>Step 3: Choose Your Role</h3>
<p>Select whether you want to:</p>
<ul>
<li><strong>Hire Freelancers (Client)</strong> — Post jobs, review proposals, and manage contracts</li>
<li><strong>Work as a Freelancer</strong> — Browse jobs, submit proposals, and earn money</li>
</ul>
<blockquote>You can change your role later from your account settings.</blockquote>

<h3>Email Verification</h3>
<p>After signing up, check your inbox for a verification email. Click the link to activate your account. If you don't see it, check your spam folder or request a new one from the login page.</p>
`,
    },
    {
        slug: "profile-setup",
        title: "Setting Up Your Profile",
        category: "Getting Started",
        categoryIcon: "🚀",
        content: `
<h2>Build a Profile That Gets Noticed</h2>
<p>A complete profile increases your visibility and builds trust with clients and freelancers.</p>

<h3>Profile Photo</h3>
<p>Upload a professional headshot. Profiles with photos get <strong>5x more engagement</strong> than those without.</p>

<h3>Display Name</h3>
<p>Use your real name or business name. This is how others will see you on the platform.</p>

<h3>Bio / About Section</h3>
<p>Write a compelling summary of who you are and what you do. For freelancers, highlight your expertise, years of experience, and notable projects. For clients, describe your company and the type of work you typically hire for.</p>

<h3>For Freelancers: Skills & Rate</h3>
<ul>
<li><strong>Skills</strong> — Add up to 15 relevant skills. Our AI uses these to match you with projects.</li>
<li><strong>Hourly Rate</strong> — Set your base rate. You can customize this per proposal.</li>
<li><strong>Portfolio</strong> — Add at least 3 portfolio items with images, descriptions, and links.</li>
<li><strong>Availability</strong> — Set your weekly hours and preferred project duration.</li>
</ul>

<h3>For Clients: Company Details</h3>
<ul>
<li><strong>Company Name</strong> — Your business name</li>
<li><strong>Industry</strong> — Helps freelancers understand your work</li>
<li><strong>Website</strong> — Optional, but adds credibility</li>
</ul>
`,
    },
    {
        slug: "choose-role",
        title: "Choosing Your Role: Client vs Freelancer",
        category: "Getting Started",
        categoryIcon: "🚀",
        content: `
<h2>Client or Freelancer?</h2>
<p>When you sign up, you'll choose your primary role. Here's what each role offers:</p>

<h3>Client (Hiring)</h3>
<p>Choose "Client" if you want to:</p>
<ul>
<li>Post job listings and receive proposals</li>
<li>Browse and invite freelancers to your projects</li>
<li>Create contracts and manage milestones</li>
<li>Pay freelancers through our secure escrow system</li>
</ul>

<h3>Freelancer (Working)</h3>
<p>Choose "Freelancer" if you want to:</p>
<ul>
<li>Browse available jobs and submit proposals</li>
<li>Get AI-matched with projects that fit your skills</li>
<li>Deliver work through milestone-based contracts</li>
<li>Get paid securely via Stripe or PayPal</li>
</ul>

<blockquote>
<strong>Can I be both?</strong> — Yes! You can switch between roles at any time from your dashboard settings. Some users hire for certain projects and freelance on others.
</blockquote>
`,
    },
    {
        slug: "identity-verification",
        title: "Verifying Your Identity",
        category: "Getting Started",
        categoryIcon: "🚀",
        content: `
<h2>Why Verify?</h2>
<p>Verified users earn a trust badge on their profile, increasing their chances of winning contracts by <strong>3x</strong>.</p>

<h3>What You Need</h3>
<ul>
<li>A valid government-issued photo ID (passport, driver's license, or national ID card)</li>
<li>A selfie holding your ID for identity confirmation</li>
</ul>

<h3>How to Verify</h3>
<ol>
<li>Go to <strong>Dashboard → Settings → Verification</strong></li>
<li>Upload your ID document (front and back)</li>
<li>Take a selfie for identity matching</li>
<li>Submit for review</li>
</ol>

<p>Verification is typically completed within <strong>24–48 hours</strong>. You'll receive an email once approved.</p>

<blockquote>Your documents are encrypted and stored securely. We never share your personal information with other users.</blockquote>
`,
    },

    /* ── For Clients ─────────────────────────────────── */
    {
        slug: "post-job",
        title: "How to Post a Job",
        category: "For Clients — Posting & Hiring",
        categoryIcon: "📋",
        content: `
<h2>Post Your First Job</h2>
<p>Posting a job on MonkeysWorks is free and only takes a few minutes.</p>

<h3>Step 1: Click "Post a Job"</h3>
<p>From your dashboard, click the <strong>"Post a Job"</strong> button in the top navigation or sidebar.</p>

<h3>Step 2: Describe Your Project</h3>
<ul>
<li><strong>Title</strong> — A clear, descriptive title (e.g., "Build a React Dashboard for SaaS App")</li>
<li><strong>Description</strong> — Detailed requirements, deliverables, and expectations</li>
<li><strong>Category</strong> — Select the relevant skill category</li>
<li><strong>Skills Required</strong> — Add specific skills needed (e.g., React, TypeScript, Figma)</li>
</ul>

<h3>Step 3: Set Budget & Timeline</h3>
<ul>
<li><strong>Fixed Price</strong> — Set a total budget for the project</li>
<li><strong>Hourly Rate</strong> — Define an hourly rate range and estimated hours</li>
<li><strong>Timeline</strong> — Set your desired start date and deadline</li>
</ul>

<h3>Step 4: AI Scope Assistant</h3>
<p>Our AI will analyze your job description and suggest:</p>
<ul>
<li>Milestone breakdown for the project</li>
<li>Budget recommendations based on market rates</li>
<li>Skills you may want to add</li>
</ul>

<h3>Step 5: Publish</h3>
<p>Review your listing and click <strong>"Publish Job"</strong>. You'll start receiving proposals within hours.</p>
`,
    },
    {
        slug: "ai-matching",
        title: "Understanding AI-Matched Proposals",
        category: "For Clients — Posting & Hiring",
        categoryIcon: "📋",
        content: `
<h2>How AI Matching Works</h2>
<p>MonkeysWorks uses artificial intelligence to rank proposals based on how well each freelancer matches your project needs.</p>

<h3>Match Score (0–100)</h3>
<p>Every proposal you receive includes a <strong>Match Score</strong>. This score is calculated based on:</p>
<ul>
<li><strong>Skill Alignment</strong> (40%) — How well the freelancer's skills match your job requirements</li>
<li><strong>Past Performance</strong> (25%) — Completion rate, on-time delivery, and client ratings</li>
<li><strong>Experience Level</strong> (20%) — Years of experience and portfolio quality in similar projects</li>
<li><strong>Availability</strong> (15%) — Whether the freelancer's schedule aligns with your timeline</li>
</ul>

<h3>Using the Score</h3>
<p>Proposals are automatically sorted by match score (highest first). A score of:</p>
<ul>
<li><strong>90–100</strong> — Excellent match, highly recommended</li>
<li><strong>70–89</strong> — Good match, worth reviewing</li>
<li><strong>50–69</strong> — Partial match, may need more evaluation</li>
<li><strong>Below 50</strong> — Low match, consider other candidates</li>
</ul>

<blockquote>The AI improves over time by learning from your hiring decisions and feedback.</blockquote>
`,
    },
    {
        slug: "reviewing-proposals",
        title: "Reviewing and Shortlisting Freelancers",
        category: "For Clients — Posting & Hiring",
        categoryIcon: "📋",
        content: `
<h2>Evaluate Proposals Like a Pro</h2>
<p>Once proposals start coming in, here's how to efficiently review and shortlist the best candidates.</p>

<h3>Proposal Overview</h3>
<p>Each proposal includes:</p>
<ul>
<li>Freelancer's cover letter and approach</li>
<li>Proposed budget and timeline</li>
<li>AI Match Score</li>
<li>Portfolio samples and past reviews</li>
</ul>

<h3>Shortlisting</h3>
<p>Click the <strong>⭐ Shortlist</strong> button to add a freelancer to your shortlist. This helps you compare your top candidates side by side.</p>

<h3>Messaging</h3>
<p>You can message any freelancer who submitted a proposal to ask clarifying questions, request samples, or discuss project details — all within the platform.</p>

<h3>Best Practices</h3>
<ul>
<li>Don't just go by price — consider the match score and reviews</li>
<li>Look for freelancers who asked specific questions about your project</li>
<li>Review portfolio pieces that are similar to your project</li>
<li>Check their response time and communication style</li>
</ul>
`,
    },
    {
        slug: "contracts-escrow",
        title: "Creating a Contract & Funding Escrow",
        category: "For Clients — Posting & Hiring",
        categoryIcon: "📋",
        content: `
<h2>Secure Your Project with Escrow</h2>
<p>Once you've chosen a freelancer, creating a contract protects both parties.</p>

<h3>Accepting a Proposal</h3>
<p>Click <strong>"Accept Proposal"</strong> on your chosen freelancer's submission. This automatically generates a contract with the agreed terms.</p>

<h3>Contract Details</h3>
<p>The contract includes:</p>
<ul>
<li>Project scope and deliverables</li>
<li>Milestones with individual budgets</li>
<li>Timeline for each milestone</li>
<li>Total project budget</li>
</ul>

<h3>Funding Escrow</h3>
<p>Before work begins, you'll fund the first milestone:</p>
<ol>
<li>The payment is charged to your default payment method (Stripe or PayPal)</li>
<li>Funds are held securely in escrow — <strong>not</strong> paid to the freelancer yet</li>
<li>Once the freelancer delivers and you approve, the funds are released</li>
</ol>

<blockquote>
<strong>Your money is safe.</strong> Escrow funds are only released when you approve the deliverables. If there's a dispute, our support team mediates.
</blockquote>
`,
    },
    {
        slug: "milestone-approval",
        title: "Approving Milestones & Releasing Payment",
        category: "For Clients — Posting & Hiring",
        categoryIcon: "📋",
        content: `
<h2>Review, Approve, Pay</h2>
<p>Each milestone follows a simple review and approval process.</p>

<h3>When a Milestone is Submitted</h3>
<p>You'll receive a notification when the freelancer submits a milestone. Go to <strong>Dashboard → Contracts → [Your Contract]</strong> to review.</p>

<h3>Reviewing Deliverables</h3>
<ul>
<li>View submitted files, links, and descriptions</li>
<li>Test functionality if applicable</li>
<li>Compare against the agreed scope</li>
</ul>

<h3>Your Options</h3>
<ul>
<li><strong>Approve</strong> — Releases the escrow payment to the freelancer</li>
<li><strong>Request Revision</strong> — Send feedback and ask for changes (the milestone stays open)</li>
<li><strong>Dispute</strong> — If you believe the work doesn't meet the agreed requirements</li>
</ul>

<h3>After Approval</h3>
<p>Payment is released instantly. The next milestone (if any) becomes active, and you can fund it to continue the project.</p>
`,
    },

    /* ── For Freelancers ─────────────────────────────── */
    {
        slug: "browse-jobs",
        title: "Browsing and Filtering Jobs",
        category: "For Freelancers — Finding Work",
        categoryIcon: "💼",
        content: `
<h2>Find the Perfect Project</h2>
<p>MonkeysWorks offers multiple ways to discover projects that match your skills.</p>

<h3>Job Feed</h3>
<p>Your dashboard shows an <strong>AI-curated feed</strong> of jobs ranked by match score. The more complete your profile, the better the recommendations.</p>

<h3>Search & Filters</h3>
<p>Use the search bar and filters to narrow down results:</p>
<ul>
<li><strong>Category</strong> — Web Dev, Design, Writing, Marketing, etc.</li>
<li><strong>Budget Range</strong> — Min and max budget</li>
<li><strong>Project Type</strong> — Fixed price or hourly</li>
<li><strong>Duration</strong> — Short-term, medium, or long-term</li>
<li><strong>Experience Level</strong> — Entry, Intermediate, or Expert</li>
<li><strong>Skills</strong> — Filter by specific technologies or skills</li>
</ul>

<h3>Saved Searches</h3>
<p>Save your favorite filter combinations and get notified when new matching jobs are posted.</p>

<h3>Job Alerts</h3>
<p>Enable push notifications for instant alerts when high-match jobs appear. Configure this in <strong>Settings → Notifications</strong>.</p>
`,
    },
    {
        slug: "writing-proposals",
        title: "Writing a Winning Proposal",
        category: "For Freelancers — Finding Work",
        categoryIcon: "💼",
        content: `
<h2>Stand Out from the Competition</h2>
<p>A well-crafted proposal can make the difference between getting hired or being overlooked.</p>

<h3>Structure Your Proposal</h3>
<ol>
<li><strong>Acknowledge the client's needs</strong> — Show you've read and understood their requirements</li>
<li><strong>Explain your approach</strong> — How will you tackle the project? What's your process?</li>
<li><strong>Highlight relevant experience</strong> — Link to similar projects in your portfolio</li>
<li><strong>Propose milestones</strong> — Break the project into clear, deliverable phases</li>
<li><strong>Set expectations</strong> — Timeline, communication frequency, and availability</li>
</ol>

<h3>Tips for Success</h3>
<ul>
<li>Personalize every proposal — generic templates get ignored</li>
<li>Ask smart questions that show expertise</li>
<li>Keep it concise — 300–500 words is ideal</li>
<li>Attach relevant portfolio pieces</li>
<li>Be competitive but don't undervalue yourself</li>
</ul>

<blockquote>Use the <strong>AI Proposal Assistant</strong> to help draft and optimize your proposals.</blockquote>
`,
    },
    {
        slug: "ai-proposal-assistant",
        title: "Using the AI Proposal Assistant",
        category: "For Freelancers — Finding Work",
        categoryIcon: "💼",
        content: `
<h2>Let AI Help You Win More Contracts</h2>
<p>The AI Proposal Assistant analyzes the job posting and helps you craft a tailored proposal.</p>

<h3>How It Works</h3>
<ol>
<li>Open a job listing and click <strong>"Write Proposal"</strong></li>
<li>The AI reads the job description and your profile</li>
<li>It generates a draft proposal highlighting your relevant skills and experience</li>
<li>Edit the draft to add your personal touch</li>
<li>Submit your polished proposal</li>
</ol>

<h3>AI Features</h3>
<ul>
<li><strong>Tone Optimization</strong> — Professional, friendly, or technical tone</li>
<li><strong>Keyword Matching</strong> — Ensures your proposal addresses key requirements</li>
<li><strong>Milestone Suggestions</strong> — Auto-generates milestones based on the project scope</li>
<li><strong>Rate Recommendations</strong> — Suggests competitive pricing based on market data</li>
</ul>

<blockquote>The AI is a tool, not a replacement. Always personalize the generated content with your unique voice and insights.</blockquote>
`,
    },
    {
        slug: "submit-deliverables",
        title: "Submitting Deliverables",
        category: "For Freelancers — Finding Work",
        categoryIcon: "💼",
        content: `
<h2>Deliver Your Best Work</h2>
<p>When you've completed a milestone, submit your deliverables for client review.</p>

<h3>How to Submit</h3>
<ol>
<li>Go to <strong>Dashboard → Contracts → [Active Contract]</strong></li>
<li>Click on the current milestone</li>
<li>Click <strong>"Submit Deliverable"</strong></li>
<li>Upload files, add links, and write a description of what you've delivered</li>
<li>Click <strong>"Submit for Review"</strong></li>
</ol>

<h3>Supported File Types</h3>
<p>You can upload images, documents, ZIP archives, videos, and code files. Maximum file size is 50MB per file.</p>

<h3>After Submission</h3>
<p>The client is notified and has the following options:</p>
<ul>
<li><strong>Approve</strong> — Payment is released to you immediately</li>
<li><strong>Request Revision</strong> — You'll receive feedback and can resubmit</li>
</ul>

<h3>Best Practices</h3>
<ul>
<li>Include a clear summary of what was delivered</li>
<li>Provide any necessary instructions (setup, access, etc.)</li>
<li>Test everything before submitting</li>
<li>Communicate proactively if you need more time</li>
</ul>
`,
    },
    {
        slug: "getting-paid",
        title: "Getting Paid: Stripe & PayPal",
        category: "For Freelancers — Finding Work",
        categoryIcon: "💼",
        content: `
<h2>Get Paid Securely</h2>
<p>MonkeysWorks supports two payout methods: Stripe and PayPal.</p>

<h3>Setting Up Payouts</h3>
<ol>
<li>Go to <strong>Dashboard → Settings → Payout Methods</strong></li>
<li>Connect your Stripe account or add your PayPal email</li>
<li>Set your preferred payout method</li>
</ol>

<h3>When You Get Paid</h3>
<p>Payment is released from escrow when the client approves your milestone. Processing times:</p>
<ul>
<li><strong>Stripe</strong> — 2–3 business days to your bank account</li>
<li><strong>PayPal</strong> — Instant to your PayPal balance</li>
</ul>

<h3>Platform Fees</h3>
<p>MonkeysWorks charges a competitive platform fee that decreases as you earn more:</p>
<ul>
<li>First $500 with a client: 10%</li>
<li>$500–$10,000: 7%</li>
<li>Above $10,000: 5%</li>
</ul>

<h3>Transaction History</h3>
<p>View all your earnings, fees, and payouts in <strong>Dashboard → Billing → Transactions</strong>.</p>
`,
    },

    /* ── Dashboard & Project Management ──────────────── */
    {
        slug: "dashboard-overview",
        title: "Dashboard Overview",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Your Command Center</h2>
<p>The dashboard is your central hub for managing everything on MonkeysWorks.</p>

<h3>Dashboard Sections</h3>

<h4>For Clients</h4>
<ul>
<li><strong>My Jobs</strong> — All your posted jobs, drafts, and closed listings</li>
<li><strong>Proposals</strong> — Received proposals sorted by match score</li>
<li><strong>Contracts</strong> — Active, completed, and cancelled contracts</li>
<li><strong>Billing</strong> — Payment history, invoices, and payment methods</li>
<li><strong>Messages</strong> — Conversations with freelancers</li>
<li><strong>Stats</strong> — Spending analytics and hiring history</li>
</ul>

<h4>For Freelancers</h4>
<ul>
<li><strong>Find Work</strong> — AI-curated job recommendations</li>
<li><strong>My Proposals</strong> — Submitted, shortlisted, and accepted proposals</li>
<li><strong>Contracts</strong> — Active projects and deliverables</li>
<li><strong>Billing</strong> — Earnings, transactions, and payout history</li>
<li><strong>Messages</strong> — Client conversations</li>
<li><strong>Stats</strong> — Earnings analytics and performance metrics</li>
</ul>

<h3>Notifications</h3>
<p>The bell icon shows unread notifications. Click to see new proposals, messages, milestone updates, and payment confirmations.</p>
`,
    },
    {
        slug: "manage-contracts",
        title: "Managing Contracts & Milestones",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Keep Projects on Track</h2>
<p>The contract management system helps both clients and freelancers stay organized.</p>

<h3>Contract States</h3>
<ul>
<li><strong>Active</strong> — Work is in progress</li>
<li><strong>Paused</strong> — Temporarily on hold</li>
<li><strong>Completed</strong> — All milestones delivered and approved</li>
<li><strong>Cancelled</strong> — Contract terminated</li>
</ul>

<h3>Milestone Management</h3>
<p>Each contract has one or more milestones. For each milestone:</p>
<ol>
<li><strong>Fund</strong> (Client) — Add money to escrow</li>
<li><strong>Work</strong> (Freelancer) — Complete the deliverables</li>
<li><strong>Submit</strong> (Freelancer) — Upload and submit for review</li>
<li><strong>Review</strong> (Client) — Approve or request revisions</li>
<li><strong>Release</strong> (Automatic) — Payment sent on approval</li>
</ol>

<h3>Adding Milestones</h3>
<p>Both parties can propose new milestones during a project. The other party must approve before it becomes active.</p>
`,
    },
    {
        slug: "time-tracking",
        title: "Time Tracking for Hourly Contracts",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Track Your Hours Accurately</h2>
<p>For hourly contracts, MonkeysWorks includes built-in time tracking.</p>

<h3>Starting the Timer</h3>
<ol>
<li>Go to your active hourly contract</li>
<li>Click the <strong>"Start Timer"</strong> button</li>
<li>Add a description of what you're working on</li>
<li>The timer runs in the background — you can navigate away</li>
<li>Click <strong>"Stop"</strong> when you finish a session</li>
</ol>

<h3>Manual Time Entry</h3>
<p>You can also add time entries manually for work done offline. Go to the contract and click <strong>"Add Time Entry"</strong>, then enter the date, hours, and description.</p>

<h3>Weekly Invoicing</h3>
<p>Hourly contracts are invoiced weekly. At the end of each week:</p>
<ul>
<li>A summary of logged hours is generated</li>
<li>The client reviews and approves the hours</li>
<li>Payment is processed automatically</li>
</ul>
`,
    },
    {
        slug: "messaging",
        title: "Messaging & File Sharing",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Communicate Effectively</h2>
<p>Build-in messaging keeps all project communication in one place.</p>

<h3>Features</h3>
<ul>
<li><strong>Real-time messaging</strong> — Instant message delivery with read receipts</li>
<li><strong>File sharing</strong> — Drag and drop files directly into the chat</li>
<li><strong>Rich text</strong> — Format messages with bold, italic, code blocks, and links</li>
<li><strong>Project context</strong> — Messages are tied to specific contracts for easy reference</li>
</ul>

<h3>Tips</h3>
<ul>
<li>Keep communication on-platform for dispute resolution evidence</li>
<li>Use clear, concise messages with action items</li>
<li>Share screenshots and mockups to avoid misunderstandings</li>
</ul>
`,
    },
    {
        slug: "notifications",
        title: "Notifications & Preferences",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Stay Informed, Not Overwhelmed</h2>
<p>Customize which notifications you receive and how you receive them.</p>

<h3>Notification Types</h3>
<ul>
<li><strong>Proposals</strong> — New proposals on your jobs or status updates on yours</li>
<li><strong>Contracts</strong> — Milestone submissions, approvals, and status changes</li>
<li><strong>Messages</strong> — New messages from clients or freelancers</li>
<li><strong>Payments</strong> — Escrow funded, payments released, payouts</li>
<li><strong>System</strong> — Account verification, platform updates</li>
</ul>

<h3>Delivery Channels</h3>
<ul>
<li><strong>In-app</strong> — Bell icon in the dashboard</li>
<li><strong>Email</strong> — Digest or instant notifications</li>
<li><strong>Push</strong> — Mobile app notifications (iOS / Android)</li>
</ul>

<h3>Managing Preferences</h3>
<p>Go to <strong>Dashboard → Settings → Notifications</strong> to toggle each notification type on or off for each channel.</p>
`,
    },
    {
        slug: "stats-analytics",
        title: "Viewing Stats & Analytics",
        category: "Dashboard & Project Management",
        categoryIcon: "📊",
        content: `
<h2>Data-Driven Decisions</h2>
<p>Access detailed analytics to understand your performance and growth.</p>

<h3>For Freelancers</h3>
<ul>
<li><strong>Earnings</strong> — Monthly, quarterly, and yearly earnings charts</li>
<li><strong>Proposal Win Rate</strong> — Percentage of proposals that lead to contracts</li>
<li><strong>Response Time</strong> — Average time to respond to messages</li>
<li><strong>Client Satisfaction</strong> — Average rating across all reviews</li>
<li><strong>Profile Views</strong> — How many clients viewed your profile</li>
</ul>

<h3>For Clients</h3>
<ul>
<li><strong>Spending</strong> — Monthly spending with breakdowns by category</li>
<li><strong>Projects Completed</strong> — Total and by category</li>
<li><strong>Average Hire Time</strong> — Days from posting to hiring</li>
<li><strong>Freelancer Ratings</strong> — Average ratings given and received</li>
</ul>
`,
    },

    /* ── Payments & Billing ──────────────────────────── */
    {
        slug: "escrow-explained",
        title: "How Escrow Protection Works",
        category: "Payments & Billing",
        categoryIcon: "💰",
        content: `
<h2>Your Money is Protected</h2>
<p>Escrow is the foundation of payment security on MonkeysWorks.</p>

<h3>How It Works</h3>
<ol>
<li><strong>Client funds escrow</strong> — Money is charged but held securely by MonkeysWorks</li>
<li><strong>Freelancer works</strong> — Knowing the payment is guaranteed</li>
<li><strong>Client approves</strong> — After reviewing deliverables</li>
<li><strong>Payment released</strong> — Funds are sent to the freelancer</li>
</ol>

<h3>What Happens if There's a Problem?</h3>
<p>If the client and freelancer can't agree:</p>
<ul>
<li>Either party can open a <strong>dispute</strong></li>
<li>Our support team reviews the evidence from both sides</li>
<li>A fair resolution is reached — partial or full payment release</li>
<li>Escrow funds are never lost — they're held safely until the dispute is resolved</li>
</ul>

<blockquote>Escrow protects freelancers from non-payment and clients from unsatisfactory work. It's a win-win.</blockquote>
`,
    },
    {
        slug: "payment-methods",
        title: "Payment Methods: Stripe & PayPal",
        category: "Payments & Billing",
        categoryIcon: "💰",
        content: `
<h2>Flexible Payment Options</h2>

<h3>For Clients (Paying)</h3>
<ul>
<li><strong>Stripe</strong> — Credit cards, debit cards</li>
<li><strong>PayPal</strong> — PayPal balance or linked accounts</li>
</ul>
<p>Add your payment method in <strong>Dashboard → Billing → Payment Methods</strong>.</p>

<h3>For Freelancers (Receiving)</h3>
<ul>
<li><strong>Stripe Connect</strong> — Direct bank deposits (2–3 business days)</li>
<li><strong>PayPal</strong> — Instant to PayPal balance</li>
</ul>
<p>Configure your payout method in <strong>Dashboard → Settings → Payout Methods</strong>.</p>

<h3>Currency</h3>
<p>All transactions are processed in USD. Freelancers in other countries receive payouts in their local currency based on current exchange rates.</p>
`,
    },
    {
        slug: "platform-fees",
        title: "Understanding Platform Fees",
        category: "Payments & Billing",
        categoryIcon: "💰",
        content: `
<h2>Transparent, Competitive Pricing</h2>

<h3>For Freelancers</h3>
<p>A sliding fee structure that decreases as you earn more with each client:</p>
<ul>
<li><strong>10%</strong> — On the first $500 earned with a client</li>
<li><strong>7%</strong> — On earnings between $500–$10,000</li>
<li><strong>5%</strong> — On earnings above $10,000</li>
</ul>

<h3>For Clients</h3>
<p>Clients pay a flat <strong>3% processing fee</strong> on each payment. No monthly subscriptions or hidden fees.</p>

<h3>Example</h3>
<p>For a $1,000 project:</p>
<ul>
<li>Client pays: $1,030 (including 3% processing fee)</li>
<li>Freelancer receives: $925 (after 7.5% average platform fee)</li>
</ul>
`,
    },
    {
        slug: "invoices",
        title: "Invoices & Transaction History",
        category: "Payments & Billing",
        categoryIcon: "💰",
        content: `
<h2>Track Every Transaction</h2>

<h3>Finding Your Invoices</h3>
<p>Go to <strong>Dashboard → Billing → Invoices</strong> to view all invoices. Each invoice includes project details, amounts, fees, and dates.</p>

<h3>Downloading</h3>
<p>Click <strong>"Download PDF"</strong> on any invoice for your records or accounting.</p>

<h3>Transaction History</h3>
<p>The <strong>Transactions</strong> tab shows a chronological list of all financial activity: escrow deposits, releases, fees, and payouts.</p>
`,
    },
    {
        slug: "payouts",
        title: "Requesting a Payout",
        category: "Payments & Billing",
        categoryIcon: "💰",
        content: `
<h2>Access Your Earnings</h2>

<h3>Automatic Payouts</h3>
<p>By default, earnings are automatically transferred to your linked payout method once per week.</p>

<h3>Manual Payouts</h3>
<p>You can request an instant payout anytime from <strong>Dashboard → Billing → Payouts</strong>. Click <strong>"Request Payout"</strong> and select the amount.</p>

<h3>Minimum Payout</h3>
<p>The minimum payout amount is <strong>$25</strong>. Balances below this threshold are rolled over to the next payout cycle.</p>

<h3>Processing Times</h3>
<ul>
<li><strong>Stripe</strong> — 2–3 business days</li>
<li><strong>PayPal</strong> — Usually instant (up to 24 hours in some cases)</li>
</ul>
`,
    },

    /* ── Trust & Safety ──────────────────────────────── */
    {
        slug: "disputes",
        title: "How Disputes Work",
        category: "Trust & Safety",
        categoryIcon: "🛡️",
        content: `
<h2>Fair Resolution for Everyone</h2>
<p>Disputes are handled professionally to protect both clients and freelancers.</p>

<h3>When to Open a Dispute</h3>
<ul>
<li>Work quality doesn't meet agreed standards</li>
<li>Deliverables are incomplete or missing</li>
<li>Communication breakdown with no resolution</li>
<li>Terms of the contract are violated</li>
</ul>

<h3>How to Open a Dispute</h3>
<ol>
<li>Go to the contract in question</li>
<li>Click <strong>"Open Dispute"</strong></li>
<li>Describe the issue and upload evidence (screenshots, files, messages)</li>
<li>Submit for review</li>
</ol>

<h3>Resolution Process</h3>
<ol>
<li>Both parties are notified and given 48 hours to respond</li>
<li>Our support team reviews all evidence</li>
<li>A mediator may facilitate a conversation</li>
<li>A resolution is issued (full payment, partial, or refund)</li>
</ol>

<p>Most disputes are resolved within <strong>5–7 business days</strong>.</p>
`,
    },
    {
        slug: "fraud-detection",
        title: "AI Fraud Detection Explained",
        category: "Trust & Safety",
        categoryIcon: "🛡️",
        content: `
<h2>Built-in Protection</h2>
<p>Our AI continuously monitors the platform to detect and prevent fraudulent activity.</p>

<h3>What We Monitor</h3>
<ul>
<li><strong>Fake profiles</strong> — AI flags suspicious registrations and profiles</li>
<li><strong>Plagiarized portfolios</strong> — Detects copied or stolen work samples</li>
<li><strong>Spam proposals</strong> — Filters mass-sent, generic proposals</li>
<li><strong>Payment fraud</strong> — Monitors for suspicious payment patterns</li>
<li><strong>Review manipulation</strong> — Detects fake or coordinated reviews</li>
</ul>

<h3>How It Protects You</h3>
<p>When fraud is detected:</p>
<ul>
<li>The suspicious account is flagged for manual review</li>
<li>Affected users are notified if necessary</li>
<li>Fraudulent accounts are permanently banned</li>
<li>Any escrowed funds are protected and returned</li>
</ul>
`,
    },
    {
        slug: "reporting",
        title: "Reporting a User",
        category: "Trust & Safety",
        categoryIcon: "🛡️",
        content: `
<h2>Help Keep the Community Safe</h2>
<p>If you encounter inappropriate behavior, harassment, or fraud, please report it.</p>

<h3>How to Report</h3>
<ol>
<li>Go to the user's profile or the relevant content (job, proposal, message)</li>
<li>Click the <strong>🚩 Report</strong> button</li>
<li>Select the reason for reporting</li>
<li>Add any additional details</li>
<li>Submit the report</li>
</ol>

<h3>What Happens Next</h3>
<p>Our trust team reviews every report within <strong>24 hours</strong>. Actions may include warnings, suspensions, or permanent bans depending on the severity.</p>

<p>Reports are confidential — the reported user won't know who filed the report.</p>
`,
    },
    {
        slug: "community-guidelines",
        title: "Community Guidelines",
        category: "Trust & Safety",
        categoryIcon: "🛡️",
        content: `
<h2>Building a Respectful Community</h2>

<h3>Expected Behavior</h3>
<ul>
<li>Be professional and respectful in all communications</li>
<li>Honor your commitments and deadlines</li>
<li>Provide honest reviews and feedback</li>
<li>Protect confidential information</li>
<li>Use the platform's built-in tools for payments and communication</li>
</ul>

<h3>Prohibited Behavior</h3>
<ul>
<li>Requesting or sharing contact information to avoid platform fees</li>
<li>Harassment, discrimination, or abusive language</li>
<li>Submitting plagiarized or AI-generated work without disclosure</li>
<li>Creating fake reviews or multiple accounts</li>
<li>Misrepresenting skills, experience, or identity</li>
</ul>

<h3>Consequences</h3>
<p>Violations may result in warnings, temporary suspensions, or permanent account termination. Severe violations are reported to relevant authorities.</p>
`,
    },
    {
        slug: "privacy-security",
        title: "Data Privacy & Security",
        category: "Trust & Safety",
        categoryIcon: "🛡️",
        content: `
<h2>Your Data is Safe</h2>

<h3>Encryption</h3>
<p>All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your messages, files, and financial information are always protected.</p>

<h3>What We Collect</h3>
<ul>
<li>Account information (name, email, profile)</li>
<li>Transaction data (payments, invoices)</li>
<li>Usage data (for improving AI matching)</li>
<li>Communication data (messages within the platform)</li>
</ul>

<h3>What We Don't Do</h3>
<ul>
<li>Sell your personal data to third parties</li>
<li>Share your contact information without consent</li>
<li>Store full payment card numbers (handled by Stripe/PayPal)</li>
</ul>

<h3>Your Rights</h3>
<p>You can request to download or delete your data at any time from <strong>Dashboard → Settings → Privacy</strong>.</p>
`,
    },

    /* ── Mobile App ──────────────────────────────────── */
    {
        slug: "download-app",
        title: "Downloading the Mobile App",
        category: "Mobile App",
        categoryIcon: "📱",
        content: `
<h2>MonkeysWorks on the Go</h2>
<p>The MonkeysWorks mobile app is available for iOS and Android.</p>

<h3>Download Links</h3>
<ul>
<li><strong>iOS</strong> — Search "MonkeysWorks" on the App Store or visit our download page</li>
<li><strong>Android</strong> — Search "MonkeysWorks" on Google Play or visit our download page</li>
</ul>

<h3>Requirements</h3>
<ul>
<li><strong>iOS</strong> — iOS 15.0 or later</li>
<li><strong>Android</strong> — Android 10 (API 29) or later</li>
</ul>

<h3>Sign In</h3>
<p>Use the same email and password as your web account. All your projects, messages, and contracts sync automatically.</p>
`,
    },
    {
        slug: "mobile-dashboard",
        title: "Mobile Dashboard Features",
        category: "Mobile App",
        categoryIcon: "📱",
        content: `
<h2>Full Power in Your Pocket</h2>
<p>The mobile app mirrors the web dashboard with an optimized touch-friendly interface.</p>

<h3>Available Features</h3>
<ul>
<li>✅ View and manage contracts</li>
<li>✅ Send and receive messages</li>
<li>✅ Review and approve milestones</li>
<li>✅ Submit proposals</li>
<li>✅ Track time (hourly contracts)</li>
<li>✅ View earnings and stats</li>
<li>✅ Receive push notifications</li>
<li>✅ Upload files and images</li>
</ul>
`,
    },
    {
        slug: "push-notifications",
        title: "Push Notifications Setup",
        category: "Mobile App",
        categoryIcon: "📱",
        content: `
<h2>Never Miss an Update</h2>

<h3>Enabling Notifications</h3>
<ol>
<li>Open the MonkeysWorks app</li>
<li>Go to <strong>Settings → Notifications</strong></li>
<li>Toggle on the notification types you want</li>
<li>Allow notifications when prompted by your device</li>
</ol>

<h3>Notification Types</h3>
<ul>
<li><strong>New Messages</strong> — Instant alerts for new messages</li>
<li><strong>Proposals</strong> — When you receive or a proposal status changes</li>
<li><strong>Milestones</strong> — Submissions, approvals, and payment releases</li>
<li><strong>Job Alerts</strong> — New jobs matching your skills (freelancers only)</li>
</ul>

<h3>Troubleshooting</h3>
<p>If notifications aren't working, check your device's notification settings and make sure MonkeysWorks has permission to send notifications.</p>
`,
    },
    {
        slug: "mobile-projects",
        title: "Managing Projects on Mobile",
        category: "Mobile App",
        categoryIcon: "📱",
        content: `
<h2>Work from Anywhere</h2>

<h3>Reviewing Deliverables</h3>
<p>Open your contract, tap the milestone, and swipe through attached files. Approve or request revisions directly from your phone.</p>

<h3>Messaging</h3>
<p>The mobile chat supports real-time messaging, file sharing, and image previews. Tap the attachment icon to share files from your device.</p>

<h3>Time Tracking</h3>
<p>For hourly contracts, start and stop the timer from the contract screen. Add descriptions and track sessions on the go.</p>

<h3>Offline Access</h3>
<p>View cached messages and contract details even without internet. Changes sync automatically when you reconnect.</p>
`,
    },

    /* ── Account & Settings ──────────────────────────── */
    {
        slug: "edit-profile",
        title: "Editing Your Profile",
        category: "Account & Settings",
        categoryIcon: "⚙️",
        content: `
<h2>Keep Your Profile Current</h2>
<p>Go to <strong>Dashboard → Settings → Profile</strong> to update your information.</p>

<h3>Editable Fields</h3>
<ul>
<li><strong>Display Name</strong> — Your public name</li>
<li><strong>Profile Photo</strong> — Upload or change your photo</li>
<li><strong>Bio</strong> — Your professional summary</li>
<li><strong>Location</strong> — City and country</li>
<li><strong>Languages</strong> — Languages you speak</li>
<li><strong>Timezone</strong> — Your preferred timezone</li>
</ul>

<h3>For Freelancers</h3>
<p>You can also update skills, hourly rate, availability, and portfolio items from the Settings menu.</p>
`,
    },
    {
        slug: "change-password",
        title: "Changing Your Password",
        category: "Account & Settings",
        categoryIcon: "⚙️",
        content: `
<h2>Update Your Password</h2>
<ol>
<li>Go to <strong>Dashboard → Settings → Security</strong></li>
<li>Enter your current password</li>
<li>Enter your new password (minimum 8 characters, include a number and special character)</li>
<li>Confirm the new password</li>
<li>Click <strong>"Update Password"</strong></li>
</ol>

<h3>Forgot Your Password?</h3>
<p>Click <strong>"Forgot Password"</strong> on the login page. Enter your email and we'll send a password reset link.</p>
`,
    },
    {
        slug: "2fa",
        title: "Two-Factor Authentication",
        category: "Account & Settings",
        categoryIcon: "⚙️",
        content: `
<h2>Extra Security for Your Account</h2>

<h3>Setting Up 2FA</h3>
<ol>
<li>Go to <strong>Dashboard → Settings → Security</strong></li>
<li>Click <strong>"Enable Two-Factor Authentication"</strong></li>
<li>Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)</li>
<li>Enter the 6-digit code to verify</li>
<li>Save your backup codes in a safe place</li>
</ol>

<h3>Logging In with 2FA</h3>
<p>After entering your email and password, you'll be prompted for the 6-digit code from your authenticator app.</p>

<blockquote>We strongly recommend enabling 2FA, especially for accounts that handle large payments.</blockquote>
`,
    },
    {
        slug: "email-preferences",
        title: "Email & Notification Preferences",
        category: "Account & Settings",
        categoryIcon: "⚙️",
        content: `
<h2>Control Your Inbox</h2>

<h3>Email Preferences</h3>
<p>Go to <strong>Dashboard → Settings → Notifications</strong> to manage:</p>
<ul>
<li><strong>Transactional Emails</strong> — Payment confirmations, contract updates (recommended to keep on)</li>
<li><strong>Marketing Emails</strong> — Platform updates, tips, and promotions</li>
<li><strong>Digest Emails</strong> — Daily or weekly summaries of activity</li>
</ul>

<h3>Unsubscribing</h3>
<p>Click the unsubscribe link at the bottom of any marketing email, or toggle off from your dashboard settings.</p>
`,
    },
    {
        slug: "delete-account",
        title: "Deleting Your Account",
        category: "Account & Settings",
        categoryIcon: "⚙️",
        content: `
<h2>Account Deletion</h2>
<p>We're sorry to see you go. Before deleting, please note:</p>

<h3>Before You Delete</h3>
<ul>
<li>Complete or cancel all active contracts</li>
<li>Withdraw any remaining account balance</li>
<li>Download any invoices or records you need</li>
</ul>

<h3>How to Delete</h3>
<ol>
<li>Go to <strong>Dashboard → Settings → Account</strong></li>
<li>Scroll to <strong>"Delete Account"</strong></li>
<li>Enter your password to confirm</li>
<li>Click <strong>"Delete My Account"</strong></li>
</ol>

<h3>What Happens</h3>
<ul>
<li>Your profile and personal data are permanently removed within 30 days</li>
<li>Reviews you've written may remain (anonymized)</li>
<li>This action cannot be undone</li>
</ul>

<p>If you're having issues, consider contacting <a href="/help/contact">support</a> before deleting — we may be able to help.</p>
`,
    },
];

/* ── Article lookup ──────────────────────────────────── */
export function getArticleBySlug(slug: string): HelpArticle | undefined {
    return articles.find((a) => a.slug === slug);
}

export function getAllArticleSlugs(): string[] {
    return articles.map((a) => a.slug);
}

export function getRelatedArticles(category: string, excludeSlug: string): HelpArticle[] {
    return articles.filter((a) => a.category === category && a.slug !== excludeSlug);
}

export default articles;
