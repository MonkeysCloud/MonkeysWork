--
-- PostgreSQL database dump
--

\restrict uSccy5gWcQHv5QbVhHThmNsQU6qEOEHlC5fKsks6v1eftFBKYznFEPTou8bOYMg

-- Dumped from database version 15.16 (Debian 15.16-1.pgdg12+1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.verification_conversation DROP CONSTRAINT IF EXISTS verification_conversation_verification_id_fkey;
ALTER TABLE IF EXISTS ONLY public.screenshot DROP CONSTRAINT IF EXISTS screenshot_time_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.saved_job DROP CONSTRAINT IF EXISTS saved_job_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.saved_job DROP CONSTRAINT IF EXISTS saved_job_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notification_reply DROP CONSTRAINT IF EXISTS notification_reply_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notification_reply DROP CONSTRAINT IF EXISTS notification_reply_notification_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_skills DROP CONSTRAINT IF EXISTS job_skills_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_skills DROP CONSTRAINT IF EXISTS job_skills_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_moderation_conversation DROP CONSTRAINT IF EXISTS job_moderation_conversation_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.freelancer_skills DROP CONSTRAINT IF EXISTS freelancer_skills_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.freelancer_skills DROP CONSTRAINT IF EXISTS freelancer_skills_freelancer_profile_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job DROP CONSTRAINT IF EXISTS fk_job_moderation_reviewed_by_id;
ALTER TABLE IF EXISTS ONLY public.dispute DROP CONSTRAINT IF EXISTS fk_dispute_awaiting_response_from_id;
ALTER TABLE IF EXISTS ONLY public.email_preference DROP CONSTRAINT IF EXISTS email_preference_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.deliverables DROP CONSTRAINT IF EXISTS deliverables_milestone_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.blog_post_tag DROP CONSTRAINT IF EXISTS blog_post_tag_tag_id_fkey;
ALTER TABLE IF EXISTS ONLY public.blog_post_tag DROP CONSTRAINT IF EXISTS blog_post_tag_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.blog_post DROP CONSTRAINT IF EXISTS blog_post_author_id_fkey;
DROP INDEX IF EXISTS public.skill_slug_unique;
DROP INDEX IF EXISTS public.idx_verif_conv_verif;
DROP INDEX IF EXISTS public.idx_screenshot_entry;
DROP INDEX IF EXISTS public.idx_review_reviewer;
DROP INDEX IF EXISTS public.idx_review_reviewee;
DROP INDEX IF EXISTS public.idx_review_contract;
DROP INDEX IF EXISTS public.idx_paymentmethod_user_active;
DROP INDEX IF EXISTS public.idx_paymentmethod_user;
DROP INDEX IF EXISTS public.idx_notification_reply_user;
DROP INDEX IF EXISTS public.idx_notification_reply_notif;
DROP INDEX IF EXISTS public.idx_job_mod_conv_job;
DROP INDEX IF EXISTS public.idx_deliverables_milestone;
DROP INDEX IF EXISTS public.idx_blog_post_tag_tag;
DROP INDEX IF EXISTS public.idx_blog_post_status;
DROP INDEX IF EXISTS public.idx_blog_post_slug;
DROP INDEX IF EXISTS public.idx_blog_post_published;
DROP INDEX IF EXISTS public.idx_blog_post_author;
DROP INDEX IF EXISTS public.idx_attachment_entity;
ALTER TABLE IF EXISTS ONLY public.weeklytimesheet DROP CONSTRAINT IF EXISTS weeklytimesheet_pkey;
ALTER TABLE IF EXISTS ONLY public.verification DROP CONSTRAINT IF EXISTS verification_pkey;
ALTER TABLE IF EXISTS ONLY public.verification_conversation DROP CONSTRAINT IF EXISTS verification_conversation_pkey;
ALTER TABLE IF EXISTS ONLY public.usersession DROP CONSTRAINT IF EXISTS usersession_pkey;
ALTER TABLE IF EXISTS ONLY public.useroauth DROP CONSTRAINT IF EXISTS useroauth_pkey;
ALTER TABLE IF EXISTS ONLY public."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY public.time_entry_claim DROP CONSTRAINT IF EXISTS timeentryclaim_pkey;
ALTER TABLE IF EXISTS ONLY public.timeentry DROP CONSTRAINT IF EXISTS timeentry_pkey;
ALTER TABLE IF EXISTS ONLY public.skill DROP CONSTRAINT IF EXISTS skill_pkey;
ALTER TABLE IF EXISTS ONLY public.screenshot DROP CONSTRAINT IF EXISTS screenshot_pkey;
ALTER TABLE IF EXISTS ONLY public.savedjob DROP CONSTRAINT IF EXISTS savedjob_pkey;
ALTER TABLE IF EXISTS ONLY public.saved_job DROP CONSTRAINT IF EXISTS saved_job_pkey;
ALTER TABLE IF EXISTS ONLY public.role DROP CONSTRAINT IF EXISTS role_pkey;
ALTER TABLE IF EXISTS ONLY public.review DROP CONSTRAINT IF EXISTS review_pkey;
ALTER TABLE IF EXISTS ONLY public.report DROP CONSTRAINT IF EXISTS report_pkey;
ALTER TABLE IF EXISTS ONLY public.proposal DROP CONSTRAINT IF EXISTS proposal_pkey;
ALTER TABLE IF EXISTS ONLY public.payout DROP CONSTRAINT IF EXISTS payout_pkey;
ALTER TABLE IF EXISTS ONLY public.paymentmethod DROP CONSTRAINT IF EXISTS paymentmethod_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_reply DROP CONSTRAINT IF EXISTS notification_reply_pkey;
ALTER TABLE IF EXISTS ONLY public.notification DROP CONSTRAINT IF EXISTS notification_pkey;
ALTER TABLE IF EXISTS ONLY public.milestone DROP CONSTRAINT IF EXISTS milestone_pkey;
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS message_pkey;
ALTER TABLE IF EXISTS ONLY public.jobattachment DROP CONSTRAINT IF EXISTS jobattachment_pkey;
ALTER TABLE IF EXISTS ONLY public.job_skills DROP CONSTRAINT IF EXISTS job_skills_pkey;
ALTER TABLE IF EXISTS ONLY public.job DROP CONSTRAINT IF EXISTS job_pkey;
ALTER TABLE IF EXISTS ONLY public.job_moderation_conversation DROP CONSTRAINT IF EXISTS job_moderation_conversation_pkey;
ALTER TABLE IF EXISTS ONLY public.invoiceline DROP CONSTRAINT IF EXISTS invoiceline_pkey;
ALTER TABLE IF EXISTS ONLY public.invoice DROP CONSTRAINT IF EXISTS invoice_pkey;
ALTER TABLE IF EXISTS ONLY public.invitation DROP CONSTRAINT IF EXISTS invitation_pkey;
ALTER TABLE IF EXISTS ONLY public.freelancerprofile DROP CONSTRAINT IF EXISTS freelancerprofile_pkey;
ALTER TABLE IF EXISTS ONLY public.freelancer_skills DROP CONSTRAINT IF EXISTS freelancer_skills_pkey;
ALTER TABLE IF EXISTS ONLY public.featureflag DROP CONSTRAINT IF EXISTS featureflag_pkey;
ALTER TABLE IF EXISTS ONLY public.featureflag DROP CONSTRAINT IF EXISTS featureflag_key_unique;
ALTER TABLE IF EXISTS ONLY public.escrowtransaction DROP CONSTRAINT IF EXISTS escrowtransaction_pkey;
ALTER TABLE IF EXISTS ONLY public.email_preference DROP CONSTRAINT IF EXISTS email_preference_pkey;
ALTER TABLE IF EXISTS ONLY public.disputemessage DROP CONSTRAINT IF EXISTS disputemessage_pkey;
ALTER TABLE IF EXISTS ONLY public.dispute DROP CONSTRAINT IF EXISTS dispute_pkey;
ALTER TABLE IF EXISTS ONLY public.deliverables DROP CONSTRAINT IF EXISTS deliverables_pkey;
ALTER TABLE IF EXISTS ONLY public.deliverable DROP CONSTRAINT IF EXISTS deliverable_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS conversation_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.contract DROP CONSTRAINT IF EXISTS contract_pkey;
ALTER TABLE IF EXISTS ONLY public.clientprofile DROP CONSTRAINT IF EXISTS clientprofile_pkey;
ALTER TABLE IF EXISTS ONLY public.category DROP CONSTRAINT IF EXISTS category_pkey;
ALTER TABLE IF EXISTS ONLY public.blog_tag DROP CONSTRAINT IF EXISTS blog_tag_slug_key;
ALTER TABLE IF EXISTS ONLY public.blog_tag DROP CONSTRAINT IF EXISTS blog_tag_pkey;
ALTER TABLE IF EXISTS ONLY public.blog_post_tag DROP CONSTRAINT IF EXISTS blog_post_tag_pkey;
ALTER TABLE IF EXISTS ONLY public.blog_post DROP CONSTRAINT IF EXISTS blog_post_slug_key;
ALTER TABLE IF EXISTS ONLY public.blog_post DROP CONSTRAINT IF EXISTS blog_post_pkey;
ALTER TABLE IF EXISTS ONLY public.attachment DROP CONSTRAINT IF EXISTS attachment_pkey;
ALTER TABLE IF EXISTS ONLY public.aidecisionlog DROP CONSTRAINT IF EXISTS aidecisionlog_pkey;
ALTER TABLE IF EXISTS ONLY public.activitylog DROP CONSTRAINT IF EXISTS activitylog_pkey;
DROP TABLE IF EXISTS public.weeklytimesheet;
DROP TABLE IF EXISTS public.verification_conversation;
DROP TABLE IF EXISTS public.verification;
DROP TABLE IF EXISTS public.usersession;
DROP TABLE IF EXISTS public.useroauth;
DROP TABLE IF EXISTS public."user";
DROP TABLE IF EXISTS public.timeentry;
DROP TABLE IF EXISTS public.time_entry_claim;
DROP TABLE IF EXISTS public.skill;
DROP TABLE IF EXISTS public.screenshot;
DROP TABLE IF EXISTS public.savedjob;
DROP TABLE IF EXISTS public.saved_job;
DROP TABLE IF EXISTS public.role;
DROP TABLE IF EXISTS public.review;
DROP TABLE IF EXISTS public.report;
DROP TABLE IF EXISTS public.proposal;
DROP TABLE IF EXISTS public.payout;
DROP TABLE IF EXISTS public.paymentmethod;
DROP TABLE IF EXISTS public.notification_reply;
DROP TABLE IF EXISTS public.notification;
DROP TABLE IF EXISTS public.milestone;
DROP TABLE IF EXISTS public.message;
DROP TABLE IF EXISTS public.jobattachment;
DROP TABLE IF EXISTS public.job_skills;
DROP TABLE IF EXISTS public.job_moderation_conversation;
DROP TABLE IF EXISTS public.job;
DROP TABLE IF EXISTS public.invoiceline;
DROP TABLE IF EXISTS public.invoice;
DROP TABLE IF EXISTS public.invitation;
DROP TABLE IF EXISTS public.freelancerprofile;
DROP TABLE IF EXISTS public.freelancer_skills;
DROP TABLE IF EXISTS public.featureflag;
DROP TABLE IF EXISTS public.escrowtransaction;
DROP TABLE IF EXISTS public.email_preference;
DROP TABLE IF EXISTS public.disputemessage;
DROP TABLE IF EXISTS public.dispute;
DROP TABLE IF EXISTS public.deliverables;
DROP TABLE IF EXISTS public.deliverable;
DROP TABLE IF EXISTS public.conversation_participants;
DROP TABLE IF EXISTS public.conversation;
DROP TABLE IF EXISTS public.contract;
DROP TABLE IF EXISTS public.clientprofile;
DROP TABLE IF EXISTS public.category;
DROP TABLE IF EXISTS public.blog_tag;
DROP TABLE IF EXISTS public.blog_post_tag;
DROP TABLE IF EXISTS public.blog_post;
DROP TABLE IF EXISTS public.attachment;
DROP TABLE IF EXISTS public.aidecisionlog;
DROP TABLE IF EXISTS public.activitylog;
DROP FUNCTION IF EXISTS public.update_updated_at();
DROP FUNCTION IF EXISTS public.update_job_search_vector();
DROP TYPE IF EXISTS public.verification_type;
DROP TYPE IF EXISTS public.verification_status;
DROP TYPE IF EXISTS public.verification_level;
DROP TYPE IF EXISTS public.user_status;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.proposal_status;
DROP TYPE IF EXISTS public.milestone_status;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.dispute_status;
DROP TYPE IF EXISTS public.dispute_reason;
DROP TYPE IF EXISTS public.contract_status;
DROP TYPE IF EXISTS public.budget_type;
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: budget_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.budget_type AS ENUM (
    'fixed',
    'hourly'
);


--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contract_status AS ENUM (
    'active',
    'completed',
    'disputed',
    'cancelled'
);


--
-- Name: dispute_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dispute_reason AS ENUM (
    'quality',
    'non_delivery',
    'scope_change',
    'payment',
    'communication',
    'other'
);


--
-- Name: dispute_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dispute_status AS ENUM (
    'open',
    'under_review',
    'resolved_client',
    'resolved_freelancer',
    'resolved_split',
    'escalated'
);


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'draft',
    'open',
    'in_progress',
    'completed',
    'cancelled',
    'suspended'
);


--
-- Name: milestone_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.milestone_status AS ENUM (
    'pending',
    'in_progress',
    'submitted',
    'revision_requested',
    'accepted',
    'disputed'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'submitted',
    'viewed',
    'shortlisted',
    'accepted',
    'rejected',
    'withdrawn'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'client',
    'freelancer',
    'admin',
    'ops'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended',
    'deactivated',
    'pending_verification'
);


--
-- Name: verification_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_level AS ENUM (
    'none',
    'basic',
    'verified',
    'premium'
);


--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'in_review',
    'auto_approved',
    'auto_rejected',
    'human_review',
    'approved',
    'rejected'
);


--
-- Name: verification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_type AS ENUM (
    'identity',
    'skill_assessment',
    'portfolio',
    'work_history',
    'payment_method'
);


--
-- Name: update_job_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_job_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activitylog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activitylog (
    id uuid NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_id uuid,
    entity_type character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address character varying(45),
    user_agent character varying(500),
    created_at timestamp with time zone NOT NULL
);


--
-- Name: aidecisionlog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aidecisionlog (
    id uuid NOT NULL,
    decision_type character varying(50) NOT NULL,
    model_name character varying(80) NOT NULL,
    model_version character varying(50) NOT NULL,
    prompt_version character varying(50),
    input_hash text,
    input_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    output_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    confidence numeric(10,2),
    action_taken character varying(30),
    latency_ms integer,
    entity_id uuid,
    entity_type character varying(50),
    human_override boolean,
    override_by uuid,
    override_reason text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_url text NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    uploaded_by_id uuid
);


--
-- Name: blog_post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_post (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt text,
    content text DEFAULT ''::text NOT NULL,
    cover_image character varying(500),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    author_id uuid NOT NULL,
    published_at timestamp without time zone,
    meta_title character varying(255),
    meta_description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT blog_post_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: blog_post_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_post_tag (
    post_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: blog_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_tag (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    parent_id integer,
    description text,
    icon character varying(50),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    job_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: clientprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientprofile (
    user_id uuid NOT NULL,
    company_name character varying(200),
    company_website character varying(500),
    company_size character varying(20),
    industry character varying(100),
    company_description text,
    company_logo_url text,
    total_jobs_posted integer DEFAULT 0 NOT NULL,
    total_spent numeric(10,2) DEFAULT 0 NOT NULL,
    avg_rating_given numeric(10,2) DEFAULT 0 NOT NULL,
    total_hires integer DEFAULT 0 NOT NULL,
    payment_verified boolean DEFAULT false NOT NULL,
    verification_level character varying(255) DEFAULT 'none'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: contract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract (
    id uuid NOT NULL,
    job_id uuid,
    proposal_id uuid,
    client_id uuid,
    freelancer_id uuid,
    title character varying(200) NOT NULL,
    description text,
    contract_type character varying(255) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    hourly_rate numeric(10,2),
    weekly_hour_limit integer,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    platform_fee_percent numeric(10,2) DEFAULT 10 NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    total_hours_logged integer DEFAULT 0 NOT NULL,
    total_time_amount numeric(10,2) DEFAULT 0.00 NOT NULL
);


--
-- Name: conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation (
    id uuid NOT NULL,
    contract_id uuid,
    title character varying(200),
    last_message_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    unread_count integer DEFAULT 0 NOT NULL,
    last_read_at timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deliverable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliverable (
    id uuid NOT NULL,
    milestone_id uuid,
    file_url text NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    notes text,
    version integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: deliverables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliverables (
    id uuid NOT NULL,
    milestone_id uuid NOT NULL,
    file_url text DEFAULT ''::text NOT NULL,
    file_name character varying(255) DEFAULT 'file'::character varying NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    mime_type character varying(100) DEFAULT 'application/octet-stream'::character varying NOT NULL,
    notes text,
    version integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dispute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute (
    id uuid NOT NULL,
    contract_id uuid,
    milestone_id uuid,
    raised_by_id uuid,
    reason character varying(255) NOT NULL,
    description text NOT NULL,
    evidence_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    resolution_amount numeric(10,2),
    resolution_notes text,
    resolved_by_id uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    response_deadline timestamp with time zone,
    awaiting_response_from_id uuid
);


--
-- Name: disputemessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputemessage (
    id uuid NOT NULL,
    dispute_id uuid,
    sender_id uuid,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: email_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_preference (
    user_id uuid NOT NULL,
    account_emails boolean DEFAULT true NOT NULL,
    contract_emails boolean DEFAULT true NOT NULL,
    proposal_emails boolean DEFAULT true NOT NULL,
    message_digest boolean DEFAULT true NOT NULL,
    review_emails boolean DEFAULT true NOT NULL,
    payment_emails boolean DEFAULT true NOT NULL,
    job_recommendations boolean DEFAULT true NOT NULL,
    marketing_emails boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: escrowtransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrowtransaction (
    id uuid NOT NULL,
    contract_id uuid,
    milestone_id uuid,
    type character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    gateway_reference character varying(255),
    gateway_metadata jsonb,
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: featureflag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featureflag (
    id uuid NOT NULL,
    key character varying(100) NOT NULL,
    description character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    rollout_percent integer DEFAULT 0 NOT NULL,
    rules jsonb,
    payload jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: freelancer_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.freelancer_skills (
    freelancer_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    years_experience integer,
    proficiency character varying(20)
);


--
-- Name: freelancerprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.freelancerprofile (
    user_id uuid NOT NULL,
    headline character varying(200),
    bio text,
    hourly_rate numeric(10,2),
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    experience_years integer DEFAULT 0 NOT NULL,
    education jsonb DEFAULT '[]'::jsonb NOT NULL,
    certifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    portfolio_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    website_url character varying(500),
    github_url character varying(500),
    linkedin_url character varying(500),
    verification_level character varying(255) DEFAULT 'none'::character varying NOT NULL,
    availability_status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    availability_hours_week integer DEFAULT 40,
    response_rate numeric(10,2) DEFAULT 0 NOT NULL,
    avg_rating numeric(10,2) DEFAULT 0 NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    total_jobs_completed integer DEFAULT 0 NOT NULL,
    total_earnings numeric(10,2) DEFAULT 0 NOT NULL,
    total_hours_logged numeric(10,2) DEFAULT 0 NOT NULL,
    success_rate numeric(10,2) DEFAULT 0 NOT NULL,
    profile_completeness integer DEFAULT 0 NOT NULL,
    profile_embedding text,
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    profile_visibility character varying(20) DEFAULT 'public'::character varying NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitation (
    id uuid NOT NULL,
    job_id uuid,
    client_id uuid,
    freelancer_id uuid,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice (
    id uuid NOT NULL,
    contract_id uuid,
    invoice_number character varying(50) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    issued_at timestamp with time zone NOT NULL,
    due_at timestamp with time zone NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: invoiceline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoiceline (
    id uuid NOT NULL,
    invoice_id integer,
    description character varying(255) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    amount numeric(10,2) NOT NULL,
    milestone_id integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    time_entry_id uuid,
    timesheet_id uuid
);


--
-- Name: job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job (
    id uuid NOT NULL,
    client_id uuid,
    title character varying(200) NOT NULL,
    slug character varying(250) NOT NULL,
    description text NOT NULL,
    description_html text,
    category_id uuid,
    budget_type character varying(255) NOT NULL,
    budget_min numeric(10,2),
    budget_max numeric(10,2),
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    experience_level character varying(20),
    estimated_duration character varying(30),
    location_requirement character varying(20) DEFAULT 'remote'::character varying NOT NULL,
    timezone_preference character varying(50),
    proposals_count integer DEFAULT 0 NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    job_embedding text,
    ai_scope jsonb,
    ai_scope_model_version character varying(50),
    ai_scope_confidence numeric(10,2),
    search_vector text,
    published_at timestamp with time zone,
    closed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    moderation_status character varying(255) DEFAULT 'none'::character varying NOT NULL,
    moderation_ai_result jsonb,
    moderation_ai_confidence numeric(10,2),
    moderation_ai_model_version character varying(50),
    moderation_reviewer_notes text,
    moderation_reviewed_at timestamp with time zone,
    location_type character varying(20) DEFAULT 'worldwide'::character varying NOT NULL,
    location_regions jsonb DEFAULT '[]'::jsonb NOT NULL,
    location_countries jsonb DEFAULT '[]'::jsonb NOT NULL,
    milestones_suggested jsonb DEFAULT '[]'::jsonb NOT NULL,
    moderation_reviewed_by_id uuid,
    weekly_hours_limit integer
);


--
-- Name: job_moderation_conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_moderation_conversation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    sender_type character varying(20) NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: job_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_skills (
    job_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    is_required boolean DEFAULT true NOT NULL
);


--
-- Name: jobattachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobattachment (
    id uuid NOT NULL,
    job_id uuid,
    file_url text NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message (
    id uuid NOT NULL,
    conversation_id uuid,
    sender_id uuid,
    content text NOT NULL,
    message_type character varying(30) DEFAULT 'text'::character varying NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    read_at timestamp with time zone,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: milestone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.milestone (
    id uuid NOT NULL,
    contract_id uuid,
    title character varying(200) NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    due_date timestamp with time zone,
    started_at timestamp with time zone,
    submitted_at timestamp with time zone,
    completed_at timestamp with time zone,
    revision_count integer DEFAULT 0 NOT NULL,
    client_feedback text,
    escrow_funded boolean DEFAULT false NOT NULL,
    escrow_released boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    auto_accept_at timestamp with time zone
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    id uuid NOT NULL,
    user_id uuid,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    priority character varying(20) DEFAULT 'info'::character varying NOT NULL,
    read_at timestamp with time zone,
    channel character varying(50),
    created_at timestamp with time zone NOT NULL
);


--
-- Name: notification_reply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_reply (
    id uuid NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    attachment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: paymentmethod; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paymentmethod (
    id uuid NOT NULL,
    user_id character varying(36),
    type character varying(30) NOT NULL,
    provider character varying(30) NOT NULL,
    last_four character varying(10) NOT NULL,
    token character varying(255),
    is_default boolean DEFAULT false NOT NULL,
    expiry character varying(7),
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    stripe_payment_method_id character varying(255) DEFAULT NULL::character varying,
    verified boolean DEFAULT true,
    setup_intent_id text
);


--
-- Name: payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout (
    id uuid NOT NULL,
    freelancer_id uuid,
    payment_method_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    fee numeric(10,2) DEFAULT 0 NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    gateway_reference character varying(255),
    failure_reason text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT payout_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('delayed'::character varying)::text])))
);


--
-- Name: proposal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal (
    id uuid NOT NULL,
    job_id uuid,
    freelancer_id uuid,
    cover_letter text,
    bid_amount numeric(10,2) NOT NULL,
    bid_type character varying(255) NOT NULL,
    estimated_duration_days integer,
    status character varying(255) DEFAULT 'submitted'::character varying NOT NULL,
    milestones_proposed jsonb DEFAULT '[]'::jsonb NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_match_score numeric(10,2),
    ai_match_model_version character varying(50),
    ai_match_breakdown jsonb,
    ai_fraud_score numeric(10,2),
    ai_fraud_model_version character varying(50),
    ai_fraud_action character varying(20),
    viewed_at timestamp with time zone,
    shortlisted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report (
    id uuid NOT NULL,
    reporter_id uuid,
    reported_entity_id uuid NOT NULL,
    reported_entity_type character varying(50) NOT NULL,
    reason character varying(50) NOT NULL,
    description text,
    evidence_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    reviewed_by_id uuid,
    resolution_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    id uuid NOT NULL,
    contract_id uuid,
    reviewer_id uuid,
    reviewee_id uuid,
    overall_rating numeric(10,2) NOT NULL,
    communication_rating numeric(10,2),
    quality_rating numeric(10,2),
    timeliness_rating numeric(10,2),
    professionalism_rating numeric(10,2),
    comment text,
    response text,
    response_at timestamp with time zone,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: saved_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_job (
    user_id uuid NOT NULL,
    job_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: savedjob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.savedjob (
    id uuid NOT NULL,
    user_id uuid,
    job_id uuid,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: screenshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screenshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    time_entry_id uuid NOT NULL,
    file_url text NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    key_count integer DEFAULT 0 NOT NULL,
    activity_percent numeric(10,2) DEFAULT 0.00 NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    category_id uuid,
    parent_id uuid,
    description text,
    icon character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: time_entry_claim; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entry_claim (
    id uuid NOT NULL,
    time_entry_id uuid,
    client_id uuid,
    type character varying(255) DEFAULT 'detail_request'::character varying NOT NULL,
    message text NOT NULL,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    response text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: timeentry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timeentry (
    id uuid NOT NULL,
    contract_id uuid,
    freelancer_id uuid,
    milestone_id uuid,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    duration_minutes integer DEFAULT 0 NOT NULL,
    description text,
    task_label character varying(200),
    is_manual boolean DEFAULT false NOT NULL,
    is_billable boolean DEFAULT true NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    screenshot_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    activity_score numeric(10,2),
    status character varying(255) DEFAULT 'running'::character varying NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_reason text,
    invoice_line_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'pending_verification'::character varying NOT NULL,
    display_name character varying(100) NOT NULL,
    first_name character varying(80),
    last_name character varying(80),
    avatar_url text,
    phone character varying(30),
    country character(2),
    timezone character varying(50) DEFAULT 'UTC'::character varying NOT NULL,
    locale character varying(10) DEFAULT 'en'::character varying NOT NULL,
    email_verified_at timestamp with time zone,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret character varying(255),
    token_version integer DEFAULT 1 NOT NULL,
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    state character varying(100) DEFAULT NULL::character varying,
    languages jsonb DEFAULT '[]'::jsonb NOT NULL,
    profile_completed boolean DEFAULT false NOT NULL,
    stripe_customer_id character varying(255) DEFAULT NULL::character varying
);


--
-- Name: useroauth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.useroauth (
    id uuid NOT NULL,
    user_id uuid,
    provider character varying(30) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: usersession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usersession (
    id uuid NOT NULL,
    user_id uuid,
    token_hash character varying(64) NOT NULL,
    refresh_token_hash character varying(64),
    ip_address character varying(45) NOT NULL,
    user_agent character varying(500),
    device_fingerprint character varying(64),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id uuid NOT NULL,
    user_id uuid,
    type character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_result jsonb,
    ai_model_version character varying(50),
    ai_confidence numeric(10,2),
    reviewed_by_id uuid,
    reviewer_notes text,
    reviewed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: verification_conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_conversation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_id uuid NOT NULL,
    sender_type character varying(20) NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weeklytimesheet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weeklytimesheet (
    id uuid NOT NULL,
    contract_id uuid,
    freelancer_id uuid,
    week_start date NOT NULL,
    week_end date NOT NULL,
    total_minutes integer DEFAULT 0 NOT NULL,
    billable_minutes integer DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by uuid,
    notes text,
    client_feedback text,
    invoice_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Data for Name: activitylog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activitylog (id, user_id, action, entity_id, entity_type, metadata, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: aidecisionlog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aidecisionlog (id, decision_type, model_name, model_version, prompt_version, input_hash, input_data, output_data, confidence, action_taken, latency_ms, entity_id, entity_type, human_override, override_by, override_reason, created_at) FROM stdin;
\.


--
-- Data for Name: attachment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attachment (id, entity_type, entity_id, file_name, file_path, file_url, file_size, mime_type, sort_order, created_at, uploaded_by_id) FROM stdin;
d46345c1-a2f6-480c-956f-a521f4d588c3	job	7285fed3-5f58-4844-8bc1-17e2f26128b0	Screenshot 2026-02-13 at 8.10.19 PM.png	/app/www/public/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/2505a06ceb8fe2f2ce3d4ac3cfaeec9b.png	/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/2505a06ceb8fe2f2ce3d4ac3cfaeec9b.png	82045	image/png	1	2026-02-15 02:43:28.372559+00	\N
9582aa0b-1cb6-4fe5-b827-5b72bf736f12	job	7285fed3-5f58-4844-8bc1-17e2f26128b0	Screenshot 2026-02-11 at 10.58.33 AM.png	/app/www/public/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/90d5c30ed90e764418100b74f45bfc85.png	/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/90d5c30ed90e764418100b74f45bfc85.png	149233	image/png	0	2026-02-15 02:44:49.110424+00	\N
7989be22-e1a7-4d1d-986e-9b7a3ef71ea6	job	7285fed3-5f58-4844-8bc1-17e2f26128b0	Screenshot 2026-02-11 at 10.57.29 AM.png	/app/www/public/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/4680388516e4e92cdc1de795e0e660ca.png	/files/attachments/job/7285fed3-5f58-4844-8bc1-17e2f26128b0/4680388516e4e92cdc1de795e0e660ca.png	214859	image/png	1	2026-02-15 02:44:49.11173+00	\N
caa7adc6-048c-4676-adcf-e72d1ba75ad5	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-3a2c0522-134a-4bbf-861d-e8450e29f303.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/44ea879728e9661fdd0de325c172c939.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/44ea879728e9661fdd0de325c172c939.jpg	186854	image/jpeg	0	2026-02-15 04:59:09.764358+00	\N
26a51bb5-4f3a-470f-b3b2-1ecca10c79d2	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-33961ede-47f9-4387-acb3-c7c58790d762.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/92b210181c8b2d1591c7ae1a78ea8a88.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/92b210181c8b2d1591c7ae1a78ea8a88.jpg	159478	image/jpeg	0	2026-02-15 04:59:22.875375+00	\N
9348b323-80b7-4cba-862d-a0eef9ad474c	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-2e68721c-d0a6-4c10-a9c4-6dbad0ba5969.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/c894880a09f7cc1852a5e41bcbb6f554.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/c894880a09f7cc1852a5e41bcbb6f554.jpg	161050	image/jpeg	0	2026-02-15 04:59:52.35778+00	\N
28eaa166-78bb-4842-b8f5-c5b36d7efd01	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-f17591b8-b277-4deb-a7cc-b0f1d2a921b7.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/6ef5d529d269b64326c1a96a3ea71c3c.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/6ef5d529d269b64326c1a96a3ea71c3c.jpg	181624	image/jpeg	0	2026-02-15 05:02:25.54033+00	\N
5e8abf0c-6a11-4ab2-afa5-2edf879ba0b4	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-a86cd93c-071e-40bf-a26f-56773fe71ffd.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/7f730759982141bf667c7d0d2dc13844.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/7f730759982141bf667c7d0d2dc13844.jpg	184899	image/jpeg	0	2026-02-15 05:02:31.451169+00	\N
a0a6162d-1938-45f5-8e10-90ed80bfbf09	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-1bb55f4b-f920-43d4-aa64-5c9fe4a70466.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/6b5bc5b7e719b252c950e5712e12c8f2.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/6b5bc5b7e719b252c950e5712e12c8f2.jpg	179109	image/jpeg	0	2026-02-15 05:03:07.586545+00	\N
ac2c9128-0eba-40ab-bb01-9ba6b9818e55	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-e34cc538-9ff0-4036-8495-85a753025df1.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/998f91bb437362e2a91a931b19ecffaa.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/998f91bb437362e2a91a931b19ecffaa.jpg	180493	image/jpeg	0	2026-02-15 05:04:00.459256+00	\N
493f636b-4c9a-4f59-9a61-ba2c119cfd2d	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-339cde82-4f77-4023-a77b-2685030242c9.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/df7f6e0619b12e262c2f1e16a142ed58.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/df7f6e0619b12e262c2f1e16a142ed58.jpg	197575	image/jpeg	0	2026-02-15 05:04:25.286325+00	\N
e9f9c10e-b558-43a1-96c0-9475ae51e498	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	Screenshot 2026-02-14 at 10.04.24 PM.png	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/a4f4dcfdf0dd64cd274caf5eca8190d0.png	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/a4f4dcfdf0dd64cd274caf5eca8190d0.png	337969	image/png	0	2026-02-15 05:05:06.134649+00	\N
0e7d797a-2ec6-46c5-9be0-47e7b25dcd31	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-0951901c-8c03-4d0b-8f20-9eb71cca3c3e.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/c29252ef83c4a36550171e31c0fdfad1.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/c29252ef83c4a36550171e31c0fdfad1.jpg	182246	image/jpeg	0	2026-02-15 05:06:22.601034+00	\N
0d08ed8d-6375-44ab-b7d2-36fce9f2a0a9	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	Screenshot 2026-02-14 at 9.59.56 PM.png	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/71c5719e63b078280b16b82fe1cee3cd.png	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/71c5719e63b078280b16b82fe1cee3cd.png	20486	image/png	0	2026-02-15 05:06:29.169615+00	\N
97d76f40-103e-454e-a778-274e9fd06401	verification	9a593055-1bd8-45d3-b276-113fa5dd1bc4	gov-id-83300aa0-d268-45fe-8d9c-83278a46e53c.jpg	/app/www/public/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/94c1926890b1300252dc76dd1d000fd7.jpg	/files/attachments/verification/9a593055-1bd8-45d3-b276-113fa5dd1bc4/94c1926890b1300252dc76dd1d000fd7.jpg	186555	image/jpeg	0	2026-02-15 05:06:34.303898+00	\N
d36fee40-a566-4568-8d30-413459d16410	notification_reply	bbb22e84-6d38-460f-89e2-b13651d897d7	Screenshot 2026-02-15 at 4.44.25 PM.png	/app/www/public/files/attachments/notification_reply/bbb22e84-6d38-460f-89e2-b13651d897d7/4392b99b2615960a2a90cb199accc4d8.png	/files/attachments/notification_reply/bbb22e84-6d38-460f-89e2-b13651d897d7/4392b99b2615960a2a90cb199accc4d8.png	153234	image/png	0	2026-02-15 23:56:20.507515+00	\N
0007dc1f-5daa-4243-a3b8-9f397a45643d	notification_reply	bbb22e84-6d38-460f-89e2-b13651d897d7	Screenshot 2026-02-15 at 4.44.25 PM.png	/app/www/public/files/attachments/notification_reply/bbb22e84-6d38-460f-89e2-b13651d897d7/c5558d70dc240144f63ad5244856062d.png	/files/attachments/notification_reply/bbb22e84-6d38-460f-89e2-b13651d897d7/c5558d70dc240144f63ad5244856062d.png	153234	image/png	0	2026-02-15 23:56:38.320547+00	\N
bb623608-68a3-45f7-bf0e-c410354af35e	notification_reply	dd90646f-31ef-4e69-bad2-16bee40202a1	Screenshot 2026-02-15 at 4.44.25 PM.png	/app/www/public/files/attachments/notification_reply/dd90646f-31ef-4e69-bad2-16bee40202a1/1a9fe1688f22c6e3cc1ec147bfc46e39.png	/files/attachments/notification_reply/dd90646f-31ef-4e69-bad2-16bee40202a1/1a9fe1688f22c6e3cc1ec147bfc46e39.png	153234	image/png	0	2026-02-15 23:58:16.356115+00	\N
126cb6bd-8b78-472b-a3f8-8c01387c75a8	job	b2779bb4-a562-4a2a-b068-56d653fcd2d7	Screenshot 2026-02-15 at 5.31.58 PM.png	/app/www/public/files/attachments/job/b2779bb4-a562-4a2a-b068-56d653fcd2d7/36ee8b1e1c06bb43717d59216d24cd08.png	/files/attachments/job/b2779bb4-a562-4a2a-b068-56d653fcd2d7/36ee8b1e1c06bb43717d59216d24cd08.png	167897	image/png	0	2026-02-16 02:13:55.011601+00	\N
763e6ec7-8124-4d8b-a702-32911fe49e21	job	b2779bb4-a562-4a2a-b068-56d653fcd2d7	Screenshot 2026-02-15 at 6.19.37 PM.png	/app/www/public/files/attachments/job/b2779bb4-a562-4a2a-b068-56d653fcd2d7/af883c7fb988cb48c9177fa42457d865.png	/files/attachments/job/b2779bb4-a562-4a2a-b068-56d653fcd2d7/af883c7fb988cb48c9177fa42457d865.png	89752	image/png	1	2026-02-16 02:13:55.020827+00	\N
5be49d8a-76a5-4ea0-9aff-f1b7114df5bd	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/03176fce82429db5162e7b1e2a8bf142.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/03176fce82429db5162e7b1e2a8bf142.png	270419	image/png	0	2026-02-16 19:43:12.050035+00	\N
893c6e65-396f-40c4-9fd2-99b2a1d01acf	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/5e02d80a3ba790e8d8f72b6a30056be6.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/5e02d80a3ba790e8d8f72b6a30056be6.png	14235	image/png	0	2026-02-16 20:49:16.822037+00	\N
2c7a2740-d587-4bce-8366-865e6658ba39	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/269b1d0a5e33b32c1be793c2f2ab450e.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/269b1d0a5e33b32c1be793c2f2ab450e.png	270419	image/png	0	2026-02-16 20:49:20.357094+00	\N
39218fa3-c073-4b56-9fc9-980563557931	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/a06e84c75525b8215654a866c553085d.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/a06e84c75525b8215654a866c553085d.png	14235	image/png	0	2026-02-16 20:50:57.369829+00	\N
08dd40cb-08c0-4c03-8b49-3d1ba0ebfbe9	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/e92d498dd62c24a6884ee22504ac0153.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/e92d498dd62c24a6884ee22504ac0153.png	270419	image/png	1	2026-02-16 20:50:57.373282+00	\N
4e9fc055-bdcf-402a-a152-026107a1bcea	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/7baa88d6f354127658a5f5f58e123cbf.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/7baa88d6f354127658a5f5f58e123cbf.png	14235	image/png	0	2026-02-16 20:55:57.454623+00	\N
b5d0cc6e-1195-4bc8-97e9-065aaa97ac7a	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/de714926669b2a5ece242b6eaa43f986.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/de714926669b2a5ece242b6eaa43f986.png	270419	image/png	1	2026-02-16 20:55:57.459083+00	\N
5d7c2782-8aa4-48eb-bd3e-90667888bdb6	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/d00d97c385d5a3a09a4de7783f38b576.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/d00d97c385d5a3a09a4de7783f38b576.png	14235	image/png	0	2026-02-16 21:09:17.694805+00	\N
23d629cd-552c-4110-93b5-a2e38f9cd981	proposal	71ca9c0c-58c1-4a54-9713-83e8fa16777f	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/ef729bb5e57a97b9ac0a742a1b9ab3f9.png	/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/ef729bb5e57a97b9ac0a742a1b9ab3f9.png	270419	image/png	1	2026-02-16 21:09:17.698936+00	\N
010a5a02-a63b-4f4b-a43e-b367d64497b6	conversation_message	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/b80818401eb22b62ee99b0cddab9b00c.png	/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/b80818401eb22b62ee99b0cddab9b00c.png	14235	image/png	0	2026-02-17 00:37:29.577082+00	\N
bf4b4267-417b-4fd8-863b-39f7548d41a5	conversation_message	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	Screenshot 2026-02-15 at 8.08.41 PM.png	/app/www/public/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/2037eded6e6a55a62ed0f64dda94099d.png	/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/2037eded6e6a55a62ed0f64dda94099d.png	270419	image/png	1	2026-02-17 00:37:29.588743+00	\N
78bb35ce-2f22-4673-b4e1-8875f9b4a929	job	07bf9891-5ffb-435d-bd01-0138174b9fe8	Screenshot 2026-02-16 at 12.07.29 PM.png	/app/www/public/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/06ffb4658ec5e2f0d22528989a484e67.png	/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/06ffb4658ec5e2f0d22528989a484e67.png	21182	image/png	0	2026-02-17 02:06:42.212015+00	\N
dd64b024-a43f-4f38-8c79-499cc621dc5b	job	07bf9891-5ffb-435d-bd01-0138174b9fe8	Screenshot 2026-02-15 at 8.58.52 PM.png	/app/www/public/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/214e8085fedb8fedf7f35fbb024a31f1.png	/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/214e8085fedb8fedf7f35fbb024a31f1.png	36371	image/png	1	2026-02-17 02:06:42.225949+00	\N
0d4409fb-08a1-47f1-9add-b3c851943028	job	07bf9891-5ffb-435d-bd01-0138174b9fe8	Screenshot 2026-02-15 at 8.32.05 PM.png	/app/www/public/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/1f87bd9eea9c3f1cc4834b0bf86ad694.png	/files/attachments/job/07bf9891-5ffb-435d-bd01-0138174b9fe8/1f87bd9eea9c3f1cc4834b0bf86ad694.png	14235	image/png	2	2026-02-17 02:06:42.227734+00	\N
bf8a9699-a08b-47ff-97de-ce6bd8fecabd	job	6f03333a-5d31-43ef-bdb0-caa954b4ab08	Screenshot 2026-02-16 at 12.24.55 PM.png	/app/www/public/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/3196fb00293755a2238940cbbd15f705.png	/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/3196fb00293755a2238940cbbd15f705.png	120609	image/png	0	2026-02-17 02:26:12.466455+00	\N
5231e16b-af90-4823-8da4-3d506943b355	job	6f03333a-5d31-43ef-bdb0-caa954b4ab08	Screenshot 2026-02-16 at 12.07.29 PM.png	/app/www/public/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/aaafc45a460ae21eaeab2f440d3f8a0e.png	/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/aaafc45a460ae21eaeab2f440d3f8a0e.png	21182	image/png	1	2026-02-17 02:26:12.470465+00	\N
7979d632-ab6d-4a82-99e6-af60c6e9fb5b	job	6f03333a-5d31-43ef-bdb0-caa954b4ab08	Screenshot 2026-02-15 at 8.58.52 PM.png	/app/www/public/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/f7aaf281905d9e63517876201c4558b2.png	/files/attachments/job/6f03333a-5d31-43ef-bdb0-caa954b4ab08/f7aaf281905d9e63517876201c4558b2.png	36371	image/png	2	2026-02-17 02:26:12.472533+00	\N
9c7c96fd-a491-433a-a70c-97d9d18fc51a	conversation_message	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	Screenshot 2026-02-18 at 12.21.01 PM.png	/app/www/public/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/a21206218a1f455bed4f173ad5cf1b71.png	/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/a21206218a1f455bed4f173ad5cf1b71.png	907762	image/png	0	2026-02-18 22:13:59.667844+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
127cea6a-49dc-4ea9-8280-cff0b04242fa	conversation_message	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	Screenshot 2026-02-18 at 11.59.51 AM.png	/app/www/public/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/314b0ae236f132dd7cbaff82920cfc3d.png	/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/314b0ae236f132dd7cbaff82920cfc3d.png	216991	image/png	1	2026-02-18 22:13:59.680729+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
6b238b61-25ea-471d-ac99-c75bd551611d	job	ef3885ce-9673-47cb-ba68-1880562adc56	Screenshot 2026-02-18 at 12.21.01 PM.png	/app/www/public/files/attachments/job/ef3885ce-9673-47cb-ba68-1880562adc56/995797409140bd77304b282fd48eaed7.png	/files/attachments/job/ef3885ce-9673-47cb-ba68-1880562adc56/995797409140bd77304b282fd48eaed7.png	907762	image/png	0	2026-02-18 22:15:39.137329+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
7e1e9de5-b781-4355-9bc0-9b475e43715e	job	ef3885ce-9673-47cb-ba68-1880562adc56	Screenshot 2026-02-18 at 11.59.51 AM.png	/app/www/public/files/attachments/job/ef3885ce-9673-47cb-ba68-1880562adc56/9d4f13a3cad0fe67ab2f1bb5e7bce565.png	/files/attachments/job/ef3885ce-9673-47cb-ba68-1880562adc56/9d4f13a3cad0fe67ab2f1bb5e7bce565.png	216991	image/png	1	2026-02-18 22:15:39.138896+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
133d44da-6d0a-4053-9c1b-b2136f280bb0	proposal	04e904f9-6395-45b4-8182-e8d91907a44e	Screenshot 2026-02-17 at 4.36.03 PM.png	/app/www/public/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/e7e39e7f7c84da425b3623c22a3e61f1.png	/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/e7e39e7f7c84da425b3623c22a3e61f1.png	34627	image/png	0	2026-02-18 22:21:03.588365+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
1bb43568-fe8b-443a-bec9-d8118bc7c10f	proposal	04e904f9-6395-45b4-8182-e8d91907a44e	Screenshot 2026-02-17 at 4.34.18 PM.png	/app/www/public/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/c5c56ae038f6cbcc6893630c11d83a94.png	/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/c5c56ae038f6cbcc6893630c11d83a94.png	66170	image/png	1	2026-02-18 22:21:03.595908+00	300e3c58-9465-4a6f-bfe9-8bb6d5f40136
247625c3-a344-40f7-9329-51c28adf42ad	timeentry	de2264da-6b19-45d8-94f7-ca36430e8be7	screenshot-1771612566558.png	/app/www/public/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/db270a9f4ba3fa3c0eae0b35203bbe3f.png	/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/db270a9f4ba3fa3c0eae0b35203bbe3f.png	7804418	image/png	0	2026-02-20 18:36:06.717501+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
2b27cfd9-eb32-4855-8047-5028605dd121	timeentry	de2264da-6b19-45d8-94f7-ca36430e8be7	screenshot-1771612932175.png	/app/www/public/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/fd5b63981b6adf5c5ec5004c4e36213a.png	/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/fd5b63981b6adf5c5ec5004c4e36213a.png	985978	image/png	0	2026-02-20 18:42:12.238504+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
e6a0510e-e095-43b5-bcd0-682be0ec8594	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-21 at 12.14.00 PM.png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/4388ea7f7917b7f08650dbca5bccb914.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/4388ea7f7917b7f08650dbca5bccb914.png	245742	image/png	0	2026-02-23 02:07:58.158077+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
3bb6217c-6d5a-42ff-bc92-7932ea618c27	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-21 at 12.14.00 PM.png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/b858fc0e0fe2e7e09adf2dcbe7e192f7.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/b858fc0e0fe2e7e09adf2dcbe7e192f7.png	245742	image/png	0	2026-02-23 02:11:06.680501+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
7b95569a-2ea8-4bc9-8eaf-b80aa84999cd	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-21 at 12.14.00 PM.png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/c6826af494aa806c6a418d2afe72e664.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/c6826af494aa806c6a418d2afe72e664.png	245742	image/png	0	2026-02-23 02:14:34.819889+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
ef697e9a-c5a0-47d2-b863-3496c6a10588	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-22 at 7.05.24 PM (2).png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/51ca46b380aa839ee6bfca0f8e4b43ee.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/51ca46b380aa839ee6bfca0f8e4b43ee.png	786641	image/png	0	2026-02-23 02:14:50.861501+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
e09484fc-c952-42ef-8ab2-1f799ef1f94d	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-22 at 7.05.24 PM (2).png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/77ccd9bc8cbfdfae4740a732090f4b4a.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/77ccd9bc8cbfdfae4740a732090f4b4a.png	786641	image/png	0	2026-02-23 02:15:49.127115+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
8c021822-2da6-4503-9e99-52201384f81f	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-22 at 7.05.24 PM.png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/63a99296e8dd13c79aebe3932009189b.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/63a99296e8dd13c79aebe3932009189b.png	2773004	image/png	0	2026-02-23 02:20:59.440436+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
1b69036c-5074-48b3-a91c-c5c38ed6dc74	milestone	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	Screenshot 2026-02-22 at 7.05.24 PM (2).png	/app/www/public/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/20dbc51180d3693778595321c73e6aac.png	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/20dbc51180d3693778595321c73e6aac.png	786641	image/png	0	2026-02-23 02:43:59.810806+00	9a593055-1bd8-45d3-b276-113fa5dd1bc4
\.


--
-- Data for Name: blog_post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_post (id, title, slug, excerpt, content, cover_image, status, author_id, published_at, meta_title, meta_description, created_at, updated_at) FROM stdin;
9bc8227d-0406-434a-9376-48ed4d8d551a	Why MonkeysWork Is Building a Better Freelance Platform for the AI Era	2026-02-22-why-monkeyswork-is-building-a-better-freelance-platform-for-the-ai-era	MonkeysWork is building a new freelance platform focused on transparency, AI-assisted matching, and fair commissions — 10% on the first $10K per client, then 5%. Here’s why we’re doing it.	<h3>The freelance world is broken (and we all know it)</h3><p>Freelancers feel squeezed by high fees.<br>Clients struggle to find the right talent.<br>Platforms hide pricing rules, ranking logic, and data.</p><p>After building MonkeysCMS, MonkeysAI, and working with agencies across Denver and internationally, we saw the same problem again and again:</p><p>👉 Great engineers and designers waste time chasing bad projects.<br>👉 Great clients waste weeks filtering low-quality proposals.</p><p>So we decided to build <strong>MonkeysWork</strong>.</p><hr><h3>What makes MonkeysWork different</h3><p>MonkeysWork is not just another Upwork clone.<br>It’s built around three principles:</p><p>1. Transparent pricing</p><p>No hidden fees.</p><p>Our model is simple:</p><p>👉 <strong>10% commission on the first $10,000 per client relationship</strong><br>👉 <strong>5% after that</strong></p><p>That’s it.</p><p>No monthly subscriptions.<br>No surprise deductions.<br>No ranking tricks.</p><p>This aligns incentives: the longer a client and freelancer work together, the less the platform takes.</p><hr><p>2. AI that actually helps</p><p>Because we already run our own infrastructure with MonkeysAI (no external tokens, no black-box APIs), we can integrate AI deeply into the platform:</p><ul><li><p>AI scope assistant to define projects clearly</p></li><li><p>Smart freelancer matching</p></li><li><p>Proposal quality analysis</p></li><li><p>Contract risk detection</p></li><li><p>Automatic milestone planning</p></li><li><p>Performance insights for clients</p></li></ul><p>This saves time for both sides.</p><p>You spend less time writing proposals and more time delivering work.</p><hr><p>3. Built by engineers for engineers</p><p>We run real production systems:</p><ul><li><p>Next.js + Symfony platforms</p></li><li><p>Kubernetes GPU clusters for AI</p></li><li><p>Git workflows with NodeGit</p></li><li><p>DevOps pipelines on Google Cloud</p></li><li><p>Real-time collaboration tools</p></li></ul><p>So MonkeysWork is designed for real workflows:</p><ul><li><p>Git-linked projects</p></li><li><p>Milestone-based contracts</p></li><li><p>Time tracking apps (desktop + mobile)</p></li><li><p>Secure file exchange</p></li><li><p>Real-time chat and reporting</p></li></ul><p>Not just messaging and payments.</p><hr><h3>Why we’re building this now</h3><p>Freelancing is changing.</p><p>AI is increasing productivity, but platforms are still stuck in 2015.</p><p>We believe the future freelance platform must be:</p><p>✔ Transparent<br>✔ AI-assisted<br>✔ Developer-friendly<br>✔ Fair in pricing<br>✔ Global but human</p><p>That’s what MonkeysWork is.</p><hr><h3>Our long-term vision</h3><p>MonkeysWork is part of a bigger ecosystem:</p><ul><li><p><strong>MonkeysCMS</strong> → AI-native CMS</p></li><li><p><strong>MonkeysAI</strong> → self-hosted AI models</p></li><li><p><strong>MonkeysRaiser</strong> → founder &amp; investor marketplace</p></li><li><p><strong>MonkeysCloud</strong> → DevOps + hosting platform</p></li></ul><p>Together, they create a full stack for startups, agencies, and freelancers to build, launch, and scale projects.</p><hr><h3>Join early and help shape the platform</h3><p>We’re currently inviting early freelancers and clients.</p><p>If you want:</p><p>✔ Better projects<br>✔ Fair commissions<br>✔ AI tools that actually help<br>✔ A platform built by real engineers</p><p>👉 Create your free profile today.</p><p>Let’s build the future of freelancing together.</p>	http://localhost:8086/files/blog/20260222-201427-77e51e6c.jpg	published	aa04c891-a753-48bb-a2c9-9f2a528d946b	2026-02-22 20:10:51	MonkeysWork Pricing & Platform — Fair Freelancing with AI	Discover MonkeysWork, a new freelance platform with transparent fees (10% then 5%), AI-powered matching, and tools built for real developers and agencies.	2026-02-22 20:10:51	2026-02-22 20:14:32
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	The Freelancer’s Superpower: Clear Communication That Wins Better Projects	2026-02-23-the-freelancer-s-superpower-clear-communication-that-wins-better-projects	Great freelancers aren’t just skilled — they communicate clearly. Learn how better communication helps you win projects, keep clients, and grow your income on MonkeysWork.	<h3>Communication is the difference between a job… and a long-term client</h3><p>Most freelancers think success comes from technical skills.</p><p>But after working with hundreds of teams through MonkeysCMS, MonkeysAI, and agency projects across Denver and globally, we saw something very clear:</p><p>👉 The best freelancers are the best communicators.</p><p>They don’t just code or design.<br>They explain. They guide. They clarify.</p><p>And clients trust them more.</p><hr><h3>Why communication matters even more in remote work</h3><p>Freelancing today is global.</p><p>Different time zones. Different cultures. Different expectations.</p><p>Without clear communication, projects fail because of:</p><ul><li><p>Unclear scope</p></li><li><p>Hidden assumptions</p></li><li><p>Silent delays</p></li><li><p>Misunderstood requirements</p></li><li><p>Poor feedback loops</p></li></ul><p>Not because of bad skills.</p><p>That’s why MonkeysWork is building tools to help freelancers communicate better — not just chat.</p><hr><h3>The 5 communication habits of top freelancers</h3><p>1. Confirm the scope in writing</p><p>After every call, send a short summary:</p><ul><li><p>What will be delivered</p></li><li><p>When</p></li><li><p>What is NOT included</p></li></ul><p>This avoids 90% of conflicts.</p><p>MonkeysWork’s AI scope assistant helps generate this automatically so you don’t forget details.</p><hr><p>2. Show progress early and often</p><p>Don’t disappear for a week.</p><p>Send updates like:</p><p>✔ “Login API finished, working on dashboard UI next.”<br>✔ “Found performance issue, fixing cache strategy.”</p><p>Clients relax when they see movement.</p><p>MonkeysWork’s milestone tracking and reporting tools help you do this in one click.</p><hr><p>3. Ask better questions</p><p>Great freelancers don’t guess.</p><p>They ask:</p><ul><li><p>Who is the final user?</p></li><li><p>What problem are we solving?</p></li><li><p>What happens if traffic grows 10x?</p></li></ul><p>This is how real engineers think — and clients notice.</p><p>Our AI assistant can suggest questions based on the project description.</p><hr><p>4. Explain trade-offs</p><p>Clients don’t always know technical limits.</p><p>Instead of saying “That’s hard,” say:</p><p>👉 “We can build this fast without real-time sync, or slower with full real-time updates. Which do you prefer?”</p><p>This builds trust.</p><hr><p>5. Document decisions</p><p>Write things down.</p><p>Even small decisions.</p><p>MonkeysWork will keep contract notes, milestone history, and conversation summaries so both sides stay aligned.</p><p>No more “but I thought…” moments.</p><hr><h3>How better communication earns you more money</h3><p>Clear communication leads to:</p><p>✔ Higher client trust<br>✔ Repeat contracts<br>✔ Referrals<br>✔ Faster approvals<br>✔ Fewer disputes</p><p>And on MonkeysWork, that means paying less platform fee over time:</p><p>👉 <strong>10% on the first $10K per client</strong><br>👉 <strong>5% after that</strong></p><p>So strong communication literally increases your income.</p><hr><h3>Tools we’re building to help freelancers communicate</h3><p>Because we run MonkeysAI on our own infrastructure (no external tokens, real privacy), we can integrate tools like:</p><ul><li><p>AI project summaries</p></li><li><p>Auto meeting notes</p></li><li><p>Contract clarity checks</p></li><li><p>Proposal improvement suggestions</p></li><li><p>Risk detection in requirements</p></li><li><p>Client-friendly technical explanations</p></li></ul><p>Communication becomes easier — not harder.</p><hr><h3>Communication is a skill you can train</h3><p>You don’t need perfect English.<br>You don’t need long emails.</p><p>You need clarity.</p><p>Short messages. Honest updates. Clear expectations.</p><p>That’s what builds real freelance careers.</p><hr><h3>Join a platform that values real collaboration</h3><p>MonkeysWork is built by engineers running real production systems with Next.js, Symfony, Kubernetes, and Google Cloud.</p><p>We understand real workflows — and real communication.</p><p>If you want better clients, fair commissions, and tools that help you grow:</p><p>👉 Create your free freelancer profile today.</p><p>Let’s build better projects together.</p>	http://localhost:8086/files/blog/20260223-013732-e70af120.jpg	published	aa04c891-a753-48bb-a2c9-9f2a528d946b	2026-02-23 01:38:40	Freelancer Communication Tips — Win Better Projects on MonkeysWork	Learn how clear communication helps freelancers win better clients, avoid conflicts, and earn more on MonkeysWork with fair commissions and AI tools.	2026-02-23 01:38:40	2026-02-23 01:38:40
683b07dc-125a-4953-a167-25a5302289ad	How to Write a Freelance Contract That Protects Your Project (and Your Budget)	2026-02-23-how-to-write-a-freelance-contract-that-protects-your-project-and-your-budget	A clear contract saves time, money, and stress. Learn how to define scope, milestones, and communication rules to get better results from freelancers on MonkeysWork.	<h3>A contract is not paperwork — it’s your project blueprint</h3><p>Many clients treat contracts as a formality.</p><p>But after building platforms like MonkeysCMS, running real production systems on Google Cloud, and managing projects across agencies in Denver and globally, we’ve seen the truth:</p><p>👉 Most project problems start with a bad contract.</p><p>Not bad freelancers.<br>Not bad clients.</p><p>Just unclear expectations.</p><p>A good contract protects <strong>both sides</strong> and makes your project faster, cheaper, and calmer.</p><hr><h3>What every freelance contract must include</h3><p>Here are the key elements we recommend for every MonkeysWork project.</p><hr><h3>1. Clear scope definition</h3><p>Describe <strong>what will be built</strong> and <strong>what will not</strong>.</p><p>Example:</p><p>✔ Build login system with email/password<br>✔ Admin dashboard with 5 pages<br>✔ Deploy to staging server</p><p>❌ No mobile app<br>❌ No payment integration<br>❌ No long-term maintenance</p><p>This avoids scope creep and surprise costs.</p><p>MonkeysWork’s AI Scope Assistant helps you generate a clean scope before hiring.</p><hr><h3>2. Milestones with deliverables</h3><p>Break the project into steps.</p><p>Example:</p><p><strong>Milestone 1</strong> – UI design<br><strong>Milestone 2</strong> – Backend API<br><strong>Milestone 3</strong> – Testing &amp; deployment</p><p>Each milestone should include:</p><ul><li><p>Deliverables</p></li><li><p>Deadline</p></li><li><p>Payment amount</p></li><li><p>Review period</p></li></ul><p>This keeps progress visible and reduces risk.</p><hr><h3>3. Communication rules</h3><p>Many projects fail because no one defines communication.</p><p>Your contract should include:</p><ul><li><p>Weekly update requirement</p></li><li><p>Response time expectations</p></li><li><p>Preferred channels</p></li><li><p>Demo schedule</p></li></ul><p>MonkeysWork includes real-time chat, milestone reports, and automated summaries so both sides stay aligned.</p><hr><h3>4. Change request process</h3><p>Projects evolve. That’s normal.</p><p>Your contract should say:</p><p>👉 How new features are requested<br>👉 How they’re estimated<br>👉 How they’re approved</p><p>This prevents tension later.</p><hr><h3>5. Ownership and access</h3><p>Define who owns:</p><ul><li><p>Code repositories</p></li><li><p>Designs</p></li><li><p>Data</p></li><li><p>Documentation</p></li></ul><p>At MonkeysWork we recommend Git-linked projects and shared access so clients always have control.</p><hr><h3>6. Payment structure</h3><p>Clear payments build trust.</p><p>We recommend milestone payments with escrow.</p><p>And remember, MonkeysWork keeps pricing simple:</p><p>👉 <strong>10% commission on the first $10,000 per client relationship</strong><br>👉 <strong>5% after that</strong></p><p>No hidden fees. No surprises.</p><p>The longer you work with a freelancer, the less the platform takes.</p><hr><h3>Why clear contracts save money</h3><p>A strong contract reduces:</p><p>✔ Delays<br>✔ Misunderstandings<br>✔ Rework<br>✔ Disputes<br>✔ Freelancer turnover</p><p>This is especially important in technical projects like Next.js apps, Symfony APIs, Kubernetes deployments, or AI integrations — where unclear requirements can cost weeks.</p><hr><h3>Tools we’re building to help clients</h3><p>Because MonkeysWork runs on our own MonkeysAI infrastructure, we can offer tools like:</p><ul><li><p>AI contract clarity checks</p></li><li><p>Scope risk detection</p></li><li><p>Budget estimation</p></li><li><p>Milestone planning</p></li><li><p>Automatic meeting notes</p></li><li><p>Progress dashboards</p></li></ul><p>These tools help clients without needing technical expertise.</p><hr><h3>The best contracts feel simple</h3><p>A good contract is not long or complicated.</p><p>It is clear.</p><p>If a freelancer and client can both explain the project in two minutes, the contract is good.</p><p>If not, rewrite it.</p><hr><h3>Build projects with confidence</h3><p>MonkeysWork is built by engineers running real production platforms with Next.js, Symfony, Kubernetes, and Google Cloud.</p><p>We understand real projects — and real contracts.</p><p>If you want:</p><p>✔ Better freelancers<br>✔ Clear contracts<br>✔ Transparent pricing<br>✔ AI tools that help</p><p>👉 Create your free client account today.</p><p>Let’s build projects that actually ship.</p>	http://localhost:8086/files/blog/20260223-014715-e93a7e5d.jpg	published	aa04c891-a753-48bb-a2c9-9f2a528d946b	2026-02-23 01:47:34	Freelance Contract Guide for Clients — Hire Better on MonkeysWork	Learn how to write clear freelance contracts with scope, milestones, and communication rules. Avoid delays and get better results on MonkeysWork.	2026-02-23 01:47:34	2026-02-23 01:47:34
\.


--
-- Data for Name: blog_post_tag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_post_tag (post_id, tag_id) FROM stdin;
9bc8227d-0406-434a-9376-48ed4d8d551a	c4b237ca-225a-4431-b2f3-f4b8d93d933c
9bc8227d-0406-434a-9376-48ed4d8d551a	8c99ce74-ce45-4288-9d56-663ef1503923
9bc8227d-0406-434a-9376-48ed4d8d551a	8aa20bb9-4902-43ec-ab8d-8ebf88de1cfd
9bc8227d-0406-434a-9376-48ed4d8d551a	0a40f2ad-0543-41c5-8ecd-6cf48d44bffb
9bc8227d-0406-434a-9376-48ed4d8d551a	8ad863af-7ba2-4cdb-bfec-94c85245361d
9bc8227d-0406-434a-9376-48ed4d8d551a	63cd909c-58d0-4716-a6f8-f29c01c4e0f6
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	8ad863af-7ba2-4cdb-bfec-94c85245361d
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	8aa20bb9-4902-43ec-ab8d-8ebf88de1cfd
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	20d12f2f-4130-44c7-97c9-eb5c0bd073f9
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	0a40f2ad-0543-41c5-8ecd-6cf48d44bffb
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	90167797-e72f-424f-9f7e-ab619d735416
1e4d708d-9fd1-42f5-8bea-3a5140cb4821	285b142c-bb5f-44bb-bda6-de4f84d8d7d1
683b07dc-125a-4953-a167-25a5302289ad	aab14f20-a154-4fbd-bdf9-709694226766
683b07dc-125a-4953-a167-25a5302289ad	8aa20bb9-4902-43ec-ab8d-8ebf88de1cfd
683b07dc-125a-4953-a167-25a5302289ad	edfc6aa1-ac66-4a8d-a73a-061264228790
683b07dc-125a-4953-a167-25a5302289ad	0a40f2ad-0543-41c5-8ecd-6cf48d44bffb
683b07dc-125a-4953-a167-25a5302289ad	6a35b59c-cc04-4de5-b1fb-49ab83905a53
683b07dc-125a-4953-a167-25a5302289ad	63cd909c-58d0-4716-a6f8-f29c01c4e0f6
\.


--
-- Data for Name: blog_tag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_tag (id, name, slug, created_at) FROM stdin;
8aa20bb9-4902-43ec-ab8d-8ebf88de1cfd	freelancing	freelancing	2026-02-22 20:10:09.922042
0a40f2ad-0543-41c5-8ecd-6cf48d44bffb	monkeyswork	monkeyswork	2026-02-22 20:10:15.529842
8ad863af-7ba2-4cdb-bfec-94c85245361d	remote-work	remote-work	2026-02-22 20:10:20.674218
c4b237ca-225a-4431-b2f3-f4b8d93d933c	ai-platform	ai-platform	2026-02-22 20:10:25.171657
63cd909c-58d0-4716-a6f8-f29c01c4e0f6	startup-tools	startup-tools	2026-02-22 20:10:30.794419
8c99ce74-ce45-4288-9d56-663ef1503923	developers	developers	2026-02-22 20:10:35.140522
20d12f2f-4130-44c7-97c9-eb5c0bd073f9	communication-skills	communication-skills	2026-02-23 01:38:09.800893
90167797-e72f-424f-9f7e-ab619d735416	career-growth	career-growth	2026-02-23 01:38:19.430595
285b142c-bb5f-44bb-bda6-de4f84d8d7d1	ai-tools	ai-tools	2026-02-23 01:38:24.399374
aab14f20-a154-4fbd-bdf9-709694226766	clients	clients	2026-02-23 01:44:30.202959
edfc6aa1-ac66-4a8d-a73a-061264228790	contracts	contracts	2026-02-23 01:44:39.223818
6a35b59c-cc04-4de5-b1fb-49ab83905a53	project-management	project-management	2026-02-23 01:44:50.364828
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.category (id, name, slug, parent_id, description, icon, sort_order, is_active, job_count, created_at) FROM stdin;
88115571-e2ba-40df-9bf2-b83184d7e5c6	Development & IT	development-it	\N	Software development, DevOps, and IT support	code	0	t	0	2026-02-14 03:30:31.743439+00
09c5dfc3-dffc-4a71-b4dc-e77da1984702	Design & Creative	design-creative	\N	Graphic design, UI/UX, and creative arts	palette	0	t	0	2026-02-14 03:30:31.746201+00
751de55b-b2f0-42ab-b512-0aff87e8bfd5	Sales & Marketing	sales-marketing	\N	Digital marketing, sales, and content strategy	trending-up	0	t	0	2026-02-14 03:30:31.747591+00
651deb34-3e0c-4b62-84ad-b8d3156b2578	Writing & Translation	writing-translation	\N	Copywriting, translation, and editing	pen-tool	0	t	0	2026-02-14 03:30:31.748646+00
358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	Admin & Customer Support	admin-customer-support	\N	Virtual assistance and customer service	headphones	0	t	0	2026-02-14 03:30:31.749636+00
c0f14cb2-53b4-4d13-9851-b1dadb03eb84	Finance & Accounting	finance-accounting	\N	Accounting, bookkeeping, and financial planning	dollar-sign	0	t	0	2026-02-14 03:30:31.750152+00
a2216ce1-d783-4236-a370-6efe87032aed	Engineering & Architecture	engineering-architecture	\N	CAD, civil engineering, and architecture	pen-tool	0	t	0	2026-02-14 03:30:31.75082+00
158c3eef-8f24-40ea-bf99-061c2510c933	Legal	legal	\N	Legal consulting and contract review	briefcase	0	t	0	2026-02-14 03:30:31.751257+00
\.


--
-- Data for Name: clientprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientprofile (user_id, company_name, company_website, company_size, industry, company_description, company_logo_url, total_jobs_posted, total_spent, avg_rating_given, total_hires, payment_verified, verification_level, created_at, updated_at) FROM stdin;
aa04c891-a753-48bb-a2c9-9f2a528d946b	\N	\N	\N	\N	\N	\N	0	0.00	0.00	0	f	none	2026-02-15 17:36:07+00	2026-02-15 17:36:07+00
\.


--
-- Data for Name: contract; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract (id, job_id, proposal_id, client_id, freelancer_id, title, description, contract_type, total_amount, hourly_rate, weekly_hour_limit, currency, status, platform_fee_percent, started_at, completed_at, cancelled_at, cancellation_reason, created_at, updated_at, total_hours_logged, total_time_amount) FROM stdin;
ec05a525-e734-41a0-b0c8-f7c8eeb7cd7b	1378b27c-8828-4fb9-a1af-671c9ec3e1b0	24c8aec8-626f-4ada-99ac-bd1f3e6f76fb	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	9a593055-1bd8-45d3-b276-113fa5dd1bc4	Opcache Test	<p>Im the best for the job and I have the skills for the best of the best</p>	fixed	2000.00	\N	\N	USD	cancelled	10.00	2026-02-17 16:21:26+00	\N	\N	\N	2026-02-17 16:21:26+00	2026-02-17 16:22:07+00	0	0.00
0401759e-8e35-4847-b9f4-76cff38ed563	ef3885ce-9673-47cb-ba68-1880562adc56	04e904f9-6395-45b4-8182-e8d91907a44e	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	9a593055-1bd8-45d3-b276-113fa5dd1bc4	Senior Lead Software Engineer	<p>Im the best candidate for this job if you compare price and my skills</p>	hourly	70.00	70.00	40	USD	active	10.00	2026-02-18 22:22:41+00	\N	\N	\N	2026-02-18 22:22:41+00	2026-02-18 22:22:41+00	0	0.00
ce4378ee-03b1-4675-b2f7-e63e673cd8c4	1378b27c-8828-4fb9-a1af-671c9ec3e1b0	24c8aec8-626f-4ada-99ac-bd1f3e6f76fb	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	9a593055-1bd8-45d3-b276-113fa5dd1bc4	Opcache Test	<p>Im the best for the job and I have the skills for the best of the best</p>	fixed	2000.00	\N	\N	USD	completed	10.00	2026-02-17 16:21:26+00	2026-02-21 17:16:07+00	\N	\N	2026-02-17 16:21:26+00	2026-02-21 17:16:07+00	0	0.00
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation (id, contract_id, title, last_message_at, created_at, updated_at) FROM stdin;
5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	\N	Re: Senior Fullstack Software Engineer	2026-02-18 22:13:59+00	2026-02-16 21:09:19+00	2026-02-18 22:13:59+00
80198d9c-ba85-468a-ba21-3557b6a7ec49	\N	Re: Senior Lead Software Engineer	2026-02-18 22:21:05+00	2026-02-18 22:21:05+00	2026-02-18 22:21:05+00
d9eaeb21-e9bf-4292-8570-5b5355a86077	\N	Re: Senior Lead Software Engineer	2026-02-18 22:22:41+00	2026-02-18 22:22:41+00	2026-02-18 22:22:41+00
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_participants (conversation_id, user_id, unread_count, last_read_at, joined_at) FROM stdin;
5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	0	2026-02-18 22:13:59+00	2026-02-16 21:09:19+00
80198d9c-ba85-468a-ba21-3557b6a7ec49	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	0	\N	2026-02-18 22:21:05+00
d9eaeb21-e9bf-4292-8570-5b5355a86077	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	0	\N	2026-02-18 22:22:41+00
d9eaeb21-e9bf-4292-8570-5b5355a86077	9a593055-1bd8-45d3-b276-113fa5dd1bc4	0	2026-02-23 02:00:57+00	2026-02-18 22:22:41+00
80198d9c-ba85-468a-ba21-3557b6a7ec49	9a593055-1bd8-45d3-b276-113fa5dd1bc4	0	2026-02-23 02:00:59+00	2026-02-18 22:21:05+00
5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	9a593055-1bd8-45d3-b276-113fa5dd1bc4	0	2026-02-23 02:01:00+00	2026-02-16 22:08:28+00
\.


--
-- Data for Name: deliverable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deliverable (id, milestone_id, file_url, file_name, file_size, mime_type, notes, version, created_at) FROM stdin;
\.


--
-- Data for Name: deliverables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deliverables (id, milestone_id, file_url, file_name, file_size, mime_type, notes, version, created_at) FROM stdin;
7f573cbb-8559-4e79-a57f-618a73456845	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	/files/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/Screenshot 2026-02-22 at 7.05.24 PM (2).png	Screenshot 2026-02-22 at 7.05.24 PM (2).png	786641	image/png	new milestone complete	1	2026-02-23 02:15:49+00
5fc50007-9c0b-4ba3-b049-9812bd3670a6	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/63a99296e8dd13c79aebe3932009189b.png	Screenshot 2026-02-22 at 7.05.24 PM.png	2773004	image/png	aa	1	2026-02-23 02:20:59+00
2caefea9-9694-4e83-b3e7-92f3f66d4f02	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	/files/attachments/milestone/c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2/20dbc51180d3693778595321c73e6aac.png	Screenshot 2026-02-22 at 7.05.24 PM (2).png	786641	image/png	This is a new milestone complete	1	2026-02-23 02:43:59+00
\.


--
-- Data for Name: dispute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dispute (id, contract_id, milestone_id, raised_by_id, reason, description, evidence_urls, status, resolution_amount, resolution_notes, resolved_by_id, resolved_at, created_at, updated_at, response_deadline, awaiting_response_from_id) FROM stdin;
\.


--
-- Data for Name: disputemessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.disputemessage (id, dispute_id, sender_id, content, attachments, is_internal, created_at) FROM stdin;
\.


--
-- Data for Name: email_preference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_preference (user_id, account_emails, contract_emails, proposal_emails, message_digest, review_emails, payment_emails, job_recommendations, marketing_emails, updated_at) FROM stdin;
\.


--
-- Data for Name: escrowtransaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.escrowtransaction (id, contract_id, milestone_id, type, amount, currency, status, gateway_reference, gateway_metadata, processed_at, created_at) FROM stdin;
deb11059-201b-410e-a15d-3a8856a8e829	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	fund	1000.00	USD	completed	pi_3T3JjZB6hBd009cx181Yd86r	\N	2026-02-21 17:12:49+00	2026-02-21 17:12:49+00
0754295c-27c3-4e57-9ff2-b84540263aab	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	client_fee	50.00	USD	completed	pi_3T3JjZB6hBd009cx181Yd86r	\N	2026-02-21 17:12:49+00	2026-02-21 17:12:49+00
eba961fa-ddc8-4ec5-8858-49aed147d5a1	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	e279625b-d6b4-4d95-b57b-ce4f7cfa006e	fund	1000.00	USD	completed	pi_3T3JtIB6hBd009cx0HH21qPk	\N	2026-02-21 17:22:52+00	2026-02-21 17:22:52+00
cb30e3ba-d624-4e7e-8104-58aff2c3a226	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	e279625b-d6b4-4d95-b57b-ce4f7cfa006e	client_fee	50.00	USD	completed	pi_3T3JtIB6hBd009cx0HH21qPk	\N	2026-02-21 17:22:52+00	2026-02-21 17:22:52+00
\.


--
-- Data for Name: featureflag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.featureflag (id, key, description, enabled, rollout_percent, rules, payload, created_at, updated_at) FROM stdin;
52c19218-60b5-4bf4-a13d-93878b6ddbff	fraud_detection_enabled	Enable sync fraud check on proposal submit	t	0	\N	{"mode": "shadow"}	2026-02-15 03:42:15.456515+00	2026-02-15 03:42:15.456515+00
3d76dc83-a904-4687-826b-56d45e0ba1b6	fraud_enforcement_mode	Fraud enforcement mode: shadow | soft_block | enforce	t	0	\N	{"mode": "shadow"}	2026-02-15 03:42:15.460565+00	2026-02-15 03:42:15.460565+00
3ec8ba51-31ea-430e-993c-6447b83b2f4b	auto_verification_enabled	Enable automatic verification processing	t	0	\N	{}	2026-02-15 03:42:15.462138+00	2026-02-15 03:42:15.462138+00
e43ebe25-b173-4683-91ff-09b30453c63c	ai_match_enabled	Enable AI matching engine	t	0	\N	{}	2026-02-15 03:42:15.46286+00	2026-02-15 03:42:15.46286+00
73d3d0eb-6246-452d-b3a9-74c5062e86de	ai_scope_enabled	Enable AI scope assistant	t	0	\N	{}	2026-02-15 03:42:15.463209+00	2026-02-15 03:42:15.463209+00
\.


--
-- Data for Name: freelancer_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.freelancer_skills (freelancer_id, skill_id, years_experience, proficiency) FROM stdin;
9a593055-1bd8-45d3-b276-113fa5dd1bc4	4be233b8-5697-42a0-a076-dc276288b188	18	expert
9a593055-1bd8-45d3-b276-113fa5dd1bc4	98f4522e-5881-4337-b990-5bade501833a	12	expert
9a593055-1bd8-45d3-b276-113fa5dd1bc4	6bfa677a-902f-46e4-988a-7420eeb5bbb2	4	expert
9a593055-1bd8-45d3-b276-113fa5dd1bc4	a0c63990-d9e9-4ca1-a3b0-3b0d61fe6dca	6	expert
9a593055-1bd8-45d3-b276-113fa5dd1bc4	94ebaf02-2770-43f5-b57f-e53749b8324f	4	expert
9a593055-1bd8-45d3-b276-113fa5dd1bc4	1fde1365-5b40-4672-89df-bc7cb58db3d5	6	advanced
\.


--
-- Data for Name: freelancerprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.freelancerprofile (user_id, headline, bio, hourly_rate, currency, experience_years, education, certifications, portfolio_urls, website_url, github_url, linkedin_url, verification_level, availability_status, availability_hours_week, response_rate, avg_rating, total_reviews, total_jobs_completed, total_earnings, total_hours_logged, success_rate, profile_completeness, profile_embedding, featured, created_at, updated_at, profile_visibility) FROM stdin;
9a593055-1bd8-45d3-b276-113fa5dd1bc4	Full-stack engineer & founder of MonkeysLegion (PHP framework). 	I’m a software engineer, product builder, and community catalyst with 18 years delivering high-impact solutions for Fortune 500 clients and high-growth startups alike.\n\nWhat I’m building now\n\t•\tMonkeysCloud — Founder & CTO\nA launch-ready SaaS that unifies project management, Git workflows, and DevOps/hosting. Backed by $300 k in Google Cloud credits, we streamline the entire lifecycle—from planning tickets to one-click production deploys.\n\t•\tMonkeysLegion — Creator & Lead Maintainer\nA full-stack PHP framework + CLI that lets teams scaffold and ship apps at light speed. Open-source by design; we’re growing a contributor community and shipping new modules (AI-powered CMS, Git automation) on a public roadmap.\n\nCareer highlights\n\t•\tLed cross-functional teams on enterprise portals, e-commerce, and data platforms for Fortune 500 companies—cutting release times by up to 40 %.\n\t•\tArchitected cloud-native infrastructures (GCP, AWS, Terraform) that scaled to millions of users with zero-downtime deployments.\n\t•\tMentored dozens of engineers, fostering a culture of code quality, knowledge sharing, and experimentation.\n\nWhy I build\n\nInnovation fuels me. Outside of code you’ll find me:\n\t•\tPrototyping hardware/software mash-ups for everyday hassles.\n\t•\tReading on design thinking, leadership, and emerging tech.\n\t•\tEncouraging peers to unlock their potential—because great products start with empowered people.\n\nLet’s connect if you’re passionate about shipping elegant software, open-source collaboration, or the future of DevOps-driven product development.	75.00	USD	20	[{"year": "2004", "degree": "Bachelor", "institution": "ULACIT"}]	[]	[{"url": "https://monkeyscms.com/", "title": "MonkeysCMS", "description": "new cms"}, {"url": "https://monkeyslegion.com/", "title": "MonkeysLegion", "description": "New PHP Framework"}]	https://monkeyscms.com/	https://github.com/yorchperaza	https://www.linkedin.com/in/jorgeperaza/	none	available	40	0.00	0.00	0	0	0.00	0.00	0.00	100	\N	f	2026-02-15 18:20:34+00	2026-02-20 18:29:43+00	public
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invitation (id, job_id, client_id, freelancer_id, message, status, responded_at, created_at) FROM stdin;
\.


--
-- Data for Name: invoice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice (id, contract_id, invoice_number, subtotal, platform_fee, tax_amount, total, currency, status, issued_at, due_at, paid_at, notes, created_at, updated_at) FROM stdin;
11702f45-f50a-4207-a341-03fca8bbd7da	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	INV-11702F45	1000.00	50.00	0.00	1050.00	USD	paid	2026-02-21 17:12:49+00	2026-02-21 17:12:49+00	\N	Milestone escrow: Milestone Freelancer	2026-02-21 17:12:49+00	2026-02-21 17:12:49+00
84d0a43b-ff57-49e2-9600-1ed3f197103e	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	INV-84D0A43B	1000.00	50.00	0.00	1050.00	USD	paid	2026-02-21 17:22:52+00	2026-02-21 17:22:52+00	\N	Milestone escrow: Milestone Freelancer 2	2026-02-21 17:22:52+00	2026-02-21 17:22:52+00
\.


--
-- Data for Name: invoiceline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoiceline (id, invoice_id, description, quantity, unit_price, amount, milestone_id, sort_order, created_at, time_entry_id, timesheet_id) FROM stdin;
\.


--
-- Data for Name: job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job (id, client_id, title, slug, description, description_html, category_id, budget_type, budget_min, budget_max, currency, status, visibility, experience_level, estimated_duration, location_requirement, timezone_preference, proposals_count, views_count, job_embedding, ai_scope, ai_scope_model_version, ai_scope_confidence, search_vector, published_at, closed_at, expires_at, created_at, updated_at, moderation_status, moderation_ai_result, moderation_ai_confidence, moderation_ai_model_version, moderation_reviewer_notes, moderation_reviewed_at, location_type, location_regions, location_countries, milestones_suggested, moderation_reviewed_by_id, weekly_hours_limit) FROM stdin;
e77e6109-d574-4383-8bc0-bc545f82e0cb	\N	New Job Post 1	new-job-post-1-e77e6109	This is a new example of job post	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	50.00	100.00	USD	draft	public	expert	4	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-14 04:06:03+00	2026-02-14 04:06:03+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
31075500-3eae-4cc1-a508-7310cc4f9e42	\N	New Job Post 1	new-job-post-1-31075500	This is a new example of job post	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	50.00	100.00	USD	draft	public	expert	4	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-14 04:06:03+00	2026-02-14 04:06:03+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
b2779bb4-a562-4a2a-b068-56d653fcd2d7	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-b2779bb4	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	open	public	expert	60	remote	\N	1	0	\N	{}	\N	\N	\N	2026-02-16 02:17:05+00	\N	\N	2026-02-16 02:13:54+00	2026-02-16 03:07:15+00	auto_approved	{"flags": [], "model": "simulated-dev-v1.0", "confidence": 1, "quality_score": 1.1}	1.00	simulated-dev-v1.0	\N	\N	regions	["latin_america", "north_america"]	[]	[]	\N	\N
7625f922-2b69-4712-bcf0-7db31eb79327	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Fixed Price Job Test	fixed-price-job-test-7625f922	<p>This is a test job for fixed price milestone verification.</p>	\N	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	fixed	500.00	1000.00	USD	draft	public	intermediate	\N	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-17 01:40:10+00	2026-02-17 01:40:10+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
7285fed3-5f58-4844-8bc1-17e2f26128b0	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Test Job 2	test-job-2-7285fed3	this is a new job hjkajk	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	50.00	100.00	USD	cancelled	public	expert	4	remote	\N	0	0	\N	{}	\N	\N	\N	2026-02-14 04:39:08+00	2026-02-16 02:40:33+00	\N	2026-02-14 04:35:49+00	2026-02-16 02:40:33+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
dd2eddcb-ff6e-45a6-8baa-354194940d5f	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Test new Job	test-new-job-dd2eddcb	hjvkcqe hfvhiqoevh uqhvfwqhvhuqwihvui	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	50.00	100.00	USD	cancelled	public	expert	4	remote	\N	0	0	\N	{}	\N	\N	\N	2026-02-14 04:15:44+00	2026-02-16 02:40:44+00	\N	2026-02-14 04:15:35+00	2026-02-16 02:40:44+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
a1a0b16b-dfc1-4c56-815e-843e4d0e7699	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Debug Test 3	debug-test-3-a1a0b16b	<p>This is a debug test description that is at least twenty characters long.</p>	\N	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	fixed	1000.00	5000.00	USD	draft	public	intermediate	\N	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-17 02:39:55+00	2026-02-17 02:39:55+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
07bf9891-5ffb-435d-bd01-0138174b9fe8	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Test Fixed Price Job	test-fixed-price-job-07bf9891	<p>Test description for fixed price job</p>	\N	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	fixed	2000.00	3000.00	USD	open	public	intermediate	4	remote	\N	0	0	\N	{}	\N	\N	\N	2026-02-17 02:08:30+00	\N	\N	2026-02-17 02:06:42+00	2026-02-17 02:08:30+00	approved	{"flags": [], "model": "simulated-dev-v1.0", "confidence": 0.76, "quality_score": 0.8}	0.76	simulated-dev-v1.0	Approved!	2026-02-17 02:08:30+00	regions	["north_america"]	[]	[]	\N	\N
1e4e1739-17db-44ae-abad-ec1a3590a841	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-1e4e1739	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:10:10+00	2026-02-16 02:10:10+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
d9f42bc1-002d-49c8-bac8-00e8eb1b67ba	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-d9f42bc1	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:10:10+00	2026-02-16 02:10:10+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
4f17f86e-c295-4d62-9206-ad4b48c1c455	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-4f17f86e	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:12:37+00	2026-02-16 02:12:37+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
af06c286-6832-40cf-851c-4428bd36f68a	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-af06c286	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:12:37+00	2026-02-16 02:12:37+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
cb82666f-869e-45ca-b972-049a64375431	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-cb82666f	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:12:47+00	2026-02-16 02:12:47+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
2c4cb391-23e4-495f-8c2b-8e80f8e5a8c3	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Fullstack Software Engineer	senior-fullstack-software-engineer-2c4cb391	<p>Hi, we’re Conveyor 👋, creators of the #1 Customer Trust AI automation platform.<br><br>We solve problems that our customers “hate with the fury of 1000 suns” (actual quote!) - the dreaded customer security review and RFP processes. These are key parts of the B2B sales cycle, but both still involve too much time, effort, and mental anguish from those involved.<br><br>Enter Conveyor, where our mission is to eliminate all of the misery from B2B customer trust with maximum automation. We’ve made a lot of progress – we have an awesome customer list whose lives we’ve<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fcustomers-3%2Flucid-software-spends-91-less-time-on-security-questionnaires-with-conveyor&amp;urlhash=57ZF&amp;isSdui=true"> significantly impacted through product</a>, this year we launched the <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DorK0xeZj03c&amp;urlhash=myxD&amp;isSdui=true">first AI agents for security reviews (Sue)</a> and <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Eyoutube%2Ecom%2Fwatch%3Fv%3DkQ4JBTioi0k&amp;urlhash=MU6j&amp;isSdui=true">RFPs (Phil)</a>, and we <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">just raised a $20M Series B</a> from SignalFire and OVF! (<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Ftechcrunch%2Ecom%2F2025%2F06%2F12%2Fconveyor-uses-ai-to-automate-the-painful-process-of-vendor-security-reviews-and-rfps-with-ai%2F&amp;urlhash=J6RG&amp;isSdui=true">TechCrunch</a>) But we have ambitious goals and we’re looking for our next Senior Software Engineer to help make them a reality!<br><br><strong>The top 3 1/2 reasons you should be interested in working at Conveyor:<br><br></strong></p><ul><li><p>You’ll be selling a great product with a slam dunk AI use case while building sales processes and foundations to help scale the business. </p></li><li><p>Everyone on the team is amazing at their jobs. We care deeply about<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fhbr%2Eorg%2Fpodcast%2F2019%2F01%2Fcreating-psychological-safety-in-the-workplace&amp;urlhash=GQ5L&amp;isSdui=true"> psychological safety</a>, and believe that the ability to take risks and exist in the<a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Faccelerate%2Euofuhealth%2Eutah%2Eedu%2Fimprovement%2Fpsychological-safety-for-teams&amp;urlhash=-1lr&amp;isSdui=true"> learning zone</a> is critical to our success. This also comes with high accountability, which isn’t for everyone. But, you have the potential to have an outsize impact on the direction and success of the company. </p></li><li><p>We’re highly transparent and collaborative. Giving constructive, thoughtful feedback and asking hard questions are highly encouraged! We come together to figure it out when times are hard, and in celebration when we get our wins. 1/2. Plus, we’ll even teach you how to <a target="_blank" rel="noopener noreferrer nofollow" class="f86e0b95 a0cb46a8" href="https://www.linkedin.com/redir/redirect/?url=https%3A%2F%2Fwww%2Econveyor%2Ecom%2Fseries-b&amp;urlhash=mD6x&amp;isSdui=true">saber a bottle of champagne<br><br></a></p></li></ul><p><strong>About The Role<br><br></strong>As one of the first engineers on the team, this is a unique opportunity to shape Conveyor’s platform, and have a huge impact on our success. Designing and building innovative new capabilities for our AI-powered products, you will have the opportunity to collaborate closely with a great team, as well tackle challenging engineering problems on your own.<br><br><strong>What You’ll Do<br><br></strong></p><ul><li><p>You will design, implement and maintain new features and capabilities for Conveyor’s SaaS platform and AI-powered products, taking full ownership across the stack (backend, frontend and AI). </p></li><li><p>You'll autonomously manage and own individual project priorities, deadlines, and deliverables. </p></li><li><p>You’ll collaborate and pair frequently with teammates and peers. </p></li><li><p>You'll inform the product roadmap and implementation decisions based on feasibility. </p></li><li><p>You'll ensure that our product is maintainable, meaning that other engineers are able to contribute new functionality easily, and without frequent technical debt. </p></li><li><p>You'll partner with Product and Design to effectively plan new features, avoiding bottlenecks and maximizing velocity when it comes time to implement. </p></li><li><p>Provide constructive feedback through design and code reviews, and mentor to new or junior team members<br><br></p></li></ul><p><strong>What We’re Looking For<br><br></strong>We are looking for candidates with 5-8 years of experience as a Fullstack Software Engineer, with a focus on B2B SaaS solutions, and experience in startup environments.<br><br></p><ul><li><p>6-10 years of experience as a Software Engineer, with strong foundations on building and shipping products. Your designs should be performant, maintainable (for years, not months), and evolvable. </p></li><li><p>Experience building and scaling web applications with real users, familiarity with SaaS architecture concepts, Cloud infrastructure and services (AWS preferred), popular databases, authentication services, etc. </p></li><li><p>Specifically, rich experience working across the stack: Ruby on Rails, Python, React, RESTful APIs, PostgreSQL, AWS</p></li><li><p>Bias for action: Startup mentality, get things done, fast iterations, scope and implement project-level solutions with minimal guidance, strong problem-solving and decision-making capabilities. Previous experience in a small startup (or as a founder) is highly preferred. </p></li><li><p>Curiosity and Continuous Learning: You are up to speed on developments in fullstack technologies and patterns, and constantly thinking about how to apply new technologies and offerings to our platform. </p></li><li><p>Desire to Improve: You seek to understand why things are the way they are, and think about ways to make them better. </p></li><li><p>Product Sense: You seek to understand the features you're working on, and actively propose positive changes. Collaborate with product and design to inform roadmap decisions. </p></li><li><p>Team Player: You have excellent communication skills (verbal and written), enjoy collaborating with others and mentoring team members. </p></li><li><p>Deliver Legendary Customer Experience: You have experience building and scaling products that delight real users. </p></li><li><p>Ownership: Strong sense of ownership and accountability, honor commitments and be transparent about challenges. <br><br></p></li></ul><p><strong>Job Location<br><br></strong>This position is available in the United States and Canada.<br><br>We are a remote-first company so you’ll be working from home most of the time, traveling for in person sessions a few times a year.<br><br>The estimated total compensation for this role is $180,000 - $220,000 per year.<br><br>Ready to join our team and have a tremendous impact? We’d love to hear from you. Also, we know it’s tough, but please try to avoid the confidence gap . You don’t have to match all the listed requirements exactly to be considered for this role.</p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	draft	public	expert	60	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-16 02:12:47+00	2026-02-16 02:12:47+00	none	\N	\N	\N	\N	\N	worldwide	[]	[]	[]	\N	\N
0e9efea6-385a-4f0a-864f-c0df362e455b	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Milestone Debug Job	milestone-debug-job-0e9efea6	<p>Testing milestone saving</p>	\N	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	fixed	2000.00	5000.00	USD	pending_review	public	intermediate	\N	remote	\N	0	0	\N	{}	\N	\N	\N	\N	\N	\N	2026-02-17 02:32:18+00	2026-02-17 02:32:40+00	human_review	{"flags": ["description_too_short"], "model": "simulated-dev-v1.0", "confidence": 0.48, "quality_score": 0.5}	0.48	simulated-dev-v1.0	\N	\N	worldwide	[]	[]	[]	\N	\N
ef3885ce-9673-47cb-ba68-1880562adc56	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Senior Lead Software Engineer	senior-lead-software-engineer-ef3885ce	<p><strong>Description<br><br></strong>The Senior Lead Software Engineer is responsible for generating creative solutions to address highly complex and critical issues to current applications and/or to create new solutions that address clients’ needs. The Senior Lead Software Engineer is key team player who will take ownership of issues and problems and see them through to a successful resolution exercising judgement with little direction or guidance.<br><br><strong>Responsibilities<br><br></strong></p><ul><li><p>Participate in technical design of new applications and existing system enhancements.</p></li><li><p>Provide high-level analysis and design to address and create well-integrated application systems.</p></li><li><p>Create clear and concise program specifications that will enable Software Engineers to code the program with minimal additional guidance.</p></li><li><p>Develop highly complex and critical new application solutions and enhance existing solutions by coding system features according to system designs.</p></li><li><p>Lead team to meet the goals of assigned projects (e.g. best practice initiatives, developing a new solution to address a never before seen client request, etc.). </p></li><li><p>This involves providing technical project leadership for highly complex solutions; driving technical direction in partnership with architects, senior leadership, etc.</p></li><li><p>Provide guidance and direction to less experienced staff to ensure bugs to existing applications are fixed and/or to clear up operational deficiencies in both previously released software and software slated for future release.</p></li><li><p>Assure program, module and system integrity through thorough testing and adherence to company standards and procedures.</p></li><li><p>Lead phases of the software development life cycle, including research, design, analysis, requirements, implementation, test automation, and maintenance.</p></li><li><p>Utilize new technologies and tools to modify products and provide integration with applications developed internally and externally.</p></li><li><p>Prepare and modify program and system documentation.</p></li><li><p>Provide guidance to less experienced team members to ensure knowledge transfer and training are successfully meeting department goals.</p></li><li><p>Demonstrate the willingness to take any project and successfully implement it with little or no help from more senior resources.</p></li><li><p>Demonstrate a high degree of skill, efficiency and be a leader to less experienced development staff.</p></li><li><p>Develop programs that are highly complex in nature, adhering to established departmental standards.</p></li><li><p>Learn and implement new technologies and architectures within a reasonably quick timeframe while producing and testing high quality software.</p></li><li><p>Demonstrate expert knowledge of software development practices, concepts, and technologies obtained through formal training and work experience.</p></li><li><p>Demonstrate expert knowledge of required programming languages.</p></li><li><p>Demonstrate expert knowledge of the technical/business environment.</p></li><li><p>Effectively partner, communicate, and negotiate with business analyst, development and support groups in order to gather and communicate business requirements.</p></li><li><p>Work on individual programs that are part of a much larger application.</p></li><li><p>Adapt to changing products and technologies.</p></li><li><p>Fix bugs in existing, often unfamiliar programs, under considerable time constraints.</p></li><li><p>Manage and prioritize often conflicting tasks and interruptions so as to minimize their impact on the current deadlines and workload. <br><br></p></li></ul><p><strong>Qualifications<br><br></strong></p><ul><li><p>Bachelor’s degree in computer science, computer engineering, or comparable work experience.</p></li><li><p>Typically ten or more years of software development experience with database technology.</p></li><li><p>Demonstrated expert knowledge of software development practices, computer science theory, and understanding of relevant technologies.</p></li><li><p>Relevant Technologies: PHP Native JavaScript / NodeJS AWS MySQL Java / Kotlin Obj C / Swift Docker Apache Server OpenAPI Harness</p></li></ul><p></p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	hourly	60.00	80.00	USD	open	public	expert	20	remote	\N	1	2	\N	{}	\N	\N	\N	2026-02-18 22:15:49+00	\N	\N	2026-02-18 22:15:38+00	2026-02-18 22:15:49+00	auto_approved	{"flags": [], "model": "simulated-dev-v1.0", "confidence": 1, "quality_score": 1.1}	1.00	simulated-dev-v1.0	\N	\N	regions	["north_america", "latin_america"]	[]	[]	\N	40
1378b27c-8828-4fb9-a1af-671c9ec3e1b0	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Opcache Test	opcache-test-1378b27c	<p>Testing opcache reload with milestones</p>	\N	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	fixed	1000.00	5000.00	USD	open	public	intermediate	\N	remote	\N	1	2	\N	{}	\N	\N	\N	2026-02-17 02:45:08+00	\N	\N	2026-02-17 02:42:57+00	2026-02-17 02:45:08+00	approved	{"flags": [], "model": "simulated-dev-v1.0", "confidence": 0.74, "quality_score": 0.8}	0.74	simulated-dev-v1.0		2026-02-17 02:45:08+00	worldwide	[]	[]	[{"title": "Test MS", "amount": 999}]	\N	\N
6f03333a-5d31-43ef-bdb0-caa954b4ab08	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Test Fixed Price Job 2	test-fixed-price-job-2-6f03333a	<h2><strong>About the job</strong></h2><p><strong>Company Description<br><br></strong>Givebutter is the most-loved nonprofit fundraising and CRM platform, empowering millions of changemakers to raise more, pay less, and give better. Nonprofits use Givebutter to replace multiple tools so they can launch fundraisers and events, use donation forms and donor management (CRM), send emails and text blasts—all in one place. Use of the Givebutter platform is completely free with a 100% transparent tip-or-fee model.<br><br>Givebutter has been certified as a Great Place to Work® every year since 2021, and is the #1 rated nonprofit software company on G2 across multiple categories.<br><br>Our mission is to empower the changemaker in all of us. We believe giving should be fun, so you’ll want to do it again, and we also believe that work should be fun, so that you’ll have the greatest impact. We are excited to hear from talented people who want to work with other talented people in making the world a butter place—and have fun along the way.<br><br><strong>Role Description<br><br></strong>Givebutter is seeking experienced Senior Software Engineers to join our growing engineering team and build the tools that empower mission-driven organizations to raise more effortlessly. Whether you lean frontend, backend, or love working across the full stack, we want to hear from you!<br><br><strong>The CRM &amp; Engage team</strong> manages donor data and nonprofit communications. Build features for organizing contacts, importing data, connecting to other platforms, and sending messages via email, SMS, and direct mail. Help nonprofits manage millions of supporter relationships and send hundreds of millions of messages each year.<br><br><strong>The Growth team</strong> improves key metrics across the entire product-led growth journey. Build features for acquisition (marketing site, signup), activation (onboarding, integrations), and revenue (pricing, payment flows). Ship experiments that directly impact hundreds of thousands of users.<br><br><strong>The Core Fundraising team</strong> focuses on the core fundraising products that power giving. Build campaigns, donation forms, events, auctions, memberships, peer-to-peer fundraising, websites, and embeddable widgets. Build the products that power billions of dollars raised for causes around the world.<br><br><strong>The Events &amp; Auctions team</strong> builds event-based fundraising experiences. Build auction management tools, ticketing systems, check-in flows, bidding features, and the Givebutter mobile app. Create experiences used by thousands of nonprofits hosting galas, auctions, and fundraising events every year.<br><br><strong>The Treasury team</strong> helps nonprofits put their funds to work faster. Build Givebutter Wallet features, same-day ACH transfer tools, QuickBooks integration, card issuing systems, and financial dashboards. Help nonprofits earn rewards on their funds and move money faster with modern financial infrastructure.<br><br><strong>The Platform team</strong> focuses on infrastructure, reliability, and quality. Build CI/CD pipelines, monitoring systems, and frameworks that enable other teams to ship features efficiently and reliably. Enable the entire engineering organization to ship features reliably and efficiently at scale.<br><br><strong>The Payments and Trust &amp; Safety team</strong> keeps money moving safely and reliably. This team builds the underlying integrations with our payment and anti-fraud providers while also ensuring money movement is safe and reliable. We partner with Platform, Treasury, Support, and Accounting to make sure our payment systems are ready to scale.<br><br><strong>Why join the Givebutter Engineering team?<br><br></strong></p><ul><li><p>Democracy of code – We value equal contributions from all engineers and foster an environment of open discussion on architecture and ideas.</p></li><li><p>Autonomy in work – We keep meetings to a minimum. Engineers have the freedom to manage their own calendars and block out uninterrupted time for focused work.</p></li><li><p>Automated CI/CD – Our build and deployment processes are fully automated and hands-off, allowing engineers to focus on problem-solving through code.</p></li><li><p>Mission-driven, full stop – You’ll be working with inspiring nonprofits, charities, and organizations that are making a positive impact around the world.</p></li></ul><p><strong>What You’ll Do </strong></p><ul><li><p>Design and implement full stack features using PHP/Laravel, React, and TypeScript across our fundraising, donor management, financial, and growth products.</p></li><li><p>Build systems and interfaces that scale to handle millions of users, high-volume transactions, and seasonal traffic spikes.</p></li><li><p>Work with APIs, third-party integrations, and payment systems to create seamless experiences for nonprofits.</p></li><li><p>Collaborate closely with product, design, and engineering peers to shape user-friendly, impactful solutions.</p></li><li><p>Participate in code reviews and help evolve engineering standards and best practices.</p></li><li><p>Contribute to technical initiatives across the engineering org, including experimentation frameworks and tooling.</p></li><li><p>Be part of our support rotation during business hours to help triage and resolve production issues.</p></li></ul><p><strong>Requirements </strong>Requirements will vary for each role and team, but these are some of the things we look for:<br><br></p><ul><li><p>5+ years of experience in software development, ideally with full-stack exposure and backend depth.</p></li><li><p>Proficiency in PHP/Laravel or a similar backend framework.</p></li><li><p>Experience building frontend interfaces using React, TypeScript, and modern JavaScript (ES6+).</p></li><li><p>Strong understanding of relational databases like MySQL or PostgreSQL, including query optimization.</p></li><li><p>Experience with RESTful APIs, third-party integrations, and data import/export flows.</p></li><li><p>Familiarity with state management (TanStack Query, SWR, Zustand, Redux, etc.).</p></li><li><p>Understanding of frontend architecture, component design, and build tools (Vite, Webpack).</p></li><li><p>Strong debugging and performance tuning skills across the stack.</p></li><li><p>Excellent collaboration, communication, and documentation habits.</p></li></ul><p><strong>Nice to Have </strong></p><ul><li><p>Experience with payment systems, financial APIs, or building fintech products.</p></li><li><p>Familiarity with experimentation platforms (PostHog, Optimizely, LaunchDarkly) or A/B testing.</p></li><li><p>Experience with accessibility (a11y) and WCAG compliance.</p></li><li><p>Background in testing frameworks (Vitest, Jest, Playwright) and test-driven development.</p></li><li><p>Familiarity with monorepo tools like Turborepo, Nx, or Lerna.</p></li><li><p>Knowledge of background jobs, message queues, and asynchronous processing.</p></li><li><p>Experience with high-volume data, analytics platforms, or data pipelines.</p></li><li><p>Passion for working with nonprofits or other mission-driven organizations.</p></li></ul><p><strong>Benefits More about Givebutter </strong></p><ul><li><p>Remote Work: Work remotely from one of our 10 hubs (Austin, Denver, Indianapolis, Los Angeles, San Francisco, New York, Salt Lake City, Minneapolis, Seattle, and Nashville).</p></li><li><p>Health Insurance: We offer Medical, Dental, and Vision insurance covered 100% for employees as well as HSA and FSA accounts.</p></li><li><p>Dependent Care Coverage: We offer coverage for dependents, with 50% of Medical, Dental, and Vision premiums covered for all eligible dependents.</p></li><li><p>Mental Health: Givebutter health insurance plans come with access to a TalkSpace membership.</p></li><li><p>401k: We offer a 3% 401k match for all eligible employee's.</p></li><li><p>Vacation and Holidays: Givebutter offers a Flexible PTO policy with uncapped vacation days and company-recognized holidays.</p></li><li><p>Wellness Week: Givebutter closes for one week each summer to prioritize rest and recharge for the entire team.</p></li><li><p>Parental Leave: We offer 12 weeks of paid leave for all parents and comprehensive leave planning management through Aidora.</p></li><li><p>Home Office Stipend: Upgrade your home office with company-sponsored expenses, including high-quality laptops, monitors, and modern technology.</p></li><li><p>Charitable Giving: Employees are encouraged to donate up to $50/month to any verified nonprofit they wish to support on Givebutter.</p></li><li><p>Professional Development: We offer learning and development reimbursement opportunities.</p></li><li><p>Love What You Do: We are a mission-driven company serving the charitable sector. Feel good about the work you're doing and the company you work for.</p></li></ul><p><strong>Interview Process </strong>Below is a high-level outline of our standard interview process<br><br></p><ul><li><p>Recruiter Screen: A 30-minute conversation to learn more about your background, walk through the role, and ensure mutual alignment on expectations, values, and logistics.</p></li><li><p>Hiring Manager Interview: A deeper dive into your relevant experience, skillset, and working style. This is your first opportunity to connect directly with the person who may be your future manager.</p></li><li><p>Assessment (technical or non-technical): This stage will vary based on the role. It could involve a live coding session, case study, or take-home project. Some roles may include two parts to this stage to evaluate both practical skills and problem-solving approaches</p></li><li><p>Values Interview: A conversation with team members focused on how you align with our core values and leadership principles.</p></li><li><p>References: We connect with a few folks you’ve worked closely with to get a better picture of your working style and impact.</p></li><li><p>Offer: If all goes well, we’ll move to the offer stage!</p></li></ul><p><em>Please note, we will have an AI note-taking tool join most of our interviews. Hi potential new butterslice! A recent study from LinkedIn showed that most women apply to jobs only when they meet 100% of the requirements, whereas men will hit the apply button if they hit 60%. Givebutter is committed to building a diverse and inclusive team. So to the women and nonbinary folks out there feeling unsure if you're a perfect fit, we strongly encourage you to apply! </em>Compensation Range: $170K - $190K</p><p></p>	\N	88115571-e2ba-40df-9bf2-b83184d7e5c6	fixed	2000.00	3000.00	USD	open	public	expert	4	remote	\N	0	12	\N	{}	\N	\N	\N	2026-02-17 02:26:29+00	\N	\N	2026-02-17 02:26:12+00	2026-02-17 02:26:29+00	auto_approved	{"flags": [], "model": "simulated-dev-v1.0", "confidence": 1, "quality_score": 1.05}	1.00	simulated-dev-v1.0	\N	\N	worldwide	[]	[]	[]	\N	\N
\.


--
-- Data for Name: job_moderation_conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_moderation_conversation (id, job_id, sender_type, sender_id, message, created_at) FROM stdin;
\.


--
-- Data for Name: job_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_skills (job_id, skill_id, is_required) FROM stdin;
ef3885ce-9673-47cb-ba68-1880562adc56	4be233b8-5697-42a0-a076-dc276288b188	t
ef3885ce-9673-47cb-ba68-1880562adc56	98f4522e-5881-4337-b990-5bade501833a	t
ef3885ce-9673-47cb-ba68-1880562adc56	7ea798c8-eba5-4815-830e-c69968fccfe0	t
\.


--
-- Data for Name: jobattachment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobattachment (id, job_id, file_url, file_name, file_size, mime_type, created_at) FROM stdin;
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message (id, conversation_id, sender_id, content, message_type, attachments, read_at, edited_at, deleted_at, created_at) FROM stdin;
29199b91-1591-4cea-a877-ef46d875d2b2	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	new message test	text	[{"url": "/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/d00d97c385d5a3a09a4de7783f38b576.png"}, {"url": "/files/attachments/proposal/71ca9c0c-58c1-4a54-9713-83e8fa16777f/ef729bb5e57a97b9ac0a742a1b9ab3f9.png"}]	2026-02-16 21:55:33+00	\N	\N	2026-02-16 21:09:19+00
032eed77-9992-4604-aac2-952528b81cbb	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	9a593055-1bd8-45d3-b276-113fa5dd1bc4	new message response	text	[]	2026-02-16 22:08:57+00	\N	\N	2026-02-16 22:08:28+00
0c04ce5d-33fb-4001-b2f0-b00ca05ab8bb	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	this is a response	text	[]	2026-02-17 00:12:06+00	\N	\N	2026-02-17 00:11:56+00
06dd3de9-83f1-434f-b6d9-e8bcffdc3af5	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	other response	text	[]	2026-02-17 00:33:36+00	\N	\N	2026-02-17 00:12:17+00
2aebbbff-cbcf-4181-a31a-790d23cd0880	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	9a593055-1bd8-45d3-b276-113fa5dd1bc4	new attachment	text	[]	2026-02-17 00:34:16+00	\N	\N	2026-02-17 00:33:51+00
a7b9a6a9-62dd-45a6-aa8d-68c32197d0ca	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	9a593055-1bd8-45d3-b276-113fa5dd1bc4	new attachment	text	[{"url": "/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/b80818401eb22b62ee99b0cddab9b00c.png"}, {"url": "/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/2037eded6e6a55a62ed0f64dda94099d.png"}]	2026-02-17 00:37:40+00	\N	\N	2026-02-17 00:37:29+00
98fe4e1a-4987-494f-8912-da637e11a276	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	9a593055-1bd8-45d3-b276-113fa5dd1bc4	hello message	text	[]	2026-02-18 20:35:54+00	\N	\N	2026-02-18 20:35:10+00
d47c36d3-98a3-42bd-b660-900deac9ac53	d9eaeb21-e9bf-4292-8570-5b5355a86077	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	Congratulations! I'm pleased to accept your proposal for this project. Let's discuss the next steps and get started. Looking forward to working with you!	text	[]	2026-02-23 02:00:57+00	\N	\N	2026-02-18 22:22:41+00
26fceb29-d02e-460b-8103-367413baeecd	80198d9c-ba85-468a-ba21-3557b6a7ec49	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	new message request info	text	[{"url": "/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/e7e39e7f7c84da425b3623c22a3e61f1.png"}, {"url": "/files/attachments/proposal/04e904f9-6395-45b4-8182-e8d91907a44e/c5c56ae038f6cbcc6893630c11d83a94.png"}]	2026-02-23 02:00:59+00	\N	\N	2026-02-18 22:21:05+00
d9bba044-14ee-406c-b171-5f497f6d7c05	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	test message	text	[]	2026-02-23 02:01:00+00	\N	\N	2026-02-18 22:10:54+00
fc07729f-282b-42d1-9d0a-1b1b665dd9b2	5d4c6f03-6f90-4cc2-be8d-b6983ba82d54	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	new message	text	[{"url": "/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/a21206218a1f455bed4f173ad5cf1b71.png"}, {"url": "/files/attachments/conversation_message/5d4c6f03-6f90-4cc2-be8d-b6983ba82d54/314b0ae236f132dd7cbaff82920cfc3d.png"}]	2026-02-23 02:01:00+00	\N	\N	2026-02-18 22:13:59+00
\.


--
-- Data for Name: milestone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.milestone (id, contract_id, title, description, amount, currency, status, sort_order, due_date, started_at, submitted_at, completed_at, revision_count, client_feedback, escrow_funded, escrow_released, created_at, updated_at, auto_accept_at) FROM stdin;
e279625b-d6b4-4d95-b57b-ce4f7cfa006e	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	Milestone Freelancer 2	Milestone Freelancer 2 description	1000.00	USD	revision_requested	2	\N	\N	2026-02-23 02:32:54+00	\N	1	\N	t	f	2026-02-17 16:29:29+00	2026-02-23 02:38:24+00	\N
c0ca7e8d-9ea6-4044-ae5b-9c14244a4ad2	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	Milestone Freelancer	New Milestone	1000.00	USD	submitted	1	\N	\N	2026-02-23 02:43:59+00	\N	2	\N	t	f	2026-02-17 16:29:29+00	2026-02-23 02:43:59+00	2026-03-09 02:43:59+00
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification (id, user_id, type, title, body, data, priority, read_at, channel, created_at) FROM stdin;
51e1787a-6035-4442-911d-c377655d83df	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Identity Verified	Your Identity verification has been approved with 98% confidence.	{"link": "/dashboard/settings/verification", "status": "approved", "confidence": 0.98, "verification_id": "e6f86100-26de-4a7d-92d5-ac7d2ca25512", "verification_type": "identity"}	success	2026-02-15 22:00:41+00	in_app	2026-02-15 20:56:45+00
a1dc72f1-d842-4e6e-98ac-e9379e8c7d1c	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.in_review	🔄 Portfolio Under Review	Your Portfolio verification is being reviewed by our team.	{"link": "/dashboard/settings/verification", "status": "in_review", "confidence": 0.8, "verification_id": "f52111b6-25c8-4bbb-a425-773b4d6a8054", "verification_type": "portfolio"}	info	2026-02-15 22:01:49+00	in_app	2026-02-15 20:56:45+00
80620bf1-dbf2-41bb-ba42-58a354b9d37c	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.in_review	🔄 Work History Under Review	Your Work History verification is being reviewed by our team.	{"link": "/dashboard/settings/verification", "status": "in_review", "confidence": 0.72, "verification_id": "e5c08451-af2a-4747-8360-5032fec56181", "verification_type": "work_history"}	info	2026-02-15 23:05:32+00	in_app	2026-02-15 20:56:45+00
d116a231-045e-4a4a-b743-b05245e845ee	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Payment Method Verified	Your Payment Method verification has been approved with 94% confidence.	{"link": "/dashboard/settings/verification", "status": "approved", "confidence": 0.94, "verification_id": "1e17d4c8-ba2d-496c-bcfa-b6a57119a58f", "verification_type": "payment_method"}	success	2026-02-15 23:17:12+00	in_app	2026-02-15 20:56:45+00
01f93162-6a59-44a7-87ce-90cc8b682bc9	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.info_requested	📋 Portfolio — More Info Needed	Our team needs more information about your Portfolio verification: we are need more info	{"link": "/dashboard/settings/verification", "status": "info_requested", "verification_id": "f52111b6-25c8-4bbb-a425-773b4d6a8054", "verification_type": "portfolio"}	info	2026-02-15 23:22:19+00	in_app	2026-02-15 23:21:58+00
003a215c-dd29-4fad-9563-fad188e1babf	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.info_requested	📋 Portfolio — More Info Needed	Our team needs more information about your Portfolio verification: Please provide more details about your portfolio items.	{"link": "/dashboard/settings/verification", "status": "info_requested", "verification_id": "f52111b6-25c8-4bbb-a425-773b4d6a8054", "verification_type": "portfolio"}	info	2026-02-15 23:22:38+00	in_app	2026-02-15 23:20:54+00
507d02a6-7c0c-43bf-b5b3-0eb6f1748dbe	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.in_review	🔄 Identity Under Review	Your Identity verification is being reviewed by our team.	{"link": "/dashboard/settings/verification", "status": "in_review", "confidence": 0.83, "verification_id": "b74b03ab-0aaf-4391-9e30-1ddaf019e0d5", "verification_type": "identity"}	info	2026-02-15 23:36:32+00	in_app	2026-02-15 23:30:44+00
76c7d625-0143-4a79-80b1-de7bbf5cfc4b	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Portfolio Verified	Your Portfolio verification has been approved with 90% confidence.	{"link": "/dashboard/settings/verification", "status": "approved", "confidence": 0.9, "verification_id": "ce14f995-1290-48e8-bd7a-3097603447b3", "verification_type": "portfolio"}	success	2026-02-15 23:36:38+00	in_app	2026-02-15 23:30:44+00
4deefa08-b53a-4e22-b6dc-86ec63deab96	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.in_review	🔄 Work History Under Review	Your Work History verification is being reviewed by our team.	{"link": "/dashboard/settings/verification", "status": "in_review", "confidence": 0.77, "verification_id": "feb7b3f1-d968-48d2-8e12-62270b1ad1f6", "verification_type": "work_history"}	info	2026-02-15 23:36:39+00	in_app	2026-02-15 23:30:44+00
76ddb1ff-2170-4f96-96e1-bd6b8254d0ed	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Payment Method Verified	Your Payment Method verification has been approved with 87% confidence.	{"link": "/dashboard/settings/verification", "status": "approved", "confidence": 0.87, "verification_id": "cb9dffe6-e211-4dd8-bb2f-102e7088475a", "verification_type": "payment_method"}	success	2026-02-15 23:36:39+00	in_app	2026-02-15 23:30:44+00
bbb22e84-6d38-460f-89e2-b13651d897d7	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.info_requested	📋 Work History — More Info Needed	Our team needs more information about your Work History verification: We need more info about the id, please send a picture clearly	{"link": "/dashboard/settings/verification", "status": "info_requested", "verification_id": "feb7b3f1-d968-48d2-8e12-62270b1ad1f6", "verification_type": "work_history"}	info	2026-02-15 23:44:17+00	in_app	2026-02-15 23:43:50+00
dd90646f-31ef-4e69-bad2-16bee40202a1	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.info_requested	📋 Identity — More Info Needed	Our team needs more information about your Identity verification: neew request	{"link": "/dashboard/settings/verification", "status": "info_requested", "verification_id": "b74b03ab-0aaf-4391-9e30-1ddaf019e0d5", "verification_type": "identity"}	info	2026-02-15 23:58:06+00	in_app	2026-02-15 23:57:53+00
ba383a34-c04b-494a-8c81-68eb718d6205	aa04c891-a753-48bb-a2c9-9f2a528d946b	verification.user_reply	💬 User replied to verification review	New response	{"link": "/dashboard/admin/verifications", "verification_id": "b74b03ab-0aaf-4391-9e30-1ddaf019e0d5"}	info	2026-02-15 23:59:10+00	in_app	2026-02-15 23:58:16+00
39b1f4d9-5051-4f86-b7c4-95e1e7b59c2a	aa04c891-a753-48bb-a2c9-9f2a528d946b	verification.user_reply	💬 User replied to verification review	Testing persistent reply storage	{"link": "/dashboard/admin/verifications", "verification_id": "feb7b3f1-d968-48d2-8e12-62270b1ad1f6"}	info	2026-02-15 23:59:11+00	in_app	2026-02-15 23:58:08+00
ecedab02-4aa6-4c06-b576-7ccd5489074f	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Work History Verified	Your Work History verification has been approved by our review team.	{"link": "/dashboard/settings/verification", "status": "approved", "verification_id": "feb7b3f1-d968-48d2-8e12-62270b1ad1f6", "verification_type": "work_history"}	success	2026-02-16 00:11:32+00	in_app	2026-02-16 00:11:07+00
0fd89e0b-98e6-4a53-b2e9-e22c25244c0c	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.approved	✅ Job Approved	Your job "Senior Fullstack Software Engineer" has been approved and is now live!	{"link": "/dashboard/jobs/b2779bb4-a562-4a2a-b068-56d653fcd2d7", "job_id": "b2779bb4-a562-4a2a-b068-56d653fcd2d7", "status": "approved", "confidence": 1}	success	2026-02-16 02:17:25+00	in_app	2026-02-16 02:17:05+00
0c01f5b5-3a07-4fea-a9da-9bb9375f6bbe	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.approved	✅ Job Approved	Your job "Test Fixed Price Job" has been approved and is now live!	{"link": "/dashboard/jobs/07bf9891-5ffb-435d-bd01-0138174b9fe8", "job_id": "07bf9891-5ffb-435d-bd01-0138174b9fe8", "status": "approved"}	success	2026-02-17 02:08:43+00	in_app	2026-02-17 02:08:30+00
2b81533a-6ac0-49d3-9b6a-b0e8b3201b98	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.in_review	🔄 Job Under Review	Your job "Test Fixed Price Job" has been submitted for admin review.	{"link": "/dashboard/jobs/07bf9891-5ffb-435d-bd01-0138174b9fe8", "job_id": "07bf9891-5ffb-435d-bd01-0138174b9fe8", "status": "in_review", "confidence": 0.76}	info	2026-02-17 02:08:45+00	in_app	2026-02-17 02:06:47+00
a5bc9ef9-8e17-4ed5-a44c-c5f0083f7c2a	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.approved	✅ Job Approved	Your job "Test Fixed Price Job 2" has been approved and is now live!	{"link": "/dashboard/jobs/6f03333a-5d31-43ef-bdb0-caa954b4ab08", "job_id": "6f03333a-5d31-43ef-bdb0-caa954b4ab08", "status": "approved", "confidence": 1}	success	2026-02-17 02:33:03+00	in_app	2026-02-17 02:26:29+00
fd0f6e63-ae8b-428c-b152-f5c7012718a2	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.in_review	🔄 Job Under Review	Your job "Milestone Debug Job" has been submitted for admin review.	{"link": "/dashboard/jobs/0e9efea6-385a-4f0a-864f-c0df362e455b", "job_id": "0e9efea6-385a-4f0a-864f-c0df362e455b", "status": "in_review", "confidence": 0.48}	info	2026-02-17 02:33:01+00	in_app	2026-02-17 02:32:40+00
8132f785-520c-4548-b928-8965bb570367	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.in_review	🔄 Job Under Review	Your job "Opcache Test" has been submitted for admin review.	{"link": "/dashboard/jobs/1378b27c-8828-4fb9-a1af-671c9ec3e1b0", "job_id": "1378b27c-8828-4fb9-a1af-671c9ec3e1b0", "status": "in_review", "confidence": 0.74}	info	2026-02-17 03:13:10+00	in_app	2026-02-17 02:44:50+00
211bd104-5914-407b-8368-bfd84207fed6	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.approved	✅ Job Approved	Your job "Opcache Test" has been approved and is now live!	{"link": "/dashboard/jobs/1378b27c-8828-4fb9-a1af-671c9ec3e1b0", "job_id": "1378b27c-8828-4fb9-a1af-671c9ec3e1b0", "status": "approved"}	success	2026-02-17 03:13:10+00	in_app	2026-02-17 02:45:08+00
f22c6958-40d1-4ae4-8fc7-8d0da8843722	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	job_moderation.approved	✅ Job Approved	Your job "Senior Lead Software Engineer" has been approved and is now live!	{"link": "/dashboard/jobs/ef3885ce-9673-47cb-ba68-1880562adc56", "job_id": "ef3885ce-9673-47cb-ba68-1880562adc56", "status": "approved", "confidence": 1}	success	2026-02-18 22:16:32+00	in_app	2026-02-18 22:15:49+00
4a934e4a-c30f-49e7-bd42-393c24d88585	9a593055-1bd8-45d3-b276-113fa5dd1bc4	verification.approved	✅ Identity Verified	Your Identity verification has been approved by our review team.	{"link": "/dashboard/settings/verification", "status": "approved", "verification_id": "b74b03ab-0aaf-4391-9e30-1ddaf019e0d5", "verification_type": "identity"}	success	2026-02-21 19:10:58+00	in_app	2026-02-21 17:37:42+00
\.


--
-- Data for Name: notification_reply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_reply (id, notification_id, user_id, message, attachment_id, created_at) FROM stdin;
\.


--
-- Data for Name: paymentmethod; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paymentmethod (id, user_id, type, provider, last_four, token, is_default, expiry, metadata, is_active, created_at, updated_at, stripe_payment_method_id, verified, setup_intent_id) FROM stdin;
9822cdfa-74b7-4f00-9599-a57cfaedb2bf	9a593055-1bd8-45d3-b276-113fa5dd1bc4	paypal	paypal	work	\N	t	\N	{"paypal_email": "jorge@monkeyswork.com"}	t	2026-02-15 20:31:33+00	2026-02-15 20:31:33+00	\N	t	\N
19b731f5-f9f9-4bcc-9c6a-9fdcc1dbc6f2	9a593055-1bd8-45d3-b276-113fa5dd1bc4	bank_transfer	bank_transfer	6789	\N	f	\N	{"bank_name": "Chase", "account_holder": "yorch.peraza@gmail.comJorge Peraza", "account_number": "123456789", "routing_number": "t3mp0r4lAllyson021000021"}	t	2026-02-15 20:35:44+00	2026-02-15 20:35:44+00	\N	t	\N
38c1376e-921e-4b58-b450-4842a76a9573	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	us_bank_account	STRIPE TEST BANK	6789	\N	f	\N	{"bank_name": "STRIPE TEST BANK", "account_type": "checking", "routing_number": "110000000"}	f	2026-02-21 05:29:24+00	2026-02-21 16:57:06+00	pm_1T38kpB6hBd009cxJFPh4E09	f	\N
ca445c56-8ff3-4434-bce8-605a11def027	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	card	visa	5556	\N	f	12/2028	{"funding": "debit", "exp_year": 2028, "exp_month": 12}	t	2026-02-21 05:15:34+00	2026-02-21 16:57:06+00	pm_1T38XSB6hBd009cxs8l7n6GU	t	\N
b0c8a272-0a31-424e-9c9e-4a55633746b8	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	us_bank_account	STRIPE TEST BANK	6789	\N	f	\N	{"bank_name": "STRIPE TEST BANK", "account_type": "checking", "routing_number": "110000000"}	f	2026-02-21 16:57:46+00	2026-02-21 17:01:39+00	pm_1T3JUzB6hBd009cxdg7ixXSl	f	\N
d0e4288d-bf39-4248-9cbe-650dccf974f9	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	us_bank_account	STRIPE TEST BANK	6789	\N	f	\N	{"bank_name": "STRIPE TEST BANK", "account_type": "checking", "routing_number": "110000000"}	f	2026-02-21 17:02:00+00	2026-02-21 17:06:07+00	pm_1T3JZ5B6hBd009cx93o5VX8O	f	\N
e3e267be-7baf-4803-b92f-6e4b448744c9	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	card	visa	5556	\N	f	12/2028	{"funding": "debit", "exp_year": 2028, "exp_month": 12}	f	2026-02-21 05:12:49+00	2026-02-21 05:14:33+00	pm_1T38UmB6hBd009cxMLCAkMRz	t	\N
fa35909f-e4a7-4555-91f3-c7279954e1dc	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	us_bank_account	STRIPE TEST BANK	6789	\N	t	\N	{"bank_name": "STRIPE TEST BANK", "account_type": "checking", "routing_number": "110000000"}	t	2026-02-21 17:08:33+00	2026-02-21 17:08:46+00	pm_1T3JfQB6hBd009cxLAFCugwL	t	seti_1T3JfQB6hBd009cxIoGwXBFt
\.


--
-- Data for Name: payout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout (id, freelancer_id, payment_method_id, amount, currency, fee, net_amount, status, gateway_reference, failure_reason, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: proposal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal (id, job_id, freelancer_id, cover_letter, bid_amount, bid_type, estimated_duration_days, status, milestones_proposed, attachments, ai_match_score, ai_match_model_version, ai_match_breakdown, ai_fraud_score, ai_fraud_model_version, ai_fraud_action, viewed_at, shortlisted_at, created_at, updated_at) FROM stdin;
71ca9c0c-58c1-4a54-9713-83e8fa16777f	b2779bb4-a562-4a2a-b068-56d653fcd2d7	9a593055-1bd8-45d3-b276-113fa5dd1bc4	<p>This is a new proposal of job, <strong>I have the best</strong> skills for this job</p>	70.00	total	364	accepted	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 03:58:35+00	2026-02-17 00:45:49+00
24c8aec8-626f-4ada-99ac-bd1f3e6f76fb	1378b27c-8828-4fb9-a1af-671c9ec3e1b0	9a593055-1bd8-45d3-b276-113fa5dd1bc4	<p>Im the best for the job and I have the skills for the best of the best</p>	2000.00	fixed	28	accepted	[{"title": "Milestone Freelancer", "amount": "1000.00", "description": "New Milestone"}, {"title": "Milestone Freelancer 2", "amount": "1000.00", "description": "Milestone Freelancer 2 description"}]	[]	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 02:46:54+00	2026-02-17 16:21:26+00
04e904f9-6395-45b4-8182-e8d91907a44e	ef3885ce-9673-47cb-ba68-1880562adc56	9a593055-1bd8-45d3-b276-113fa5dd1bc4	<p>Im the best candidate for this job if you compare price and my skills</p>	70.00	hourly	56	accepted	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-18 22:20:09+00	2026-02-18 22:22:41+00
\.


--
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report (id, reporter_id, reported_entity_id, reported_entity_type, reason, description, evidence_urls, status, reviewed_by_id, resolution_notes, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review (id, contract_id, reviewer_id, reviewee_id, overall_rating, communication_rating, quality_rating, timeliness_rating, professionalism_rating, comment, response, response_at, is_public, created_at, updated_at) FROM stdin;
8436e7b1-fb34-4749-90db-fe02776b1881	ce4378ee-03b1-4675-b2f7-e63e673cd8c4	9a593055-1bd8-45d3-b276-113fa5dd1bc4	300e3c58-9465-4a6f-bfe9-8bb6d5f40136	5.00	5.00	5.00	5.00	\N	excellent all!	Thanks for this	2026-02-23 02:10:42+00	t	2026-02-23 02:10:08+00	2026-02-23 02:10:42+00
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role (id, slug, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: saved_job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.saved_job (user_id, job_id, created_at) FROM stdin;
\.


--
-- Data for Name: savedjob; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.savedjob (id, user_id, job_id, created_at) FROM stdin;
\.


--
-- Data for Name: screenshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screenshot (id, time_entry_id, file_url, click_count, key_count, activity_percent, captured_at, deleted_at, created_at) FROM stdin;
ab272287-ce30-42c4-9907-f1b3cf6182f1	de2264da-6b19-45d8-94f7-ca36430e8be7	/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/db270a9f4ba3fa3c0eae0b35203bbe3f.png	127	265	100.00	2026-02-20 18:36:06+00	\N	2026-02-20 18:36:06+00
b9af45d5-808b-4509-bd9e-31840693e315	de2264da-6b19-45d8-94f7-ca36430e8be7	/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/fd5b63981b6adf5c5ec5004c4e36213a.png	61	81	100.00	2026-02-20 18:42:12+00	\N	2026-02-20 18:42:12+00
\.


--
-- Data for Name: skill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill (id, name, slug, category_id, parent_id, description, icon, is_active, usage_count, created_at) FROM stdin;
25c0c822-c5b8-4339-ad1a-8ddc5bcb2a48	JavaScript	javascript	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.50915+00
0222525d-af25-4248-89f4-25a6bb3b67ea	TypeScript	typescript	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.511637+00
a0c63990-d9e9-4ca1-a3b0-3b0d61fe6dca	React	react	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.512265+00
2a238cc0-8b75-4d9e-82bb-b1697092d9b8	React Native	react-native	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.512713+00
6bfa677a-902f-46e4-988a-7420eeb5bbb2	Next.js	next-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.512987+00
b50b1e66-c6bf-4b44-988e-a51c928010a0	Vue.js	vue-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.513297+00
99ba0b00-07e4-4b15-9c9a-a83ffacb3132	Nuxt.js	nuxt-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.513617+00
b2b555f0-683d-4827-b070-fea6954f5ccd	Angular	angular	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.513886+00
8f2ceab0-5326-4592-9c6e-66d3b348c841	Svelte	svelte	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.514143+00
addf57ce-10ee-47ca-803b-32d83f8e45ce	SvelteKit	sveltekit	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.514417+00
00b6f406-4c2b-4a50-8551-a9d079568017	HTML5	html5	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.514716+00
0bea733c-2df3-4dfa-8898-04ad8363d263	CSS3	css3	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.514985+00
14077a08-366b-461c-87f5-7ee5c3160870	Tailwind CSS	tailwind-css	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.515237+00
0d0b4af2-4fe8-4d35-a2e5-4520c8b9a813	Bootstrap	bootstrap	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.515509+00
498e7ee6-d4e8-47d9-bd65-15a8b51cf472	SASS/SCSS	sass-scss	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.515756+00
ffd5b4b3-c3b6-4b05-b27b-4b9680b220bd	jQuery	jquery	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.516313+00
66c17cf0-c9ee-4155-8929-25721d92ea12	Webpack	webpack	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.516569+00
9f99dc8d-50cc-4cd4-9dc2-3b0ecc67ccec	Vite	vite	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.516857+00
2d813485-463a-4cc6-a67a-6c3d27876d49	Storybook	storybook	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.517083+00
e910d4a0-b401-4b50-b59e-eb8b293c92cb	Node.js	node-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.518006+00
e04a65c7-c473-46c5-91fb-98a8c692d37f	Express.js	express-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.518227+00
5eb832d0-040b-44b7-9003-744426bf7f5b	NestJS	nestjs	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.518457+00
4be233b8-5697-42a0-a076-dc276288b188	PHP	php	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.518685+00
1f778b72-96ab-4f26-8f1c-7f92e20a8dcd	Laravel	laravel	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.518955+00
5c58ca5e-6715-43b9-abc0-496dac0b21b2	Symfony	symfony	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.51918+00
978e7a18-5549-4f45-81db-f8aa6e2c89aa	CodeIgniter	codeigniter	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.51941+00
98b40755-8534-4184-80cc-aeeae99f17e1	Python	python	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.519657+00
f07b444a-70eb-4254-9321-91d86c16cd6f	Django	django	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.519877+00
ad86bbb8-96a7-4158-9eb1-4f7e81344ac5	Flask	flask	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.520095+00
9a97b766-f971-4e3a-8cfb-284eb9b3a396	FastAPI	fastapi	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.52031+00
69475187-3802-4f0a-bcab-ed1f4687e95c	Ruby	ruby	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.52052+00
68148c5a-632f-494a-851e-5a9f15877b6b	Ruby on Rails	ruby-on-rails	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.520748+00
baeb6245-ae86-4e92-aa9c-afb65af1a783	Java	java	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.521062+00
ba35848c-6f78-4869-9a15-66bee638565f	Spring Boot	spring-boot	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.521399+00
fd26027f-0d3f-475f-9a84-d342325d0e02	Kotlin	kotlin	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.521664+00
813e83e2-8bb1-4262-a69a-cff4fe49fee4	Go	go	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.521965+00
ce2a0d3b-c054-4dbf-ac24-b1b1645af317	Rust	rust	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.522384+00
94329bcf-234e-4bdb-bef9-eea21170a738	C#	c	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.522645+00
69945a8a-2825-4714-a47c-a2bfe1788855	.NET	net	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.523481+00
186f21eb-ea11-4571-ae6e-9896d3ba4414	ASP.NET	asp-net	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.52386+00
42d8a5ba-75c7-43dc-ab31-f6be8a7f8d9d	Elixir	elixir	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.524226+00
473cf6da-daf6-4700-9b23-8d264f747f24	Phoenix	phoenix	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.524536+00
39605484-d313-440f-9516-e9913aceb8b6	Scala	scala	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.52488+00
a8c406de-e1b3-46f6-81df-2a76964761c6	iOS Development	ios-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.525269+00
627fffea-4a59-470a-b302-7437fa9fe83b	Swift	swift	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.52629+00
a58c2d1d-da8b-4b0b-8104-e274be9cac05	SwiftUI	swiftui	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.526655+00
faaec7e2-5b93-463b-abc6-dc16398a6d32	Objective-C	objective-c	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.527889+00
2a82f53f-ae98-4729-b0d9-75238e9a6ac4	Android Development	android-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.528217+00
6ea8d26b-d029-4fe9-ad59-dd8aba2b2890	Jetpack Compose	jetpack-compose	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.528447+00
d525196a-5698-4eac-bd88-3c35c927756e	Flutter	flutter	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.528707+00
d178e4a8-92d5-4b49-898e-58b03b8c4a09	Dart	dart	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.528936+00
501ca6c4-7460-46c0-855a-f5d370f6b845	Xamarin	xamarin	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.529173+00
c72c346d-123d-4bec-929c-309578bdda8f	Ionic	ionic	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.529397+00
c1574fd1-f21d-49b9-b1f5-52394ade9c5d	Capacitor	capacitor	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.529638+00
8a2a3123-3791-4a4b-854f-b94e41517f4c	Tauri	tauri	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.529854+00
98f4522e-5881-4337-b990-5bade501833a	MySQL	mysql	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.53007+00
1fde1365-5b40-4672-89df-bc7cb58db3d5	PostgreSQL	postgresql	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.530293+00
9af87343-ad54-442a-9975-d8c0168a5bc4	MongoDB	mongodb	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.530516+00
284c4f19-b3b0-47de-bd0e-77026d28c7ce	Redis	redis	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.530776+00
e4503108-1885-43ca-badb-9d7ddb2868e5	SQLite	sqlite	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.531246+00
0927c559-bf7f-41c3-8deb-e7f635541c5f	MariaDB	mariadb	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.531501+00
2f2d16c7-27e3-488c-814b-a42f549cb834	DynamoDB	dynamodb	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.532243+00
42c348e8-ab51-423c-b699-d1dce593b672	Cassandra	cassandra	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.532505+00
e088a53c-0ba7-4db9-90f0-daff6b948ae5	Elasticsearch	elasticsearch	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.532758+00
a45116fb-a21b-4fd3-8fa2-f3dfe15fcc67	Neo4j	neo4j	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.532993+00
43c5545b-860e-48bc-9841-ecdc4184b43f	CouchDB	couchdb	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.533219+00
414a7b6a-7662-41e1-adff-b5ed9672a38b	Firebase Realtime DB	firebase-realtime-db	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.533454+00
e882398a-d2fe-40ea-b9fe-fcaef592d5e6	Supabase	supabase	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.533711+00
3b2bcac5-7898-458a-b15c-c7eafc618510	PlanetScale	planetscale	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.533938+00
16d396a8-230a-4c2c-9a3c-7ad94e66c5f0	Prisma	prisma	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.534167+00
b2b0832e-bb44-4bee-802d-3d4be92638ed	TypeORM	typeorm	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.534401+00
5a12b883-2012-4777-8c9b-9ed8ce60b70f	Sequelize	sequelize	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.534643+00
3901a057-edc4-460c-bda3-d5771abfc355	Drizzle ORM	drizzle-orm	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.534887+00
5556069a-e6c6-4306-a256-45c6531b7bf4	AWS	aws	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.535113+00
94ebaf02-2770-43f5-b57f-e53749b8324f	Google Cloud Platform	google-cloud-platform	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.535331+00
536c5444-ab8f-42d9-88b8-c59272946440	Microsoft Azure	microsoft-azure	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.535579+00
6a71c97f-0f72-45fc-858e-589d03bc94f5	DigitalOcean	digitalocean	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.536686+00
7ea798c8-eba5-4815-830e-c69968fccfe0	Docker	docker	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.537361+00
937e0cc6-5105-4282-bc9b-e52dcc61e56b	Kubernetes	kubernetes	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.537862+00
504e041d-959a-4794-96b5-993b971555c1	Terraform	terraform	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.538624+00
226be501-9770-41e1-8f62-9c2c8720c399	Ansible	ansible	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.53983+00
6f8b1cd6-82b4-4713-8d7e-746a93c5ee02	Jenkins	jenkins	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.540063+00
72241ed1-0850-46f6-9550-aa85eb9c839e	GitHub Actions	github-actions	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.540293+00
718392e9-3522-4bfe-8b4f-0871b9ec209f	GitLab CI/CD	gitlab-ci-cd	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.541268+00
c46b6915-1b1f-4c7d-ab13-dcce732ed4a8	CircleCI	circleci	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.5416+00
bba54c8c-e892-4d59-82be-42bd09191f8d	Nginx	nginx	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.541862+00
b81e3b35-e79e-4ccf-87e2-47955f0fdc40	Apache	apache	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.542121+00
6bf90a5c-bfa0-4ee0-9c4d-ebc3a28aea71	Linux Administration	linux-administration	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.542362+00
c5cae237-a6d6-448a-b315-203f4ad1147d	Serverless	serverless	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.542645+00
f9db9d94-b07d-41da-9530-22f2282c1d3b	Vercel	vercel	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.542859+00
37caccb1-03aa-458c-a183-ed8f4cdd437e	Netlify	netlify	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.543085+00
21c4f2f5-df65-4b83-a6c7-1d218b09c097	Cloudflare Workers	cloudflare-workers	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.543331+00
e838786b-ff65-432a-8a96-2029340c6c6e	REST API Design	rest-api-design	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.543586+00
4b209a7a-29d7-4d4c-8c5b-a4e4511a559c	GraphQL	graphql	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.543845+00
835e1854-9e93-4586-9f9f-3998ba6076fa	gRPC	grpc	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.5441+00
87cd258b-807e-4890-8452-81ed58796320	WebSockets	websockets	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.544338+00
8a11a013-caad-432e-819d-37fc63f78d2e	OAuth	oauth	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.544594+00
47ada5d7-38ef-412e-9b8a-ea772d66134f	JWT	jwt	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.54483+00
39516c58-33ba-4b2c-86ea-1e4a20c4c082	Microservices Architecture	microservices-architecture	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.545077+00
3892d311-84ff-4be5-8ea3-c2fee7aacd98	API Gateway	api-gateway	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.545326+00
df4e2c92-2d0a-408e-b04d-98c5d3c34a72	Swagger/OpenAPI	swagger-openapi	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.545587+00
95f7279e-7a03-4684-82ed-c296e020ff39	Stripe Integration	stripe-integration	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.545827+00
77f31c95-3150-489b-bd7f-f0dac6014066	PayPal Integration	paypal-integration	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.546073+00
21b6162a-bf59-430e-b505-cff1114d4ed0	Twilio	twilio	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.546314+00
dd390389-bd3e-4dde-afb1-6a8d551701a3	SendGrid	sendgrid	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.546551+00
9585bf63-0edf-4c52-bbd1-269c450a9aca	Unit Testing	unit-testing	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.5468+00
348dd3eb-12a0-47a0-8251-aa17c3e4a86c	Integration Testing	integration-testing	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.547011+00
be88e28f-0b47-4785-8816-1065741fef5a	Jest	jest	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.547223+00
cb1c9530-5d3e-4193-86b1-87bd0705fb28	Cypress	cypress	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.547439+00
1be1913c-1acd-4db9-9e4c-70422a345d00	Playwright	playwright	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.54766+00
1a4794f7-75f7-4553-9a12-9211de09ebee	Selenium	selenium	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.547881+00
ef554e06-2654-4486-a59d-19d326636073	PHPUnit	phpunit	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.548098+00
b2343cf4-b7ed-42f4-8fd7-2d7f8d813cf7	Pytest	pytest	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.548594+00
95f545f2-4172-4151-9708-6b9aa606b36e	Test-Driven Development	test-driven-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.548836+00
3f7df200-52a8-49c1-a8e6-607c5a2fd3be	Git	git	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.549049+00
67bc805d-d284-41b3-8f8d-9eb9e51ec8e9	GitHub	github	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.549272+00
f4974224-db55-4837-b14c-972fd23a2057	Agile/Scrum	agile-scrum	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.549821+00
19c8d519-860f-48f0-a694-f75bfa2ef7de	CI/CD Pipelines	ci-cd-pipelines	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.550046+00
09b2a275-abd8-44d1-a774-67094b1ccca5	Web Scraping	web-scraping	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.550267+00
a5080db4-44a0-4a9a-9633-2feb84918281	Browser Extensions	browser-extensions	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.550476+00
d9ba2f22-f662-4fc4-8bad-2eb02ef090e3	Progressive Web Apps	progressive-web-apps	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.550709+00
8a5ea207-d4e7-4656-a7c4-4bcbac6cd6d7	WebAssembly	webassembly	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.551072+00
76cabb0c-8ba4-41c9-a45a-b23bfe0ac3a8	Blockchain Development	blockchain-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.551313+00
8f7f0838-3109-4c1e-94bf-63a1844629f5	Solidity	solidity	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.551522+00
f0edb468-e248-4663-8565-2ca72fbe748c	Web3.js	web3-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.551773+00
a2e271d8-f49a-4326-a131-1b5fab1c1a11	Ethers.js	ethers-js	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.551997+00
371159d3-f410-4416-929e-5d54adb96032	Smart Contracts	smart-contracts	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.55223+00
443e7ed8-9a5a-4db8-a28b-3dbbd39669ac	NFT Development	nft-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:52:36.552625+00
886a58fd-07a8-45f6-9c3a-3112c7093a18	Figma	figma	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.552896+00
d706f103-2c4d-44f4-9791-9d63fad922a9	Adobe XD	adobe-xd	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.553144+00
adce676f-6138-4141-b56f-5c4beafafe5e	Sketch	sketch	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.553366+00
5762c198-0a5d-4a6d-be7e-6ce1cec6a717	InVision	invision	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.553588+00
c7f6072e-d332-48a4-9115-f4ac6d27fb91	Framer	framer	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.553852+00
637e15b9-1c79-4a2f-bff8-0c0577efd42b	UI Design	ui-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.554084+00
58a006c3-e6be-4836-8153-c9aeb443f72d	UX Design	ux-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.554309+00
6e068ec0-07b5-4887-9838-f6a3447ef596	UX Research	ux-research	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.554539+00
a6478e10-df49-47ee-96a7-5e8d6a249af2	Wireframing	wireframing	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.554813+00
7edbd2bb-dba5-4bfb-8f27-0480e275d86e	Prototyping	prototyping	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.555025+00
8a254436-7582-47b1-abc0-935e2a9882cb	Interaction Design	interaction-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.555235+00
3f56aeb8-18b3-46be-828b-5b7d903a3283	Information Architecture	information-architecture	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.555448+00
bd72ec39-48f4-4438-ae18-0de2b5b891a9	User Testing	user-testing	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.55567+00
aaa36858-daf7-4c5e-ab8e-93ecba14e13c	Design Systems	design-systems	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.555897+00
9ddfb7b9-c404-482c-867e-04d9b7927dc5	Responsive Design	responsive-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.556128+00
9bef168b-d26a-4c34-8708-896b5a4c1f2f	Mobile App Design	mobile-app-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.556363+00
2dbac55f-e4b8-4bb4-bedd-c0383478acd2	Web Design	web-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.556579+00
07ea3f04-567a-4296-bf9f-ba0a560240ad	Landing Page Design	landing-page-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.556785+00
9ec1eb90-eb0b-4375-86c7-20faf654a82d	Dashboard Design	dashboard-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.556995+00
f4fafcdc-1a07-4ea7-b87e-7f2abfdbf7a0	Adobe Photoshop	adobe-photoshop	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.55721+00
5db929c1-4bd0-4e7f-b61a-9eca209e04a6	Adobe Illustrator	adobe-illustrator	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.557442+00
f8cd2d15-5239-4f6c-afca-6f1421114791	Adobe InDesign	adobe-indesign	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.557692+00
3f640146-b3b4-44b0-86b3-a217aaf47cc1	Canva	canva	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.557922+00
c84e8e33-5fa1-4731-ad2b-f92f75acd351	Logo Design	logo-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.558155+00
55b9d209-8012-46cc-8f99-bad8ac167b70	Brand Identity	brand-identity	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.558685+00
0800484e-6c0e-4e30-80b0-bd891fd96817	Brand Guidelines	brand-guidelines	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.558989+00
48ec28f1-0978-463c-b436-44481e7a4615	Typography	typography	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.559249+00
adee12e5-6409-463e-8de6-73128aa4d73e	Icon Design	icon-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.55947+00
8393a4d7-98a1-44d5-8054-0c84d213cbf2	Infographic Design	infographic-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.5597+00
d9e75bf7-748b-49c1-bb86-e1eafdb6af7f	Print Design	print-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.559921+00
2a79536c-df46-4cd2-a45e-184090927a0b	Packaging Design	packaging-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.560138+00
425cc042-cfb5-4bf0-abb5-a61b769f285b	Business Card Design	business-card-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.560342+00
30e5d621-0595-44ce-954c-381462ef7a7b	Flyer Design	flyer-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.560596+00
975302ea-7f9e-46cf-81b1-d69d8af4c684	Poster Design	poster-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.560832+00
0f548830-3888-457a-8e1f-42ec59f4bd70	Banner Design	banner-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.561192+00
51ee4f92-ea34-4944-9d8b-fdcbe85e5aa9	T-Shirt Design	t-shirt-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.561476+00
e1a1481b-dd72-40e0-b501-4d9bc3928b78	Merchandise Design	merchandise-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.561714+00
13bfb487-bd5d-4fae-8689-5dea44b6231d	Label Design	label-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.561962+00
0ccf5eea-167f-44cd-a851-b0677cf947db	Adobe After Effects	adobe-after-effects	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.562196+00
8edf96d9-c2e4-444e-b024-4b6f82dca63c	Adobe Premiere Pro	adobe-premiere-pro	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.562424+00
62b610ec-94c7-4a29-a73c-59505e941fda	DaVinci Resolve	davinci-resolve	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.562671+00
982f6f8a-c684-4d58-b849-3c59cb4428da	Motion Graphics	motion-graphics	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.562932+00
ad46a721-518c-467a-9e17-0c1ca702e9ce	Video Editing	video-editing	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.563162+00
37c8f28e-e0ca-4fd9-9b84-9f9c5c153ce3	Animation	animation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.564434+00
c0f051a2-e3aa-4630-b0bd-57938d5f7c9c	2D Animation	2d-animation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.56472+00
fd309465-5ed7-4a1e-82d7-a1ab9b50400e	3D Animation	3d-animation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.564959+00
88c7bfcf-ec6f-4f33-a190-744f2eee1bca	Lottie Animations	lottie-animations	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.565166+00
6090155a-2900-4e3a-8b0e-e92627aaa2b5	Rive	rive	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.565373+00
d403bbfe-2668-4bb9-bdbc-485bcbedce58	Character Animation	character-animation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.565606+00
41761b59-6849-478a-a9f4-7c45d0652cb3	Blender	blender	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.565837+00
773704ff-9905-4f6f-95ec-d9e316ab69f3	Cinema 4D	cinema-4d	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.566075+00
6ec66b91-2b9f-423a-8f41-01d18324f33b	Maya	maya	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.566318+00
c7d833e3-8678-4299-bf7c-ab450fc1801d	3ds Max	3ds-max	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.566548+00
dd78a6ef-d739-41bb-a8c9-5ea17efb4fb9	ZBrush	zbrush	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.566764+00
9ab9ea0a-73ed-40e7-aa10-6ec9ed11bda4	3D Modeling	3d-modeling	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.566988+00
f9cce35b-f1ed-494d-b710-a76fd316a73b	3D Rendering	3d-rendering	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.567206+00
f997070c-ea34-466c-be3c-07cc2cee8145	Product Visualization	product-visualization	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.567417+00
8581677c-4335-4589-a4f4-ca6a1b371c4a	Architectural Visualization	architectural-visualization	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.56764+00
d5806bce-0ce7-475a-babf-efbca9d9d88d	Game Art	game-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.567864+00
84b6d08e-942d-46e4-a082-b029bfd5dd70	Pixel Art	pixel-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.568109+00
5c3a1712-052b-4c6b-8e83-2974b6c604cd	Concept Art	concept-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.56834+00
f1a90610-476b-4dd1-a051-08907f142f32	Character Design	character-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.568552+00
1e09c691-85d1-43cc-ace1-6c7625dbb069	Environment Design	environment-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.568786+00
c01430d9-4522-42cd-a6ba-161900eed9c2	Digital Illustration	digital-illustration	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.569001+00
7d714497-79b2-43a1-93a2-41ce9e7b8e46	Vector Illustration	vector-illustration	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.569234+00
06f6781b-8e2a-449a-8e1c-8014192152d2	Editorial Illustration	editorial-illustration	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.569807+00
f02f17ad-d60a-4de5-9f65-9da5adf70afb	Children's Book Illustration	children-s-book-illustration	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.570039+00
f99678f8-c518-4fec-9670-9c20a071c8b3	Technical Illustration	technical-illustration	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.570275+00
c37133f0-4da5-4ce4-a9f2-b540fbe9f5c5	Storyboarding	storyboarding	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.570493+00
47d9591c-b8cf-4422-bb8a-9759774eadf6	Caricature	caricature	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.570733+00
896cc1a5-e622-4d9d-8b8a-808162123e91	Comic Art	comic-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.571815+00
0ea4a199-a8be-4f77-9b94-be38b4e61e2d	Manga Art	manga-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.572103+00
a412bcbd-c7ac-47a0-af76-d57d525039e6	Procreate	procreate	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.572343+00
ac4709d5-af4b-423b-930f-0a88adc0637b	Photo Editing	photo-editing	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.57264+00
e7a86c98-14b8-4744-a233-db6655889c29	Photo Retouching	photo-retouching	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.572872+00
2d27a50e-29d4-4a79-83ac-1a0278fbfaa5	Image Manipulation	image-manipulation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.573111+00
e4e6c6d7-809e-4c4f-953f-07ca7af985d9	Product Photography	product-photography	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.573324+00
4845b3ec-7ead-40f4-a37c-96b29d97831b	Portrait Photography	portrait-photography	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.573532+00
06d22adb-42bf-4179-a1e7-634c75140b82	Lightroom	lightroom	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:52:36.57385+00
0cd1651a-0276-4980-820d-982e830e4d23	Blog Writing	blog-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.574099+00
b4d2b0b1-e54f-4445-8e89-24c3dcc491df	Article Writing	article-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.574316+00
6ace9d9f-cd5d-4fed-a12b-2d5f40556d55	SEO Writing	seo-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.574534+00
73f401de-fe6e-437b-becd-8311c4d045c4	Copywriting	copywriting	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.574754+00
047c6405-c762-4591-96b3-e07c4c37690b	Content Strategy	content-strategy	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.574977+00
e3ec9cf2-0cb7-4961-86e0-0403b5f0b54e	Content Marketing	content-marketing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.575203+00
b5cbf175-714e-4d8d-93c3-e97d3ae12df0	Email Marketing Copy	email-marketing-copy	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.575434+00
b30a3161-aaa2-4689-aefe-a5f30ee70717	Website Content	website-content	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.575817+00
06c5d108-919b-40e9-9726-a8fe687dafb0	Product Descriptions	product-descriptions	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.576057+00
cac2f7af-92eb-49a0-8d6c-c0201f3e4dfe	Press Releases	press-releases	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.576287+00
1da8ac8c-744f-4c35-9c2b-25562adb377c	Ghostwriting	ghostwriting	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.576513+00
ad976e38-9ed2-4aef-80e3-f4bc960c8036	Research Writing	research-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.576731+00
04dabac0-14ef-4336-b1e4-498e4f406e2a	Academic Writing	academic-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.576945+00
162eb4c7-4a15-4641-8693-aafb07939218	eBook Writing	ebook-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.577156+00
6da783d3-512f-42b1-b2b1-d9aebc609a63	White Papers	white-papers	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.577371+00
1494fbbb-a0f4-4d82-afca-b7b658674408	Case Studies	case-studies	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.577608+00
cf37bcac-23dc-462f-8063-1d13434f66de	Newsletter Writing	newsletter-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.577834+00
fefcf05c-e441-413c-8b45-9841c7179e84	Creative Writing	creative-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.578052+00
b979f063-191d-41bb-9122-43d75a919427	Fiction Writing	fiction-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.578308+00
701a41e4-e648-4311-b6f4-c13ee57a524b	Screenwriting	screenwriting	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.578542+00
2305bac7-2c57-4921-9191-5a5ee63eb22e	Script Writing	script-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.578773+00
91f99393-e405-45e2-9ff9-31a6926e59ba	Poetry	poetry	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.578994+00
3c39bc24-9116-4519-89a7-52a67bd83d9a	Storytelling	storytelling	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.579295+00
b91ec673-cb13-4463-a433-c33771e45f4f	Speechwriting	speechwriting	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.579526+00
b21623f8-fa5e-4425-9858-eff20fe424b3	Song Lyrics	song-lyrics	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.57976+00
fb59b0bc-cfeb-48d7-917e-1a2da7c0e86c	Technical Writing	technical-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.579975+00
1629f2e8-d311-41b0-92e3-5f3e87cfbddb	API Documentation	api-documentation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.58019+00
b85305da-68bb-43bb-b7cc-54ade03b95c1	User Manuals	user-manuals	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.580626+00
dc059ef5-ed8f-4095-8599-e484f34a140b	Standard Operating Procedures	standard-operating-procedures	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.580949+00
e65a9d73-94e9-4a57-98e5-f41c307ef4fe	Knowledge Base Articles	knowledge-base-articles	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.582035+00
9802348e-3763-4a66-9db4-73dfb08432c1	Software Documentation	software-documentation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.582753+00
3cc220fb-67b0-4bc9-8fb8-1c105dc19c72	Medical Writing	medical-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.583051+00
732a4f41-b921-4f7f-92a9-45b2e0a8de7a	Legal Writing	legal-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.583287+00
fee0c60e-a886-42e1-905e-1ec760f84f01	Grant Writing	grant-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.583517+00
8bc27c97-a5b5-42e4-9450-0a9146ced539	Editing	editing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.583784+00
7563bcb9-3b98-4854-90ae-78fc0f24556a	Proofreading	proofreading	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.583994+00
6775c2b6-b83f-4ad1-a0a0-f816bb4bc2aa	Copy Editing	copy-editing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.584211+00
b15ae52f-77d9-41d6-a020-99ff4d5c48cd	Fact-Checking	fact-checking	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.584431+00
e5b568b8-7257-4dd0-81be-114a69b7acbe	Content Auditing	content-auditing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.584668+00
4c39956a-26d2-455a-b730-05ee9510792e	Style Guide Development	style-guide-development	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.584906+00
9c2fec67-6a7d-4a1f-b08b-358dedd482d8	English Translation	english-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.585143+00
1aaaafab-0f47-4b1f-bab7-b5c28dbfa13b	Spanish Translation	spanish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.58538+00
100019ca-4cf3-4bc1-9b6f-93a4ae43d902	French Translation	french-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.58562+00
4e23e141-bd5e-47c3-a699-a8ba7e8c7759	German Translation	german-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.585845+00
922466d3-4a61-4fbe-83b5-eb45d488ef86	Chinese Translation	chinese-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.586062+00
0c979742-b6d2-4fe1-84da-7b886b57f5d1	Japanese Translation	japanese-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.586305+00
7f1eb8f2-9232-45f1-85ca-814db01e46e1	Korean Translation	korean-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.586532+00
ff16c7a0-7c34-4647-b7ba-0ab5bd35d020	Portuguese Translation	portuguese-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.586768+00
55de0e68-04f9-4d96-a22c-e864ca51b7eb	Arabic Translation	arabic-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.586983+00
a9ec4bde-f132-4dc9-9a01-f7d5cd2a9a96	Italian Translation	italian-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.587218+00
066cc8d8-843a-4a22-b962-e8507f34ef57	Russian Translation	russian-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.587574+00
ff31856f-41d9-4783-98ee-aa2905dc78ef	Hindi Translation	hindi-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.587796+00
cb2dd36c-e672-470c-8e9f-16c2c0489bb3	Localization	localization	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.588024+00
604c9321-a1ac-48c1-a140-fd9a3a0f6ae9	Transcription	transcription	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.588256+00
b38df420-26c7-48cf-97e7-17c49984eb41	Subtitling	subtitling	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.588491+00
a2a02b1b-2e8e-4e73-ae2f-c90a2f22e57b	Voice-Over Scripts	voice-over-scripts	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:52:36.588705+00
ba53228f-24ad-4262-83d4-5393fd9b88a8	Digital Marketing	digital-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.58895+00
a5ac6011-3dff-43fd-b478-b96a4e0bc4e7	Social Media Marketing	social-media-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.589204+00
6b309afa-d1c7-457b-9d8d-8bdfbdc18f97	Email Marketing	email-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.589597+00
42d9694e-b856-4882-bee3-384e88aa7802	Marketing Automation	marketing-automation	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.589823+00
e7562321-e2af-42ab-a20e-958dc8c8aafe	Growth Hacking	growth-hacking	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.590064+00
11f48c1f-13ae-497a-b246-216315a2e0cc	Conversion Rate Optimization	conversion-rate-optimization	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.590278+00
28e05233-85a3-49c4-8213-086066b6cd28	A/B Testing	a-b-testing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.590493+00
ad05c909-96b7-4d37-b97f-20067304fd1a	Marketing Strategy	marketing-strategy	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.590733+00
3ab8003e-6d39-48bb-b6d2-3d0d79c8e839	Brand Strategy	brand-strategy	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.59109+00
6bcdca1e-ce20-4bad-a654-b5669021d6d2	Market Research	market-research	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.591394+00
27488e1b-bd61-47de-b167-76fba551d2da	Competitive Analysis	competitive-analysis	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.591659+00
a0d3f69d-58b2-45de-9c5e-e3eae5019d61	SEO	seo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.591929+00
8b997fb6-7c95-4ff4-89c5-5ff9a0ff90ec	Technical SEO	technical-seo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.592174+00
16665d92-f6fc-42a6-91b0-c8c99c72d4d3	Local SEO	local-seo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.592471+00
3b2d73c8-bc91-410d-8e30-b05587957e28	Link Building	link-building	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.592719+00
96c63ed3-d280-4364-aa52-ef4ddcb3cd38	Google Ads	google-ads	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.592986+00
e6fc4d1e-c5d2-4521-9cb7-55432b97576c	Facebook Ads	facebook-ads	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.593227+00
fd1140f4-c4b3-419f-87fc-462861e881b2	Instagram Ads	instagram-ads	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.593468+00
e7b94c9d-3f07-433f-9a93-ec806a23952e	TikTok Ads	tiktok-ads	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.593768+00
fa0d3f16-d9c5-4d60-9d01-4aeb2dec3527	LinkedIn Ads	linkedin-ads	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.594004+00
68a204bb-f7e4-4fcb-ae78-2d39ac44a369	PPC Management	ppc-management	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.594237+00
db4e729f-34c3-4b01-b4a9-be0da344b6be	Google Analytics	google-analytics	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.594466+00
bd864c5e-3448-4193-bcaa-4ec7d9a3e25e	GTM	gtm	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.594771+00
5e7d02e6-b71b-4b8a-aaaf-3b45ae2c7309	Social Media Management	social-media-management	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.594986+00
c1dd2c80-28c5-42e9-8db7-9aae36b13ed3	Community Management	community-management	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.595199+00
9899706a-069f-4307-9505-d487b6a5c301	Influencer Marketing	influencer-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.595402+00
a0a7a3ca-60a4-4256-975d-d4960967c57b	Social Media Strategy	social-media-strategy	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.595665+00
1c1a8230-c85b-4b02-bffb-95b2da6c9bca	Content Calendar	content-calendar	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.59596+00
bda77b67-91c6-4b58-a2c8-e433a33edeef	Hootsuite	hootsuite	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.5962+00
1dbf490d-5790-49c3-935b-8a2c0503bd75	Buffer	buffer	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.596487+00
ba766f7f-67a3-45e1-ba4e-e03d88ee75cd	Instagram Marketing	instagram-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.596727+00
0b0193df-db7a-4516-b530-c95abadecbc7	TikTok Marketing	tiktok-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.596971+00
dfe91e2c-f53a-4360-9a53-6bca1ba049e5	YouTube Marketing	youtube-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.597299+00
783089fb-31af-4adf-a1e8-d326331f536f	LinkedIn Marketing	linkedin-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.597505+00
925c9fbe-34d7-49e9-8188-b9ea5ed095c2	Twitter/X Marketing	twitter-x-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.597728+00
35ca2521-de05-40de-aee7-39ddd136c185	Pinterest Marketing	pinterest-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.597952+00
874c1370-c676-4599-980c-cfe0d8d46665	Sales Funnel Design	sales-funnel-design	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.598199+00
0cf01081-fe0e-430b-a038-0d61064e576c	Lead Generation	lead-generation	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.598682+00
a0741c2d-2057-4cb9-9082-a1d9c39c9af9	Cold Outreach	cold-outreach	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.598922+00
b2bee475-1488-4e43-92d1-0d03524a81a0	CRM Management	crm-management	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.599161+00
719d4403-11fe-410b-90b0-c1b370c1c3f8	Salesforce	salesforce	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.599382+00
8b1c5202-447e-49ff-ad98-dcab76c7696e	HubSpot	hubspot	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.599592+00
a5f0b8a6-cf67-49e1-b59c-b627fe6e6048	Pipedrive	pipedrive	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.599814+00
2484e4fb-02d8-4f86-be1b-3ea405ec7278	Sales Copywriting	sales-copywriting	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.600056+00
cffe232c-7da3-400b-8db3-61311aed2f88	Proposal Writing	proposal-writing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.600275+00
0e6397f9-352c-4dbf-8446-a115ecfa79e9	B2B Sales	b2b-sales	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.600493+00
639377d3-b075-4bf8-9a7e-ccd1bd66b9b4	B2C Sales	b2c-sales	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.600711+00
e316db49-6216-4067-b9b6-f8710792f43a	Public Relations	public-relations	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.60096+00
acdbeb8d-fbc8-44a1-baf2-b5dd44f0a8aa	Media Relations	media-relations	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.601861+00
295d1555-90e7-48ef-ad9b-423df15bf450	Crisis Communications	crisis-communications	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.602162+00
4ce7dfab-7236-4de6-a3e7-131cdab6f83d	Event Marketing	event-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.602403+00
2db1933c-a6a9-4286-93a0-50ad6a1ff425	Podcast Marketing	podcast-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.602665+00
a47732db-1b2b-4ec4-b11e-581cbc894442	Affiliate Marketing	affiliate-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:52:36.602933+00
31b5b086-a5fd-4117-a877-e0a391066c90	Business Plan Writing	business-plan-writing	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.603672+00
40324a2d-6527-40b7-bd39-5ac06801adf1	Business Strategy	business-strategy	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.603928+00
18817cad-9d4d-4275-b6bc-e9a07fa9b8c1	Business Analysis	business-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.604174+00
e7088bb2-a619-425e-a808-3e1dc0866aa6	Project Management	project-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.60442+00
24fdc4f8-62a9-4a5b-8132-9048a832b40e	Product Management	product-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.604706+00
6a05a9e7-66e7-43bb-b48e-1d41d47c983c	Operations Management	operations-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.604932+00
47522139-6fbc-4e1e-b05b-d7abe3880cf9	Change Management	change-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.605322+00
0091b925-b58f-430e-ae8a-e5ad7b6e0cdb	Risk Management	risk-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.605764+00
a0a8c319-1b38-4a56-9efc-77b35f322740	Supply Chain Management	supply-chain-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.605996+00
927fb449-734c-4cbb-8701-225d50cc636d	Lean Six Sigma	lean-six-sigma	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.606257+00
394e9115-e35e-4bc3-bb25-f9aa207d1518	Process Improvement	process-improvement	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.606491+00
f92cc7c8-a57a-4c4b-af33-bcb19669c1b0	Strategic Planning	strategic-planning	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.606712+00
cf63be94-8157-4808-9e89-4cd9c9d315db	Financial Analysis	financial-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.606926+00
ec939079-601e-4a82-bb69-e4819c3a7a1d	Financial Modeling	financial-modeling	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.607153+00
73928753-edeb-4ae6-ad6a-4d6cae337e9c	Bookkeeping	bookkeeping	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.607375+00
dcfc7bd4-3809-4d7a-9f69-b37c73abf7ae	Accounting	accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.607597+00
6cce5dd1-3fd1-4265-bb7b-67ae33f98ae3	QuickBooks	quickbooks	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.60781+00
981d7c31-f67d-4ff1-9353-f85df66c0e2e	Xero	xero	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.608033+00
ef5f6e53-2768-4b95-a337-1598b79b9ace	FreshBooks	freshbooks	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.608257+00
a0c3feac-9001-451f-900a-3ddcb50ca7aa	Tax Preparation	tax-preparation	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.608468+00
0f7668af-e305-4a39-bf29-1b2b60228093	Budgeting	budgeting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.608695+00
47dc7e80-ead7-48e0-9d0f-2b655f9d91f0	Cash Flow Management	cash-flow-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.608943+00
04f56e9d-c213-41cf-802a-e98226df0c4e	Payroll	payroll	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.609159+00
d5103821-d7a3-4296-ad45-c69912ce0a9b	Financial Forecasting	financial-forecasting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.609386+00
119a9321-cf1a-44e9-b803-35404847cf03	Investment Analysis	investment-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.610009+00
1163762e-5b38-4d9e-8cab-eaed44ab609e	Cryptocurrency	cryptocurrency	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.610237+00
23ebecf2-8f07-416c-8d4b-1b37ca8d6f7e	Management Consulting	management-consulting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.610465+00
ec8f005b-3b8d-4f21-bf73-baeb04a83a38	IT Consulting	it-consulting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.610696+00
2e42e27a-2806-4c11-a74f-ad82cbdc3501	HR Consulting	hr-consulting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.610955+00
c183ad69-8e79-4aea-8690-3f11b7cfc508	Startup Consulting	startup-consulting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.611335+00
59bf080a-7b71-47aa-ae0a-4ef1f89d7419	Fundraising	fundraising	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.61174+00
a1ac255a-e445-433b-a2ba-639717a00a71	Pitch Deck Creation	pitch-deck-creation	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.612112+00
fae21717-8ab1-451f-8d9b-dd47cbebad0d	Investor Relations	investor-relations	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.612431+00
2e6e5d25-a846-4a2b-b1a6-5c43b3394130	Due Diligence	due-diligence	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.612673+00
3a65a953-eeee-4ccc-9bbf-06828f9d54d2	Mergers & Acquisitions	mergers-acquisitions	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.612901+00
311d0b07-3b93-4eb0-a084-7bdd09e25819	Contract Drafting	contract-drafting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.613198+00
672adb1d-3856-4169-87c6-1c1580e2b581	Legal Research	legal-research	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.613496+00
b22e4851-4fac-42ef-9604-547db97365da	Compliance	compliance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.613727+00
3e766d77-b051-4ffd-b579-5a0122b5d8ad	GDPR Compliance	gdpr-compliance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.613938+00
be48a079-9274-4fe7-a71a-ea194abf3b94	Intellectual Property	intellectual-property	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.614162+00
c5a56504-8713-4c3e-9eb1-a1620f2a8ddb	Privacy Policy	privacy-policy	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.614369+00
0d7c2bca-05bc-401d-9612-a2ee58cff6cb	Terms of Service	terms-of-service	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.614593+00
66275f1c-f903-48f3-b4fd-08e12d676aff	Data Analysis	data-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.614823+00
f6c12fcf-c2f7-4805-a4d4-9c11847a3b86	Excel	excel	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.615058+00
743783c7-86ec-4c1a-9bc3-497d7e8013d9	Google Sheets	google-sheets	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.615286+00
173fe466-97ae-4a7d-b005-a36d66653220	Power BI	power-bi	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.615522+00
3dd6b370-3c16-4711-a164-87993807c67c	Tableau	tableau	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.616176+00
8bfc8f83-b014-4a33-9f82-9e523636e335	SQL	sql	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.616431+00
54195a9a-4d2b-4e42-a859-9fca12924cd4	Business Intelligence	business-intelligence	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.616651+00
f0ec72e3-54cb-40e0-8218-7c16fb84d21c	KPI Development	kpi-development	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.616866+00
0a7ea643-3cd7-4312-857b-90af2014a71d	Reporting	reporting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:52:36.617076+00
0d24ca0d-c27e-43c2-b9d2-d22a79b51b24	Civil Engineering	civil-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.617318+00
f9d01c5b-1603-4185-873c-1afc6efc1edd	Structural Engineering	structural-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.617529+00
d451d3d8-d115-428b-ad7f-9c4c852de2ff	Structural Analysis	structural-analysis	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.617748+00
a498eba4-d04e-4f8c-aca3-64a0bede7013	Foundation Design	foundation-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.61797+00
764c5c55-1d83-4617-927d-73a9abf67ea5	Bridge Engineering	bridge-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.618189+00
f42603b6-b950-4a2e-a65a-e23909b965a6	Geotechnical Engineering	geotechnical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.618414+00
49d11cca-d5d8-4dca-94d2-29b8b3727eb8	Surveying	surveying	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.61865+00
dd575110-128d-4130-9c2f-daaa9eed411b	Land Surveying	land-surveying	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.61888+00
76984167-d564-4556-8e53-5bbc05f3e9a9	Soil Testing	soil-testing	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.619096+00
380420aa-a25e-407c-8bb6-f8f15dd30b10	Architectural Design	architectural-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.619304+00
c46e0c57-d065-48ce-ac32-8c3c0ec693f6	Building Design	building-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.619536+00
b5b91724-e8f2-4db0-adc5-4d5fd661ee25	Interior Architecture	interior-architecture	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.619754+00
63e02255-e9bc-4c63-b00b-dac53323bed8	Landscape Architecture	landscape-architecture	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.620001+00
cfd7d170-4b4e-4518-a554-9f51d1697d39	Urban Planning	urban-planning	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.620224+00
aea38c0a-717a-4c27-ad30-48b6516619be	Sustainable Design	sustainable-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.620437+00
b201acbb-ebb2-4223-9b0c-bcdd5550c69e	Green Building	green-building	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.620678+00
f9ad2cf3-0e83-4933-8cbf-bbe153ae3e66	LEED Certification	leed-certification	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.621439+00
bc716e53-55e2-4469-b1f7-fcdb2ca43634	Building Codes	building-codes	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.621741+00
f60f0be8-76d7-4252-b212-999eee4948e6	Space Planning	space-planning	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.621978+00
b65d004b-0cf6-4d58-b312-b808f069f457	Residential Architecture	residential-architecture	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.62219+00
551388dc-c2f2-4384-ad5e-5f83b8cb0757	Commercial Architecture	commercial-architecture	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.622409+00
3764a7f5-dd60-4534-856d-c13862d9a504	AutoCAD	autocad	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.622759+00
4541fdc0-b2ef-4c50-a318-588af7972e9e	Revit	revit	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.622999+00
10645c67-3836-4093-a256-607b8544fbfd	SketchUp	sketchup	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.623216+00
e72eacde-f991-43ba-a6bb-9705ef3fde55	Rhino	rhino	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.62344+00
49847d52-17c4-464d-b8e8-b48f54c3e931	Grasshopper	grasshopper	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.623679+00
7fb83293-3bd3-41a1-92a4-2736fe049545	SolidWorks	solidworks	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.623921+00
15e1009d-eef6-40ac-b3a2-1d23e30b7a8a	CATIA	catia	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.624167+00
aab87c51-4620-4aa3-8759-6b6d180e9957	Fusion 360	fusion-360	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.624403+00
c3dbb6fd-1b22-416c-9be1-269f00aba757	BIM (Building Information Modeling)	bim-building-information-modeling	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.624641+00
60d81357-8684-4ce8-98ad-d2014efa3874	ArchiCAD	archicad	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.625906+00
182812cd-6a70-47bb-8467-6187c7f62b70	3D Printing Design	3d-printing-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.626172+00
9a6c726d-a1ec-47f5-be5e-29a5d6b95319	CAD Drafting	cad-drafting	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.626408+00
bfe29077-6a7b-456c-861a-e9ecb62ebcc3	Technical Drawing	technical-drawing	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.627906+00
c4711e70-3882-4c30-8291-c12b494b63af	Mechanical Engineering	mechanical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.62814+00
1605ac14-f108-4a7e-9631-9267911c9260	Electrical Engineering	electrical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.628356+00
593a8a2f-c066-46e9-946a-299fc0d6afe7	HVAC Design	hvac-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.628574+00
8727974d-dd9d-4ed2-870d-a82ee41578a1	Plumbing Design	plumbing-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.628957+00
689caff2-8242-4361-b334-a61a6adcdd37	Piping Design	piping-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.629197+00
9281ae89-bf16-44b7-b8e9-1f299d338fe0	Power Systems	power-systems	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.629428+00
b80f54c2-0867-4205-b547-716d48d2a0d6	Control Systems	control-systems	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.629655+00
a1b171cd-7809-42d6-b3a2-33c501f6be78	Embedded Systems	embedded-systems	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.629874+00
dd151c07-cf3d-4dd0-8524-c3b385561249	PCB Design	pcb-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.630083+00
8c30b8f3-b83f-4581-8788-3a39143e66db	Circuit Design	circuit-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.630296+00
552eacd4-69a6-4cbd-b5ef-af87d833e7a9	PLC Programming	plc-programming	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.630521+00
df6a8797-c820-445b-99bc-ce1387f45833	Robotics	robotics	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.630746+00
c119ceea-879a-46f9-ae2d-8feab85b334c	IoT Development	iot-development	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.631119+00
7c60fbe9-f7ae-40a9-8101-8980d6b8f411	Arduino	arduino	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.631438+00
aa564833-af82-481f-b9b6-85610e5721e4	Raspberry Pi	raspberry-pi	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.63169+00
797e24bc-4c1b-453f-acaf-9c4a729a1657	Machine Learning	machine-learning	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.631918+00
f452991e-6bad-4db7-b17f-7d12ffbc604e	Deep Learning	deep-learning	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.632148+00
783f39e9-deaf-4865-99b8-368fcf54c4b2	Natural Language Processing	natural-language-processing	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.632383+00
680476ae-b9d2-4437-896f-70369f8d1baa	Computer Vision	computer-vision	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.632685+00
00f71c2e-54ee-4848-b71f-cb00f38f31e5	TensorFlow	tensorflow	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.632942+00
dd9c437e-d45b-4816-8812-7439f07a75c5	PyTorch	pytorch	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.633207+00
51046890-a295-493f-b9d6-f76d95bf0dde	Data Science	data-science	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.633455+00
f798ee2a-2562-4097-96e1-38b43ad30bf6	Prompt Engineering	prompt-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.633699+00
afb29203-12a2-4e6c-b83d-953466af4724	LLM Fine-Tuning	llm-fine-tuning	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.633941+00
f32c5df6-cc99-42cf-9944-085ca04e2eb6	OpenAI API	openai-api	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.634168+00
e326aff9-96ce-48aa-ad86-5ca969a79d51	Statistical Analysis	statistical-analysis	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.634802+00
8fb543f0-4cc7-4462-8cb8-381acce1468f	Predictive Modeling	predictive-modeling	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.63504+00
036571e3-edd3-422e-be12-4f58d45fa6e5	Data Engineering	data-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.635265+00
c989bc2f-ff77-4a0a-bd22-35b9b212373d	ETL Pipelines	etl-pipelines	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.6355+00
024c8e5d-68ab-422a-98fd-ad446dd0cac3	Data Visualization	data-visualization	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.635824+00
3a36a264-4d93-4dab-bf93-73e8dd814bed	Python for Data Science	python-for-data-science	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.636058+00
ddae43c6-97a6-4cdf-a69c-6df879fc8881	R Programming	r-programming	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.636289+00
b2b66449-bd4c-4a89-9ef4-b2f10f76f5bc	MATLAB	matlab	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.636569+00
c59dc0ea-32ca-4597-8881-be69dc8fcfc4	Environmental Engineering	environmental-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.636803+00
d95aabfe-73ff-4b9d-ae08-859830c0e498	Chemical Engineering	chemical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.637027+00
8fbea1df-78ac-4a5c-97bd-e70197ea3ef8	Industrial Engineering	industrial-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.637255+00
9af6c0df-f203-4405-91ea-00349776ea04	Manufacturing Engineering	manufacturing-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.637512+00
4bf0f23d-4c10-4984-94c4-f52e11aedd4a	Quality Engineering	quality-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.637752+00
61051200-82fd-459c-98b8-364d4d59ebe4	Safety Engineering	safety-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.63798+00
9cf33a9b-fd81-4fea-8c40-2504a57fe28e	Project Engineering	project-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.638216+00
b383648c-3c6f-40bf-9f8c-fccff906900a	Finite Element Analysis	finite-element-analysis	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.63844+00
e7cf7dde-5bc9-4fc2-a3b1-28f6814cae38	CFD Analysis	cfd-analysis	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.638653+00
6aa60ee6-b779-4b48-8572-bfdee3ca958c	GIS	gis	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.63889+00
e16f5564-3b4c-4ddb-a7c6-16fb4b65460d	Remote Sensing	remote-sensing	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:52:36.639176+00
e943a7d7-6c2d-44af-8c3e-96c9655b001d	Virtual Assistance	virtual-assistance	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.639412+00
acb4610e-edeb-4893-a8ea-877f53e802cb	Executive Assistance	executive-assistance	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.639627+00
0e0e29c4-464d-437a-b171-c48f77d729db	Calendar Management	calendar-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.640658+00
dbe5131e-1ac1-48fb-8194-97de03842443	Email Management	email-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.640911+00
c0e35344-3e5b-4107-b3a6-d7daf21e3ac2	Travel Planning	travel-planning	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.641325+00
139612b4-dfc3-4ac7-a491-6597ee1b8bc5	Meeting Coordination	meeting-coordination	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.64159+00
a40bc9da-ad26-4341-8127-be76ad3080ce	Task Management	task-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.64184+00
5aa3cc46-a97b-400d-8afd-d8f2978bf481	Personal Assistance	personal-assistance	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.642063+00
fec18a2b-9afa-48b9-a2d7-1fb73039b587	Administrative Support	administrative-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.642286+00
aa5d0028-18ed-488f-8b62-a0aae8393a15	Data Entry	data-entry	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.642514+00
e023d3ab-1bbb-487f-bce7-2fe13bd510a3	Data Processing	data-processing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.642759+00
d30d707b-7601-47b5-9ac5-db31b2104944	Data Mining	data-mining	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.643006+00
366a0105-a89e-4633-bcc4-f0fbf85d72bf	Web Research	web-research	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.643252+00
56793980-9ea0-4042-9e02-a0b904e07f83	Lead List Building	lead-list-building	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.643501+00
c584822c-8ada-45c7-869e-2a2f695a17c8	Database Management	database-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.643733+00
d0411106-6c0e-4246-849c-9887322cd752	Spreadsheet Management	spreadsheet-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.643961+00
cd4b05ec-feb2-49da-a50b-b4bc8c91f7b4	PDF Conversion	pdf-conversion	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.644222+00
a7259290-d3bb-4970-b627-8d26130ff6e5	OCR Processing	ocr-processing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.644453+00
140f446a-b938-4e21-aaca-8a8d8df75162	Form Filling	form-filling	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.64476+00
37e83836-45a7-400c-a7e7-22147370bfe0	Customer Service	customer-service	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.644993+00
14f2fa73-2448-4acf-a527-5f44f33acecf	Live Chat Support	live-chat-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.645211+00
2f60034c-cd95-4274-ba6a-b4e4dce057eb	Phone Support	phone-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.645429+00
68149a91-4f6a-477a-a867-d75be30348c1	Help Desk	help-desk	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.645661+00
ec79c7c7-490b-4e70-a237-72f68882912e	Zendesk	zendesk	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.646235+00
fd5a4bc5-f266-4ef4-a431-9707bf0e51a2	Intercom	intercom	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.646785+00
bc4d2580-0603-4499-805e-9bd8ea485e0c	Freshdesk	freshdesk	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.647869+00
6a568984-f028-4995-9cc2-b91401cbf6ed	Ticket Management	ticket-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.648103+00
f2ed50ce-ff4f-46e0-9fe3-d1a0ba292354	Technical Support	technical-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.648315+00
cc08ec6b-f6ff-45b2-a240-6c395fa01588	Customer Success	customer-success	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.648529+00
1737e0b9-c92c-4fa3-afc7-cf69f15973c6	Customer Onboarding	customer-onboarding	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.648747+00
4bf63558-415d-4aa8-833d-68ba19116dd7	Knowledge Base Management	knowledge-base-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.648971+00
8da0114b-c0d6-4a4e-bdaa-65eb9747a853	Microsoft Office	microsoft-office	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.649195+00
141f53fe-344c-49a2-991c-443996930441	Google Workspace	google-workspace	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.649428+00
eba46a66-08c1-4ba4-88df-383dd3345dec	Notion	notion	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.64966+00
e17383d5-c2db-48e9-80ed-af0675870d2b	Asana	asana	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.649904+00
0c4829b3-4ce6-48c5-ae20-1850968de9e7	Trello	trello	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.650162+00
68eb0d55-ba33-4705-aa3f-6da854935765	Monday.com	monday-com	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.650382+00
cd9a0de5-f00c-411d-ac3a-40c9f436a36a	ClickUp	clickup	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.650598+00
530cf2fa-c598-4c85-94d8-ac9e559a5285	Jira	jira	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.650843+00
025a9df4-8062-46af-a1ca-d88593df99f8	Slack Administration	slack-administration	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.651181+00
fbfdd76b-83d6-4226-85da-77d208f0d9b4	Document Formatting	document-formatting	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.651525+00
b3382667-c04d-4dc0-80d4-26106a8fb33e	Presentation Design	presentation-design	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.651834+00
785613ed-ae5e-4374-b34a-a0291172f061	PowerPoint	powerpoint	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.652071+00
2c352b6b-d52f-41b1-a7c5-4663930b191f	Google Slides	google-slides	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.652293+00
cd3895fd-7522-42d7-beb4-99450ae8c0f8	Keynote	keynote	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.652587+00
1dfa65a5-edfe-4275-a8d9-f549b46f7215	Recruiting	recruiting	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.652851+00
74f970f0-4246-4de3-976e-fbcbfe49d464	Resume Screening	resume-screening	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.653812+00
5f827ca3-f929-40e6-96ee-8f187ce74e18	Interview Scheduling	interview-scheduling	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.654047+00
10b5691d-1b82-43f9-8863-201ce838dbed	Employee Onboarding	employee-onboarding	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.654294+00
210d1526-d29e-4595-abf1-b49e449e1ae1	Payroll Processing	payroll-processing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.654552+00
bd3b23de-cf24-4e07-a49c-f60d2b8fe6ce	HR Administration	hr-administration	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.654797+00
500587b5-3c52-4439-846c-e2ea2df4c1f8	Video Production	video-production	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.655045+00
645b2054-2cc1-4bca-a930-b659c8c9c285	YouTube Video Editing	youtube-video-editing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.655453+00
d035b78d-c624-4bf7-8df0-4d1c7062228d	Podcast Production	podcast-production	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.655689+00
00558b38-3881-4d3a-a1e1-d795713f7e8b	Voice-Over	voice-over	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.655913+00
3fc46292-f669-468c-b89f-559a8e709a7a	Audio Editing	audio-editing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:52:36.656143+00
c47045e9-42f6-4e69-901c-53c3ef5f5637	Corporate Law	corporate-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.656422+00
9fb0b626-bb7f-4adb-93f8-4c42db855f33	Business Law	business-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.656678+00
b53e19c4-90f4-468b-814f-54afbb9268ce	Commercial Law	commercial-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.656898+00
a53b60bd-b4d1-43de-8676-8faea6abd728	Contract Law	contract-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.657113+00
c81d9437-adaf-457e-9b11-94bee2818665	Contract Review	contract-review	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.65733+00
41822d89-dbf2-4ac5-8985-5cfedea98318	Company Formation	company-formation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.65769+00
c304dc9c-d475-4aa4-8b94-7c31a01163f0	Corporate Governance	corporate-governance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.657918+00
1d054279-22b0-4aaa-aee1-d8e9c0a95712	Shareholder Agreements	shareholder-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.658138+00
a5611721-b48c-4867-b408-f267f6881f55	Partnership Agreements	partnership-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.658365+00
9c555c65-5600-44b7-9149-4d53933f673e	Non-Disclosure Agreements	non-disclosure-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.658816+00
41cf0f56-d822-4780-bf3a-d1a38dd4f461	Privacy Policies	privacy-policies	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.660069+00
69e3a7bc-7be6-4aa8-b138-3de4a0dc631a	End-User License Agreements	end-user-license-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.661118+00
592d0258-b416-443e-85fb-701c21496f1e	Intellectual Property Law	intellectual-property-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.661501+00
157c52b7-7ea5-45d0-8604-6b266ee1791e	Patent Law	patent-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.661882+00
5aad1894-459b-42fa-a78b-d29e6708242d	Patent Filing	patent-filing	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.662125+00
db2a4a2e-a08e-4d1d-8c77-b53619a51bb9	Trademark Registration	trademark-registration	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.662347+00
bded7dfb-2396-45f9-8b1d-cf01b862e2a5	Trademark Search	trademark-search	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.662635+00
acd5ecf6-940c-4da6-bd4e-f78a1651ac51	Copyright Law	copyright-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.66288+00
d5e1e659-3f95-4da7-a3eb-d58f80f72ea3	Trade Secret Protection	trade-secret-protection	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.6631+00
a9016951-a5a8-4527-88a5-c58ac217ee4b	IP Strategy	ip-strategy	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.663324+00
cec20a18-2536-4ce3-af40-c00cb8ca2807	IP Licensing	ip-licensing	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.663566+00
bc16f13a-7e26-4fbb-8596-2260b8580a31	Technology Law	technology-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.663847+00
8bba2196-7788-44b8-be03-6b5620dd36df	Data Privacy Law	data-privacy-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.664054+00
59b808c4-52d4-4b84-b607-10f6ea9801db	CCPA Compliance	ccpa-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.664415+00
0c4b8f31-c258-4e94-8173-f6ff57c61fbf	Cybersecurity Law	cybersecurity-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.664647+00
cfb14506-da61-4cf6-8bb0-083b30d4b1c5	Internet Law	internet-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.664888+00
f8d738af-957d-4f74-b332-1d81b74edf1d	Software Licensing	software-licensing	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.665135+00
910cd0f9-1d79-473c-917e-0c7f83b294bb	SaaS Agreements	saas-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.665381+00
1fffc1ba-c5a0-4e4c-800b-cd99ae963531	Open Source Licensing	open-source-licensing	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.665626+00
fa535834-f08c-405a-90b6-b82da5dffd2c	AI Regulation	ai-regulation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.665851+00
383275ca-bde4-4b1c-b92d-7b60861542aa	Blockchain Legal	blockchain-legal	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.666083+00
87cd7bf3-c017-4884-866c-70eefb959481	Employment Law	employment-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.666314+00
3b2be8b2-4c9c-4734-8eda-83330172152c	Labor Law	labor-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.666705+00
1ff6ad79-00e3-4ae5-babf-3569701cf27c	Employee Contracts	employee-contracts	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.666917+00
952e24a6-7c50-4745-bc74-ed5c868b3c5c	Non-Compete Agreements	non-compete-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.667141+00
d81c2c09-6d63-49bb-939e-c1f0b9e1d898	Immigration Law	immigration-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.667356+00
e6456fe3-10fe-4555-80e2-0001aa03b5a7	Work Permits	work-permits	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.667569+00
30b08c32-905d-4eaa-8fe3-51140b9b89b2	Visa Applications	visa-applications	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.667788+00
30b07596-874b-408a-a843-8773a6941558	Independent Contractor Agreements	independent-contractor-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.667997+00
c32e93ad-2bfc-4a6a-8518-e9c3e9be95ec	Regulatory Compliance	regulatory-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.668214+00
58b93398-14a1-42c9-b9fd-8c900564a5be	Securities Law	securities-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.668427+00
f1186bc7-984b-46ff-995b-b2fece8dc34e	Tax Law	tax-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.66865+00
e32feaaa-93bd-470c-bc70-355615d4a305	International Trade Law	international-trade-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.668908+00
b9ead340-521a-404d-bc80-6fb816ede7e1	Anti-Money Laundering	anti-money-laundering	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.669143+00
06f25bdc-8c8d-4d7e-a1cf-5a139d25b363	Know Your Customer	know-your-customer	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.669375+00
8bad85c1-e1d1-4de3-b2ac-eaf9e4e381c8	Financial Regulations	financial-regulations	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.669604+00
6e3da8de-e11a-4823-b17d-af626ca19385	Healthcare Compliance	healthcare-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.669818+00
56943985-20de-42a6-8a2f-2a8d6b8be96f	HIPAA Compliance	hipaa-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.670063+00
144e419b-c5c5-4fbc-9482-f034d5d6c65d	Environmental Law	environmental-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.670298+00
ce858984-5ad4-47c4-abef-6f64ca7f2ea6	Litigation Support	litigation-support	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.670511+00
6d9dd30b-d43b-4303-bc1d-8d3676980c53	Arbitration	arbitration	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.671093+00
a832e387-018f-452b-a431-30c4cf98f309	Mediation	mediation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.671726+00
452b1bd9-788e-4bb5-9c21-fcf8ae8c3221	Dispute Resolution	dispute-resolution	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.671968+00
e04bba0e-51b4-458f-bdb1-4a2edac321ec	E-Discovery	e-discovery	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.672204+00
2e301c93-683c-453d-9544-bd1dc506fc73	Legal Document Review	legal-document-review	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.67246+00
fa10e2bf-b6e1-4959-b671-2090480ceedc	Paralegal Services	paralegal-services	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.672734+00
1ddb1206-7ce7-48eb-92df-283b1c22c8e0	Real Estate Law	real-estate-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.672996+00
ca86d7b0-3b29-4bff-91ab-c3dec465f48d	Property Law	property-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.673237+00
a5eb2b7f-4642-45e3-93a3-108dbe4a07cd	Lease Agreements	lease-agreements	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.673476+00
9498b5e0-6e19-4167-87e9-c30660984e03	Real Estate Transactions	real-estate-transactions	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.673715+00
2e193015-6b77-4b51-97d0-23906c94db0a	Zoning Law	zoning-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.673952+00
de4a87ce-5263-4a36-9285-27ebfcbc8649	Construction Law	construction-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:52:36.674191+00
42f5f67a-f959-40dd-a0cb-774a50307b58	Artificial Intelligence	artificial-intelligence	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.682919+00
3a3423ee-5046-4a6f-a3b8-6970aea63942	Machine Learning Engineering	machine-learning-engineering	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.683519+00
a9057ef1-649c-4043-9103-78edba15ba77	Deep Learning Frameworks	deep-learning-frameworks	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.68386+00
849c63c5-090e-4670-b404-b5958e813b2e	Computer Vision Applications	computer-vision-applications	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.684416+00
77d304e8-5ee4-43aa-b045-38690db3e0c6	Keras	keras	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.685111+00
c50d1283-e1fc-4ffd-a9b3-fa97ee25096f	scikit-learn	scikit-learn	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.685455+00
e38d2d39-62d3-44a6-9e6d-b418575bc593	Hugging Face Transformers	hugging-face-transformers	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.685861+00
6984377a-7d39-446d-8977-808d7d98c871	Claude API	claude-api	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.686361+00
f3b44400-bf38-40e8-9c4b-7897f714684d	LangChain	langchain	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.686635+00
cccb8fa4-64af-4aa9-b3a6-a675f73c7690	LlamaIndex	llamaindex	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.686894+00
68e518e0-58df-4b2c-a02b-5213b882d7c0	RAG Architecture	rag-architecture	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.687508+00
a63edbfb-14f7-4312-8c49-b7ef4f8f5595	ChatGPT Integration	chatgpt-integration	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.687782+00
0884f673-a628-4981-90bb-2f5cc3ad2451	AI Chatbot Development	ai-chatbot-development	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.688724+00
cd69f93e-ebbe-41d0-9f7b-7b0058ead81e	Conversational AI	conversational-ai	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.688946+00
0f4109c9-55de-49b9-bee9-ae94e0ae387c	Stable Diffusion	stable-diffusion	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.689168+00
8cb5a321-50b6-4a81-b2eb-cc170585691a	Midjourney	midjourney	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.689391+00
d1f9794e-70c9-40b2-9329-9810e621d050	DALL-E Integration	dall-e-integration	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.689612+00
b515c5ec-492a-446b-9211-978f2761df56	Vector Databases	vector-databases	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.689831+00
b9c85980-bfc4-4958-a1b8-137bfb6ee643	Pinecone	pinecone	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.69007+00
631df9c0-b052-4789-80e1-56d8b47fad2f	Weaviate	weaviate	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.690319+00
3ca29dd4-646c-4e20-b735-9bf09d2c835a	ChromaDB	chromadb	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.690587+00
8e6d20d5-ad9c-4645-af23-12c8917fc3be	MLOps	mlops	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.690845+00
b787ac08-ebb4-4b24-8947-7d4c810bb686	Model Deployment	model-deployment	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.691078+00
f705b797-afab-4ee2-ba9d-f44ad963eb38	Model Training	model-training	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.691341+00
49e2589c-97c5-4fb5-89b2-651c5bb62fde	Reinforcement Learning	reinforcement-learning	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.691583+00
c9a29d4a-d33e-453d-93b9-f9b42d471e70	Generative AI	generative-ai	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.691804+00
b2645153-170c-42a4-b907-68f1cfdd30fc	AI Agents	ai-agents	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.692026+00
ce89d0cf-7c68-4e2b-9c4c-e325b6c2d6b5	Speech Recognition	speech-recognition	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.692349+00
6b6f9718-03c9-4bf6-90c4-83fae5e6c255	Text-to-Speech	text-to-speech	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.692597+00
44bf584f-5848-46d6-82f2-f498b7ff5dd7	Sentiment Analysis	sentiment-analysis	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.692829+00
3defd655-28ae-4a69-9f22-04bf16ae3ef1	Recommendation Systems	recommendation-systems	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.693058+00
2fb3f25a-f251-4471-b772-5e2242207620	Anomaly Detection	anomaly-detection	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.693278+00
57a3a528-5f35-4fa3-a8e6-a04419587c51	Jupyter Notebooks	jupyter-notebooks	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.693503+00
f10b5f30-440e-4d94-a902-63ec1447f0b5	Pandas	pandas	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.693744+00
05d7f9db-9a2b-40a8-a4c7-f0d49f777523	NumPy	numpy	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.693974+00
cacc97e8-8aa6-41a6-938a-f0e320539c20	SciPy	scipy	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.694255+00
26e1806c-e024-4427-ae26-d6a72333e949	Data Pipelines	data-pipelines	88115571-e2ba-40df-9bf2-b83184d7e5c6	\N	\N	\N	t	0	2026-02-14 03:53:03.694978+00
3901ab03-0af4-463c-a971-9bb14b2b9aa5	AR Design	ar-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.492419+00
010544c3-29e2-41c2-8747-f4068e382382	VR Design	vr-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.493849+00
8f97784b-2336-4545-b737-3e370580991a	Spatial Design	spatial-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.494352+00
00c274dc-d3df-4ae8-bbe1-9ba76c72beee	Unity for Design	unity-for-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.495403+00
49d6cdac-8d39-4db4-a385-d0294cd2f476	Unreal Engine for Design	unreal-engine-for-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.495673+00
e7a0f3b2-4c8b-42c9-805e-8074f1620912	Mixed Reality	mixed-reality	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.495915+00
72299bea-c92d-4a6d-8387-f5657178a80f	Meta Spark	meta-spark	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.496206+00
d7a4ac2f-6e26-4176-bfbc-152b75a1c79c	Lens Studio	lens-studio	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.496471+00
ebc0c134-7703-469a-ad97-fae32d4a1613	Game Design	game-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.496738+00
f2aaf0b1-9543-4bda-86f4-7ffb0f191758	Game UI Design	game-ui-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.497258+00
623b99bc-06dc-4a0b-bc1c-75a1d14b7d28	Level Design	level-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.497515+00
a86f6409-dbf0-4a6c-ab01-23c24a39f1c9	Tilemap Design	tilemap-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.497745+00
e2d47270-afde-45da-80af-49f11fe69d4b	Sprite Animation	sprite-animation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.497983+00
f1698882-b923-449b-ad63-04a5ce9c1770	Texture Design	texture-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.498214+00
daca8d6e-e6fa-443a-a8f0-2d16a5f3ee96	Material Design	material-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.498459+00
2675c5e2-1c94-471b-a244-0ede1cb40692	Social Media Graphics	social-media-graphics	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.49875+00
8bd2fd49-3634-42af-822f-f27d3c2d51fb	YouTube Thumbnails	youtube-thumbnails	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.498997+00
9d21e0b0-959d-4018-a817-58ec37ae0f50	Instagram Story Design	instagram-story-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.499242+00
28bf12d2-fbe9-4c4c-93e0-ceab0f2efa03	TikTok Content Design	tiktok-content-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.499496+00
205aa602-6ef7-4bf7-affd-4b6fdb0beea7	Pinterest Graphics	pinterest-graphics	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.499726+00
f4af219d-fce9-49a8-af75-55879aaacf19	Twitch Graphics	twitch-graphics	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.499986+00
f2a3158a-d356-449a-90d1-47e7e591484b	Email Template Design	email-template-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.500208+00
55be14cf-5ee9-4575-8345-f9165bcad467	Newsletter Design	newsletter-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.500425+00
454244e4-3b31-447b-a65a-0c1876400615	Ad Creative Design	ad-creative-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.500652+00
57bd89b7-956c-4609-ac62-ff1addb4d5e8	Pitch Deck Design	pitch-deck-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.500889+00
eadf7d2f-740a-4b14-bb50-11ace3e657d4	Report Design	report-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.501191+00
17bcca6c-175f-4d3e-9025-25e621999b1c	Resume Design	resume-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.501435+00
5e0c9508-ed47-401d-867f-57ef63b8584a	Menu Design	menu-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.50166+00
9ada2adc-4fef-42cd-b15d-1154308a7b32	Invitation Design	invitation-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.501904+00
adff01f4-1596-4307-bca2-b1a8877ab41c	Calendar Design	calendar-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.502136+00
14381277-8cdc-475b-a41f-ae86ac6ff854	Book Cover Design	book-cover-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.502399+00
36d184da-18f0-4deb-b606-220f233b08df	Album Cover Design	album-cover-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.502667+00
b94cf3b0-96c1-4e5a-9443-e5f89a6d3667	Pattern Design	pattern-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.502962+00
2c039e25-791f-4be7-b93a-083577c76c64	Surface Design	surface-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.503199+00
bec3082e-06a8-4f16-814a-c16206462cfa	Textile Design	textile-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.503445+00
0cad5580-5fe2-4387-b79d-454898f52e6b	Color Theory	color-theory	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.503668+00
a9b46560-5a2b-49fb-9299-dc64740d7c06	Layout Design	layout-design	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.503901+00
9366e834-59c5-467f-822d-5eff3c0fb375	Creative Direction	creative-direction	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.504445+00
bf7a6970-5626-4f7b-8f28-768b57700e8d	Art Direction	art-direction	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.504719+00
1f2bfb63-51ca-4d92-bbd5-7d28989e5f45	NFT Art	nft-art	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.506158+00
d68b847e-24e1-453c-95f5-6e8d77859d27	AI Art Generation	ai-art-generation	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.506427+00
86c889a7-56d8-4927-af80-bc1b7ffd1369	Midjourney Artistry	midjourney-artistry	09c5dfc3-dffc-4a71-b4dc-e77da1984702	\N	\N	\N	t	0	2026-02-14 03:54:29.506674+00
c04e75ce-baab-4e5f-8b32-94c52788bf41	Dutch Translation	dutch-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.51815+00
9a51a76f-0d1e-44f2-953a-3bcfdb29b56e	Swedish Translation	swedish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.518492+00
8b60bbfa-6ad3-4926-9fa5-24b89818c8d6	Norwegian Translation	norwegian-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.518716+00
44650b17-454d-4993-8a91-a6f5f31fc194	Danish Translation	danish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.518932+00
f8b2a67c-69cd-404f-bac0-eaf25c63b597	Finnish Translation	finnish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.519156+00
ae6cd3dd-bdaa-404f-8a82-7d4b2d0a5c0a	Polish Translation	polish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.519392+00
6da71656-08d7-4c0f-80c2-edc4c6561daf	Czech Translation	czech-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.519624+00
cc537441-24af-4ec2-9185-0cadc71b48ae	Thai Translation	thai-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.519852+00
5ea0f0d8-4ee3-4b17-92a9-d0fc2c334dbe	Vietnamese Translation	vietnamese-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.520074+00
5b115891-6fd3-45be-955c-2ea572b2ce3e	Indonesian Translation	indonesian-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.520323+00
e682cc3e-608d-4bf4-8c94-5d91ccef8d5a	Turkish Translation	turkish-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.520543+00
6b4a1fa5-9d8e-4f3c-9cec-f6cb944d6d39	Greek Translation	greek-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.520783+00
802e055e-db89-45ad-8cda-3ff6f893ccce	Hebrew Translation	hebrew-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.521008+00
d7c3a417-fc37-48fe-ba0c-b09c45200feb	Ukrainian Translation	ukrainian-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.521247+00
c5dfe3b6-4a43-4bcf-ad0f-f85784c2b490	Swahili Translation	swahili-translation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.521482+00
2c20d90f-8af0-427d-b38f-efe1ba03e55a	UX Writing	ux-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.52172+00
a9b5d1d9-aa77-4b7d-b179-86fc883332bc	Microcopy	microcopy	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.521986+00
ee4cb9c5-28db-460b-96d6-61a625384ee5	Chatbot Scripts	chatbot-scripts	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.522232+00
d6fd22d2-6ac5-4e99-8aa1-30bf829f1a0d	App Store Descriptions	app-store-descriptions	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.522517+00
2bb82227-ce7c-4b60-b50d-cb369086324c	Social Media Captions	social-media-captions	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.522779+00
6d0a2fe6-28fc-45ae-886e-0b256eadfdbc	Tagline Writing	tagline-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.523036+00
6d041f38-378c-4fb3-ad1a-dd4eef6436c4	Slogan Writing	slogan-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.52327+00
6f621f72-d425-41fc-92ed-822d4aa57ae6	Resume Writing	resume-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.523494+00
8a772556-b31c-4741-8261-c3694cc649b8	Cover Letter Writing	cover-letter-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.523709+00
a44bd3f0-c5b0-4a3c-9766-6d12bab44a74	LinkedIn Profile Writing	linkedin-profile-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.523939+00
c460f736-1052-469e-bde7-d0c43a78bf16	RFP Responses	rfp-responses	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.524329+00
c8005e2a-e3dd-4919-a4f9-5c8a1bf9eba1	Business Correspondence	business-correspondence	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.524556+00
ea30cc2e-f2cf-4c4c-a567-6322f33be9f6	AI Content Editing	ai-content-editing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.52479+00
d9e88cbf-66ba-4ad7-bf3e-ce1e7b010582	AI Prompt Writing	ai-prompt-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.525022+00
bed4b4d6-8ebe-4f68-a339-c56897845c33	Jasper AI	jasper-ai	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.525249+00
bbbb9eb6-65ff-4ae3-be96-1551c34f6c29	GPT Content Creation	gpt-content-creation	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.525463+00
ed11bc16-b5c4-494d-ac98-1235b60f7e21	Video Scripts	video-scripts	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.525704+00
b9064277-0473-4666-b557-210d1bacc196	Podcast Scripts	podcast-scripts	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.525948+00
befa6b20-5b70-417b-881d-9adaac550afb	Webinar Scripts	webinar-scripts	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.526201+00
de316043-9f7c-4218-8634-c0b797e633c6	Tutorial Writing	tutorial-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.526579+00
4d393841-8b51-438d-8ced-ec1104c0ed42	Course Content Writing	course-content-writing	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.526971+00
ca90727e-ded9-442a-8830-43e940313680	Landing Page Copy	landing-page-copy	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.527255+00
717beb05-305f-43bf-acd9-4f1d04b0843b	Brand Voice Development	brand-voice-development	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.527662+00
1763dd57-bef3-43e1-803d-9aaa62e17dd0	Tone of Voice Guidelines	tone-of-voice-guidelines	651deb34-3e0c-4b62-84ad-b8d3156b2578	\N	\N	\N	t	0	2026-02-14 03:54:29.527903+00
61ca4168-5e46-458a-b867-bac98cf5092a	Mailchimp	mailchimp	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.538188+00
4aa3483a-acad-483a-8b4c-35df8f00f705	Klaviyo	klaviyo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.538539+00
267ef696-863c-406b-be2d-28a95612f2c5	ConvertKit	convertkit	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.538784+00
0be0f888-a7fd-4246-b428-061e733d2a16	ActiveCampaign	activecampaign	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.539038+00
9fecda09-82c0-4c60-ab5c-67be4dcbc93a	Brevo	brevo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.539289+00
95b5c3d8-e4d4-4224-9318-5e337024e1f4	Zapier	zapier	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.53953+00
3a7f50bf-0ea3-4d53-8c40-4a401dd46c03	Make (Integromat)	make-integromat	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.539767+00
82d62805-1ccd-4092-88e0-59dfb8de7b39	Segment	segment	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.540042+00
203bdcae-7c35-4d99-8695-7baabd5c4693	Mixpanel	mixpanel	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.540324+00
df9fe342-d44e-489b-b707-125dfabaed5f	Amplitude	amplitude	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.540549+00
7c08bd90-b198-4169-9a43-28f42913fce8	Hotjar	hotjar	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.541111+00
a044143a-87e0-450c-b026-aaa276a27001	Crazy Egg	crazy-egg	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.541435+00
34d72504-4a72-4287-8510-a93e0345151f	SEMrush	semrush	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.541654+00
ee36efd8-6b5e-4df7-9098-75ac58f94066	Ahrefs	ahrefs	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.54187+00
7745a283-c963-4342-aaf2-1b4a655b4af5	Moz	moz	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.542184+00
37df2cff-90b1-46a7-97dd-68e2dc5dc994	Google Search Console	google-search-console	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.542501+00
695a2e4b-45bf-4289-8a1f-493c7a95f16e	Google Tag Manager	google-tag-manager	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.542757+00
b88cbaa6-9ba2-4689-9113-1a5363eda77c	Google Data Studio	google-data-studio	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.543131+00
fc4066a8-98c4-49b5-b765-0187e7ce9fd7	Meta Business Suite	meta-business-suite	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.543375+00
ba13c505-aaf3-4ef7-802e-6d23cb85f37b	Meta Pixel	meta-pixel	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.54373+00
488eee6e-6f99-497e-af3d-725e3257cb58	Shopify Marketing	shopify-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.544014+00
0f2a1d27-d0df-4ae1-93f6-1c9f5039902f	Video Marketing	video-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.544269+00
a1dd1fc2-e96e-4ce7-83a6-22752bc1c0a6	Webinar Marketing	webinar-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.544574+00
34356ca8-0a8e-42d5-9aaa-886b7e537587	Live Event Marketing	live-event-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.544838+00
3322de4f-9139-435b-b260-7913159aa705	User-Generated Content	user-generated-content	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.545111+00
028d6c37-9187-4634-a064-296f726cb34d	Viral Marketing	viral-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.545392+00
f741ef07-585b-415b-b075-b424e0c9b834	Guerrilla Marketing	guerrilla-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.545688+00
be1125d6-8a03-4daf-bdc4-9b11400ff28a	Neuromarketing	neuromarketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.545971+00
3f3581af-65a7-414c-9885-c6a809f94f56	Customer Journey Mapping	customer-journey-mapping	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.546202+00
b54ebfc1-2632-484f-972d-cf0454fb4a63	Marketing Funnel Optimization	marketing-funnel-optimization	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.546452+00
5db37f1a-111c-41fc-8fcc-65ad9ae21fdf	Amazon Advertising	amazon-advertising	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.546721+00
bc3309dd-b66d-4269-853e-6c7db9850129	Amazon SEO	amazon-seo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.546959+00
29bd5c2c-bcfa-4282-8499-e87c450bee81	Shopify SEO	shopify-seo	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.547857+00
492af646-1f60-41a0-b904-2cb20c2849ae	WooCommerce Marketing	woocommerce-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.548137+00
0bdaac21-292c-4fed-a8a8-5ee68b286e26	Product Launch Strategy	product-launch-strategy	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.548563+00
51a63680-72c7-44dc-b6b1-ed7c74db4b08	Marketplace Optimization	marketplace-optimization	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.548843+00
77a3f717-9ace-433d-9867-cb16da904156	Dropshipping Marketing	dropshipping-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.549124+00
72860bc0-cb80-4c94-b176-0966be627141	Marketing Analytics	marketing-analytics	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.549396+00
78376f06-d595-4e64-afd6-dc20e131cdb6	Attribution Modeling	attribution-modeling	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.549695+00
99073d6e-c904-4122-be9a-5b0f50c6fea3	ROI Analysis	roi-analysis	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.549956+00
46ea0539-4930-41b4-85a9-6cbbac0e26fe	Customer Segmentation	customer-segmentation	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.550296+00
2bb6230b-ba9d-4e7a-80d4-7d81ba74d32d	Cohort Analysis	cohort-analysis	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.550544+00
7b1b42e6-205e-48b9-adde-e4b4bbc94a57	Predictive Marketing	predictive-marketing	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.550814+00
4d278419-03ea-4ae3-8251-b53621a2857f	Voice Search Optimization	voice-search-optimization	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.55107+00
ee42caca-eed6-4c60-aea8-53fb3b6c0af4	App Store Optimization	app-store-optimization	751de55b-b2f0-42ab-b512-0aff87e8bfd5	\N	\N	\N	t	0	2026-02-14 03:54:29.551369+00
c9a73d8f-96a0-43f8-a2fb-f3cd90d089b1	SAP	sap	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.561384+00
c2ed6a75-1c0d-496c-acc3-b1f5c934146d	Oracle ERP	oracle-erp	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.561678+00
2700b289-9435-4469-b68a-ec1299c58280	NetSuite	netsuite	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.561922+00
1f5778e4-6207-4d10-8737-054469e96eda	Odoo	odoo	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.562157+00
7d5ca0e9-a61b-418b-a2c8-8aaf82969ddd	Microsoft Dynamics	microsoft-dynamics	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.562391+00
757a2ec9-44f7-40ca-8b41-81c2c8a9ce2c	Sage Accounting	sage-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.56263+00
f1042b9b-d269-451e-bb63-35431101975f	Wave Accounting	wave-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.562866+00
9c4d662c-74cd-4e46-979a-fca672824d83	MYOB	myob	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.563105+00
5b103ede-61fc-4048-bdae-208241e5f571	Internal Audit	internal-audit	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.563435+00
b13e98fc-28f5-4617-875a-3f4cefabcf03	External Audit	external-audit	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.563733+00
0bceee73-fe01-4c59-983f-1cae50af9a5b	Forensic Accounting	forensic-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.564021+00
e7979a39-45c6-491a-b21c-c486ae8ac44d	SOX Compliance	sox-compliance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.564246+00
8c5f9ed7-6e15-429d-8ba7-268f9eb57548	IFRS	ifrs	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.564492+00
a529d5a5-ff58-4262-bf59-10623d6e7775	GAAP	gaap	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.564734+00
c8d78fa5-3cbc-4f1d-9400-baca59616a9d	Cost Accounting	cost-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.564952+00
81154009-968d-47c4-ba44-8b7ff0058736	Revenue Recognition	revenue-recognition	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.565168+00
ed9375a5-640a-4f6a-8e93-b5b831018208	Accounts Payable	accounts-payable	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.565409+00
8bc6807b-21e9-4a72-8ce7-33f858a9f478	Accounts Receivable	accounts-receivable	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.565653+00
57999f93-67d0-4aeb-912c-535188ae042f	Bank Reconciliation	bank-reconciliation	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.565892+00
4e0c4552-1d08-41f4-939c-864b6d6c7e49	Fixed Asset Management	fixed-asset-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.566128+00
1c31f67b-8ee5-447e-93a7-063c8bbe1145	Insurance	insurance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.566347+00
60bdbdf5-bedf-42e1-9b71-c16c3a3b3d7e	Insurance Underwriting	insurance-underwriting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.566578+00
327842e4-4a83-4369-a5ec-c45de5d48800	Claims Processing	claims-processing	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.566807+00
c135d42c-d5ce-47dc-a9c3-73cef8f48ace	Wealth Management	wealth-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.567034+00
94993201-4284-4aa7-9dee-4e8dc0d255da	Financial Advisory	financial-advisory	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.567262+00
8823c542-851c-40fd-b0ce-b4cc1082362d	Retirement Planning	retirement-planning	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.567492+00
bf124413-1687-4003-be13-f0f3f0fa681a	Estate Planning	estate-planning	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.567721+00
5b6156a4-6849-47f8-8e33-819d891880f7	Portfolio Management	portfolio-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.567963+00
10986e02-8c1d-42ba-bdce-cca845ee477a	Venture Capital	venture-capital	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.568182+00
e74e53c7-40ab-40bc-a23d-6b138e57fc9a	Private Equity	private-equity	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.568423+00
8a92a850-7ea6-4cc7-8e75-83daa471b38f	Real Estate Finance	real-estate-finance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.569278+00
2cd33356-e85c-45d0-99cd-fe490462a45c	Mortgage Analysis	mortgage-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.569511+00
9deaf1a6-7313-4f0f-af87-4747f43e5894	Fintech	fintech	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.569745+00
d1ad0cf4-cc18-4590-9ca0-300d062bc4ec	Payment Processing	payment-processing	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.569987+00
65c46d46-1f58-4b55-bf7e-95e11ed8e46b	Digital Banking	digital-banking	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.570226+00
f2100c6a-7c06-4b06-9d1f-940dc052606c	DeFi (Decentralized Finance)	defi-decentralized-finance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.570449+00
ed6299ff-cecc-4cc8-8e63-10c01d9c56cc	Tokenomics	tokenomics	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.57067+00
db6c020e-f5e2-4c45-adfd-7ff492c8c484	Financial APIs	financial-apis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.57089+00
41e73623-243e-462a-bdbe-4b1ec6bc03e7	Blockchain Finance	blockchain-finance	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.571116+00
4e631d49-62dd-4203-9ea7-19e81eb34cb6	Algorithmic Trading	algorithmic-trading	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.571348+00
1dd6f199-33e8-4ce2-aefb-c9bba83ece01	Quantitative Analysis	quantitative-analysis	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.571582+00
18592514-eea1-44a8-b122-0cba8c5d9a81	Grant Management	grant-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.571829+00
14a91370-882d-4ad4-89f8-6dd00189f7aa	Nonprofit Accounting	nonprofit-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.572059+00
40f8326d-c57d-48b7-81b6-c48754f09b08	Fund Accounting	fund-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.57229+00
d1a88ee4-18e6-474c-a562-1baf58488f3f	Government Accounting	government-accounting	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.572569+00
65cb5d0b-aa8f-49d8-b065-a9aaada004d0	Procurement	procurement	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.572848+00
beefdf50-3f26-422c-bd9f-62d6104d1a9d	Contract Management	contract-management	c0f14cb2-53b4-4d13-9851-b1dadb03eb84	\N	\N	\N	t	0	2026-02-14 03:54:29.573082+00
f7aa7e26-c249-4329-a14e-d44fbfc4b77f	Construction Management	construction-management	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.585508+00
206734c5-9d59-4314-99f4-6ebeb102aea6	Quantity Surveying	quantity-surveying	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.585832+00
b9178cbe-ebed-4645-879d-08c1194881fd	Cost Estimation	cost-estimation	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.586052+00
6074c11f-d850-431e-a79b-c07d224622b1	Project Scheduling	project-scheduling	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.58627+00
ee7a1018-8397-4bca-9e45-cb3f24586b99	Primavera P6	primavera-p6	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.586841+00
5e185ef8-9e1f-4fcb-b767-fefee465f3cd	Microsoft Project	microsoft-project	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.587073+00
33c4e9d3-29e4-4d14-b898-b0859d75a2da	Building Envelope Design	building-envelope-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.587288+00
6acb8eb2-0e55-4054-9776-cf1edf369c78	Fire Protection Engineering	fire-protection-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.587518+00
9f5a8895-9e26-4922-a952-581944f0bd28	Water Resources Engineering	water-resources-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.587739+00
90807d0a-9c77-47f7-8766-d15a4b9642ca	Transportation Engineering	transportation-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.587963+00
e5d88cb1-d678-483e-8ad6-3a1cf885605c	Aerospace Engineering	aerospace-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.588186+00
d8a1dc74-323a-4b34-a5d6-92ca0da99a7e	Automotive Engineering	automotive-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.588408+00
74462cfe-be56-44e2-9cc7-f19647d16e4e	Vehicle Design	vehicle-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.588639+00
cc2d080b-3cec-41de-b7a4-c51c6b97b443	Aerodynamics	aerodynamics	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.588888+00
533a46ce-e51d-41fa-a04d-87939a7a114c	Propulsion Systems	propulsion-systems	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.589146+00
852f368c-ee1c-4271-bacd-b1d7569fed5c	Composites Engineering	composites-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.589379+00
66ccb19d-eea8-4bfe-8495-afd921d24008	Solar Energy Design	solar-energy-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.589604+00
faf31a97-5a5f-4811-a437-be811b98ef3c	Wind Energy	wind-energy	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.589815+00
7eee6143-aa23-4635-86f0-9ce319ea05d1	Energy Efficiency	energy-efficiency	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.590042+00
e0a5bf8b-a3ac-41df-a3b5-f6ae2a89f4d8	Power Grid Design	power-grid-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.590263+00
ab9febea-2ff9-4877-9764-40e2b61bb866	Battery Engineering	battery-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.590488+00
ad5d6a73-8447-40f9-b162-bd9b3f01f32c	EV Charging Systems	ev-charging-systems	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.590707+00
003d33d9-c826-4744-b130-fdf77aa7979f	Nuclear Engineering	nuclear-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.590925+00
0bd0626c-5f9c-43a0-800a-ae3c539d2f6d	Petroleum Engineering	petroleum-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.59114+00
d390199d-9e67-49f5-b157-77644cd2d64b	Biomedical Engineering	biomedical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.591743+00
c5ced811-5682-4d15-9feb-e61ca2c0a011	Medical Device Design	medical-device-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.591982+00
14d5553c-7589-42a1-a1ef-98174ec37447	Prosthetics Design	prosthetics-design	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.592218+00
025bb36c-e984-49b3-aecb-9e2f3d823edb	Biomechanics	biomechanics	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.592448+00
8f60b8f7-4bb8-4e9c-9946-ecbf2648fef1	Clinical Engineering	clinical-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.592679+00
c2a0d991-e9cf-446c-adcf-96794b0a2cb6	Tissue Engineering	tissue-engineering	a2216ce1-d783-4236-a370-6efe87032aed	\N	\N	\N	t	0	2026-02-14 03:54:29.592917+00
8f670614-ab35-4fbf-b459-4b967648ffdc	Social Media Video	social-media-video	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.603059+00
ef1be193-f344-416c-aa5a-36e62c6c9a63	Explainer Videos	explainer-videos	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.603353+00
1d45cc0c-1f8c-4354-9517-ebbb1536b080	Promotional Videos	promotional-videos	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.603598+00
049b1f47-0dcb-4ee7-aa63-9bc56c8a25b2	Audio Production	audio-production	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.603816+00
e80a3e6c-f6b2-4fd5-bdfb-b464bef02667	Sound Design	sound-design	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.604041+00
0b03132a-5d6d-4173-8154-1666e08b8b5f	Music Production	music-production	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.604268+00
ed9718b4-6fad-4e24-9e6c-dad8aed6f0b4	Mixing & Mastering	mixing-mastering	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.604482+00
7e2d503d-c46f-46a0-8e87-fc90db24a258	Audio Transcription	audio-transcription	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.604693+00
eff4ca79-d06a-4d92-9ddc-e880db3f08a8	Narration	narration	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.604892+00
9a359fff-ca0c-4dca-8906-5dfcc24bd7de	Live Streaming	live-streaming	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.605114+00
ab848427-ff1c-43ea-ac0a-ed8c486a1d08	Webinar Management	webinar-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.605319+00
a4edac23-13fc-4ffb-9b88-a9fcab75ff75	OBS Studio	obs-studio	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.605511+00
0d2c67a3-7fcb-4eb5-b766-032adc6af9e7	Shopify Administration	shopify-administration	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.605697+00
479797a3-b426-4933-88eb-6614a57677d1	WooCommerce Management	woocommerce-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.605893+00
f41ad727-43ee-4076-b153-145684155cd6	Amazon Seller Central	amazon-seller-central	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.60611+00
9a92b266-213b-4e3c-8c4b-50a10a2f4942	Inventory Management	inventory-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.606324+00
95cf0597-5c72-45e1-b4bd-b5fea726adf3	Order Processing	order-processing	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.606969+00
4c7f8a2e-8e4b-4314-9668-56d2c88412be	Supply Chain Coordination	supply-chain-coordination	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.607181+00
bfb39c76-aa2d-415e-9fd2-578ef7f3316e	Event Planning	event-planning	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.607393+00
c3cf2da0-86a1-4c0f-9ddd-90d59d16c8f1	Event Coordination	event-coordination	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.607582+00
293973f8-80eb-4221-a545-b794fc0ae29c	Conference Management	conference-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.607774+00
6d37e647-79aa-4250-8878-0deb5a600add	Workshop Facilitation	workshop-facilitation	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.607981+00
dc391c59-ccec-4eff-a96f-529f064c9ba2	Vendor Management	vendor-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.608191+00
a5b4f5d5-e32c-49d4-ab91-719d8c07c384	Office Management	office-management	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.608387+00
5bfbbf71-975c-43d4-b8da-7e5633e54444	Bilingual Customer Support	bilingual-customer-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.608592+00
5070da8b-c659-4de8-92d9-6f04aa62fc80	Multilingual Communication	multilingual-communication	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.608796+00
de89ad18-1c84-4e37-a936-2d52b4d275f4	Technical Translation Support	technical-translation-support	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.609021+00
6dabd801-c5e3-42a2-8e7a-f2e0c5506bb7	Chat Moderation	chat-moderation	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.60922+00
c1df5c6f-fe7a-41cc-9f25-2a73694321cc	Forum Moderation	forum-moderation	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.60942+00
d2288e3f-5777-4add-9681-e5657be82aed	Community Building	community-building	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.609621+00
285131b5-673b-4e7a-812c-4bff15ac1a3a	User Engagement	user-engagement	358bd8bc-65d9-4ebf-a1a6-dba31e0045a2	\N	\N	\N	t	0	2026-02-14 03:54:29.609821+00
1c8c60bc-9a49-4081-8b83-e169f3afc5de	International Business Law	international-business-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.620295+00
9d1c3e2e-edfd-4d8c-8651-de90c35325b9	Cross-Border Transactions	cross-border-transactions	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.620573+00
7be99bb3-f0d3-4de5-bd91-b657a3f3b59c	Foreign Investment	foreign-investment	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.620783+00
80416c59-312d-43cd-8a67-1062f008c086	World Trade Organization	world-trade-organization	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.620983+00
18a791a9-e08c-45fd-a93a-57d0a6ea29ef	Export Controls	export-controls	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.621193+00
a073349e-d7ca-40b8-a906-83d321e69e3d	Sanctions Compliance	sanctions-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.621982+00
e175ea51-ffd3-4817-b1c3-d56228416c70	Family Law	family-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.622223+00
5ef07450-ca62-445b-8d34-d523922b86f7	Divorce Law	divorce-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.622436+00
ebab2998-f11f-4f44-b6c3-7266e28b8dc0	Child Custody	child-custody	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.622792+00
37e48f3d-7242-4e41-b108-575bc47925c0	Adoption Law	adoption-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.62301+00
d33aa4b9-7852-4fa4-a9d4-6ff6244059d4	Wills & Trusts	wills-trusts	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.623234+00
411de01c-d43a-469a-9aaf-5733afdbdcd2	Probate Law	probate-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.623446+00
f1abf989-dc34-452e-a036-160a0223e3ca	Personal Injury	personal-injury	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.623653+00
2f5b94e6-8113-4e3f-8852-4e6cea4a6f65	Criminal Law	criminal-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.623857+00
48f98215-f114-4c2e-bbfd-be02a9fd5a68	White Collar Crime	white-collar-crime	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.624066+00
775e4c2a-a630-4b57-b704-6539660430dd	Fraud Investigation	fraud-investigation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.624263+00
3fe04ce2-f1f2-4dc6-9c48-226a0c55b835	Banking Regulations	banking-regulations	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.624479+00
34811508-da92-403d-a5e4-65266e85ca2d	Insurance Law	insurance-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.624686+00
66ecf729-cb2a-473b-a71b-386b0ed1841f	Consumer Protection	consumer-protection	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.624893+00
49dcd4f4-36c3-4836-a139-4919a8743a6b	Crypto Regulation	crypto-regulation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.625122+00
2108e441-9653-4355-ba77-236f357332a9	Digital Assets Law	digital-assets-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.625327+00
13f8cdf2-a2c6-4240-bb59-c602dc514b7d	NFT Legal	nft-legal	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.625536+00
3dd24f0c-b269-416f-9b34-69cc86b60467	Space Law	space-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.625745+00
deec2dbc-5605-47a3-a92c-dc5fecf74f97	Autonomous Vehicle Regulation	autonomous-vehicle-regulation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.625945+00
f323fbd0-fc90-4ccd-8991-aa98aa8a5e40	ESG Compliance	esg-compliance	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.626153+00
0e7d6cb0-5a9b-4d7c-8b43-1df5ea42c7fb	Climate Law	climate-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.626669+00
3244e48e-6f53-450e-9778-040129fb0f45	Carbon Credits Legal	carbon-credits-legal	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.626874+00
236278fe-c721-4066-8698-375117fc6861	Gig Economy Law	gig-economy-law	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.627099+00
2d884ba7-52d7-4f8e-835e-2b94960e402a	Platform Regulation	platform-regulation	158c3eef-8f24-40ea-bf99-061c2510c933	\N	\N	\N	t	0	2026-02-14 03:54:29.627305+00
\.


--
-- Data for Name: time_entry_claim; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.time_entry_claim (id, time_entry_id, client_id, type, message, status, response, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: timeentry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timeentry (id, contract_id, freelancer_id, milestone_id, started_at, ended_at, duration_minutes, description, task_label, is_manual, is_billable, hourly_rate, amount, screenshot_urls, activity_score, status, approved_by, approved_at, rejected_reason, invoice_line_id, created_at, updated_at) FROM stdin;
26a2ef37-8476-4229-b1a0-565c4e55adef	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 22:24:43+00	2026-02-18 22:29:04+00	4	\N	Test new features	f	t	70.00	4.67	[]	\N	logged	\N	\N	\N	\N	2026-02-18 22:24:43+00	2026-02-18 22:29:04+00
a32064f0-5cc2-4622-836b-6557bd2a2555	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 22:47:45+00	2026-02-18 22:51:16+00	4	\N	\N	f	t	70.00	4.67	[]	\N	logged	\N	\N	\N	\N	2026-02-18 22:47:45+00	2026-02-18 22:51:16+00
73c3ef83-8e17-4366-92e2-149b419dbfc7	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 22:53:13+00	2026-02-18 23:00:42+00	7	\N	Test all the features	f	t	70.00	8.17	[]	\N	logged	\N	\N	\N	\N	2026-02-18 22:53:13+00	2026-02-18 23:00:42+00
46383e4a-24bb-4723-908f-949c61f6ff7b	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 23:03:30+00	2026-02-18 23:04:29+00	1	\N	test input	f	t	70.00	1.17	[]	\N	logged	\N	\N	\N	\N	2026-02-18 23:03:30+00	2026-02-18 23:04:29+00
8308a6bd-05ba-47b4-acfa-29db69874ae3	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 23:07:27+00	2026-02-18 23:10:44+00	3	\N	new functionality	f	t	70.00	3.50	[]	\N	logged	\N	\N	\N	\N	2026-02-18 23:07:27+00	2026-02-18 23:10:44+00
f7d5ef49-d239-4c8c-bb89-d3b58978f160	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 23:10:55+00	2026-02-18 23:11:04+00	0	\N	new function	f	t	70.00	0.00	[]	\N	logged	\N	\N	\N	\N	2026-02-18 23:10:55+00	2026-02-18 23:11:04+00
a77e50ad-e8fe-4aec-a10b-6db7db518e15	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-18 23:19:29+00	2026-02-19 00:05:10+00	46	\N	new test	f	t	70.00	53.67	[]	\N	logged	\N	\N	\N	\N	2026-02-18 23:19:29+00	2026-02-19 00:05:10+00
de2264da-6b19-45d8-94f7-ca36430e8be7	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-20 18:26:20+00	2026-02-20 18:46:50+00	21	\N	improve thinks	f	t	70.00	24.50	["/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/db270a9f4ba3fa3c0eae0b35203bbe3f.png", "/files/attachments/timeentry/de2264da-6b19-45d8-94f7-ca36430e8be7/fd5b63981b6adf5c5ec5004c4e36213a.png"]	100.00	logged	\N	\N	\N	\N	2026-02-20 18:26:20+00	2026-02-20 18:46:50+00
7d56b013-b7f3-4901-9497-c042e4d1876f	0401759e-8e35-4847-b9f4-76cff38ed563	9a593055-1bd8-45d3-b276-113fa5dd1bc4	\N	2026-02-20 18:47:00+00	2026-02-20 18:47:27+00	0	\N	Timer	f	t	70.00	0.00	[]	\N	logged	\N	\N	\N	\N	2026-02-20 18:47:00+00	2026-02-20 18:47:27+00
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, email, password_hash, role, status, display_name, first_name, last_name, avatar_url, phone, country, timezone, locale, email_verified_at, two_factor_enabled, two_factor_secret, token_version, last_login_at, last_login_ip, metadata, created_at, updated_at, deleted_at, state, languages, profile_completed, stripe_customer_id) FROM stdin;
8c51ce2b-527e-4818-b373-cef1b8295432	test@example.com	$2y$12$IotYOVWy3h09XaIUIvoPEe/WiQTHbD4CcOYYkK9AeCqLWjKf5d3ru	admin	pending_verification	Test User	\N	\N	\N	\N	\N	UTC	en	\N	f	\N	1	\N	\N	[]	2026-02-14 02:27:04+00	2026-02-14 02:27:04+00	\N	\N	[]	f	\N
aa04c891-a753-48bb-a2c9-9f2a528d946b	jorge@colibriv.com	$2y$12$u1Gz4EeL3Mc/g/kEQWa8IuLKiEOICG.vM/JkwjQxdxKUEBMzBIz0i	admin	pending_verification	Jorge Peraza	Jorge	Peraza	\N	\N	\N	America/Denver	en	\N	f	\N	1	\N	\N	"{\\"company_name\\":\\"MonkeysRaiser\\",\\"company_size\\":\\"11–50 employees\\"}"	2026-02-15 17:36:07+00	2026-02-15 17:36:07+00	\N	\N	[]	f	\N
9a593055-1bd8-45d3-b276-113fa5dd1bc4	yorch.peraza@gmail.com	$2y$12$yL4md/Alj5pcw.3Jb.rmMOj19nG3uIVYUY08vOCE89Iv2X7f0e4LO	freelancer	pending_verification	Jorge Peraza	Jorge	Peraza	/files/avatars/9a593055-1bd8-45d3-b276-113fa5dd1bc4.jpg	+1 7209792811	US	America/Denver	en	\N	f	\N	1	\N	\N	"{\\"primary_skill\\":\\"Machine Learning / AI\\",\\"hourly_rate\\":100}"	2026-02-14 02:34:41+00	2026-02-20 18:29:43+00	\N	Colorado	[{"code": "en", "level": "fluent", "language": "English"}, {"code": "es", "level": "native", "language": "Spanish"}]	t	\N
300e3c58-9465-4a6f-bfe9-8bb6d5f40136	jorge@monkeys.cloud	$2y$12$i7Dk1gyMc2lBeEO9Mu7sC.a4Lgn6vcKHW6uCW6JYDDcyoztr50gHW	client	pending_verification	Jorge Peraza	Jorge	Peraza	\N	+1 7209792811	US	America/Denver	en	\N	f	\N	1	\N	\N	"{\\"company_name\\":\\"Colibricode\\",\\"company_size\\":\\"2–10 employees\\"}"	2026-02-14 02:27:18+00	2026-02-20 18:32:15.301338+00	\N	Colorado	[{"code": "en", "level": "fluent", "language": "English"}, {"code": "es", "level": "native", "language": "Spanish"}]	t	cus_U0KtMWsZf5eEYB
\.


--
-- Data for Name: useroauth; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.useroauth (id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: usersession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usersession (id, user_id, token_hash, refresh_token_hash, ip_address, user_agent, device_fingerprint, expires_at, revoked_at, created_at) FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification (id, user_id, type, status, data, ai_result, ai_model_version, ai_confidence, reviewed_by_id, reviewer_notes, reviewed_at, expires_at, created_at, updated_at) FROM stdin;
ce14f995-1290-48e8-bd7a-3097603447b3	9a593055-1bd8-45d3-b276-113fa5dd1bc4	portfolio	approved	{"reason": "You have 1 portfolio/certification item(s)", "education": [], "github_url": "https://github.com/yorchperaza", "website_url": "https://monkeyscms.com/", "linkedin_url": "https://www.linkedin.com/in/jorgeperaza/", "auto_evaluated": true, "certifications": [], "portfolio_items": [{"url": "https://myproject.com", "title": "My Project", "description": ""}]}	{"checks": [], "decision": "auto_approved", "confidence": 0.9}	inline-dev-v1.0	0.90	\N	\N	\N	\N	2026-02-15 23:30:44+00	2026-02-15 23:30:44+00
cb9dffe6-e211-4dd8-bb2f-102e7088475a	9a593055-1bd8-45d3-b276-113fa5dd1bc4	payment_method	approved	{"reason": "Payment method verification", "auto_evaluated": true}	{"checks": [], "decision": "auto_approved", "confidence": 0.87}	inline-dev-v1.0	0.87	\N	\N	\N	\N	2026-02-15 23:30:44+00	2026-02-15 23:30:44+00
feb7b3f1-d968-48d2-8e12-62270b1ad1f6	9a593055-1bd8-45d3-b276-113fa5dd1bc4	work_history	approved	{"bio": "I’m a software engineer, product builder, and community catalyst with 18 years delivering high-impact solutions for Fortune 500 clients and high-growth startups alike.\\n\\nWhat I’m building now\\n\\t•\\tMonkeysCloud — Founder & CTO\\nA launch-ready SaaS that unifies project management, Git workflows, and DevOps/hosting. Backed by $300 k in Google Cloud credits, we streamline the entire lifecycle—from planning tickets to one-click production deploys.\\n\\t•\\tMonkeysLegion — Creator & Lead Maintainer\\nA full-stack PHP framework + CLI that lets teams scaffold and ship apps at light speed. Open-source by design; we’re growing a contributor community and shipping new modules (AI-powered CMS, Git automation) on a public roadmap.\\n\\nCareer highlights\\n\\t•\\tLed cross-functional teams on enterprise portals, e-commerce, and data platforms for Fortune 500 companies—cutting release times by up to 40 %.\\n\\t•\\tArchitected cloud-native infrastructures (GCP, AWS, Terraform) that scaled to millions of users with zero-downtime deployments.\\n\\t•\\tMentored dozens of engineers, fostering a culture of code quality, knowledge sharing, and experimentation.\\n\\nWhy I build\\n\\nInnovation fuels me. Outside of code you’ll find me:\\n\\t•\\tPrototyping hardware/software mash-ups for everyday hassles.\\n\\t•\\tReading on design thinking, leadership, and emerging tech.\\n\\t•\\tEncouraging peers to unlock their potential—because great products start with empowered people.\\n\\nLet’s connect if you’re passionate about shipping elegant software, open-source collaboration, or the future of DevOps-driven product development.", "reason": "20 year(s) of experience to verify", "skills": [], "headline": "Full-stack engineer & founder of MonkeysLegion (PHP framework). ", "user_reply": "Testing persistent reply storage", "user_reply_at": "2026-02-15 23:58:08", "auto_evaluated": true, "experience_years": 20}	{"checks": [], "decision": "human_review", "confidence": 0.7699999999999999}	inline-dev-v1.0	0.77	aa04c891-a753-48bb-a2c9-9f2a528d946b	\N	2026-02-16 00:11:07+00	\N	2026-02-15 23:30:44+00	2026-02-16 00:11:07+00
b74b03ab-0aaf-4391-9e30-1ddaf019e0d5	9a593055-1bd8-45d3-b276-113fa5dd1bc4	identity	approved	{"bio": "I’m a software engineer, product builder, and community catalyst with 18 years delivering high-impact solutions for Fortune 500 clients and high-growth startups alike.\\n\\nWhat I’m building now\\n\\t•\\tMonkeysCloud — Founder & CTO\\nA launch-ready SaaS that unifies project management, Git workflows, and DevOps/hosting. Backed by $300 k in Google Cloud credits, we streamline the entire lifecycle—from planning tickets to one-click production deploys.\\n\\t•\\tMonkeysLegion — Creator & Lead Maintainer\\nA full-stack PHP framework + CLI that lets teams scaffold and ship apps at light speed. Open-source by design; we’re growing a contributor community and shipping new modules (AI-powered CMS, Git automation) on a public roadmap.\\n\\nCareer highlights\\n\\t•\\tLed cross-functional teams on enterprise portals, e-commerce, and data platforms for Fortune 500 companies—cutting release times by up to 40 %.\\n\\t•\\tArchitected cloud-native infrastructures (GCP, AWS, Terraform) that scaled to millions of users with zero-downtime deployments.\\n\\t•\\tMentored dozens of engineers, fostering a culture of code quality, knowledge sharing, and experimentation.\\n\\nWhy I build\\n\\nInnovation fuels me. Outside of code you’ll find me:\\n\\t•\\tPrototyping hardware/software mash-ups for everyday hassles.\\n\\t•\\tReading on design thinking, leadership, and emerging tech.\\n\\t•\\tEncouraging peers to unlock their potential—because great products start with empowered people.\\n\\nLet’s connect if you’re passionate about shipping elegant software, open-source collaboration, or the future of DevOps-driven product development.", "reason": "Identity verification is always recommended", "headline": "Full-stack engineer & founder of MonkeysLegion (PHP framework). ", "user_reply": "New response", "user_reply_at": "2026-02-15 23:58:16", "auto_evaluated": true}	{"checks": [], "decision": "human_review", "confidence": 0.83}	inline-dev-v1.0	0.83	aa04c891-a753-48bb-a2c9-9f2a528d946b	\N	2026-02-21 17:37:42+00	\N	2026-02-15 23:30:44+00	2026-02-21 17:37:42+00
\.


--
-- Data for Name: verification_conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_conversation (id, verification_id, sender_type, sender_id, message, created_at) FROM stdin;
\.


--
-- Data for Name: weeklytimesheet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weeklytimesheet (id, contract_id, freelancer_id, week_start, week_end, total_minutes, billable_minutes, total_amount, hourly_rate, currency, status, submitted_at, approved_at, approved_by, notes, client_feedback, invoice_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: activitylog activitylog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activitylog
    ADD CONSTRAINT activitylog_pkey PRIMARY KEY (id);


--
-- Name: aidecisionlog aidecisionlog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aidecisionlog
    ADD CONSTRAINT aidecisionlog_pkey PRIMARY KEY (id);


--
-- Name: attachment attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);


--
-- Name: blog_post blog_post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post
    ADD CONSTRAINT blog_post_pkey PRIMARY KEY (id);


--
-- Name: blog_post blog_post_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post
    ADD CONSTRAINT blog_post_slug_key UNIQUE (slug);


--
-- Name: blog_post_tag blog_post_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tag
    ADD CONSTRAINT blog_post_tag_pkey PRIMARY KEY (post_id, tag_id);


--
-- Name: blog_tag blog_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tag
    ADD CONSTRAINT blog_tag_pkey PRIMARY KEY (id);


--
-- Name: blog_tag blog_tag_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tag
    ADD CONSTRAINT blog_tag_slug_key UNIQUE (slug);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: clientprofile clientprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientprofile
    ADD CONSTRAINT clientprofile_pkey PRIMARY KEY (user_id);


--
-- Name: contract contract_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: deliverable deliverable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliverable
    ADD CONSTRAINT deliverable_pkey PRIMARY KEY (id);


--
-- Name: deliverables deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_pkey PRIMARY KEY (id);


--
-- Name: dispute dispute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute
    ADD CONSTRAINT dispute_pkey PRIMARY KEY (id);


--
-- Name: disputemessage disputemessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputemessage
    ADD CONSTRAINT disputemessage_pkey PRIMARY KEY (id);


--
-- Name: email_preference email_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_preference
    ADD CONSTRAINT email_preference_pkey PRIMARY KEY (user_id);


--
-- Name: escrowtransaction escrowtransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrowtransaction
    ADD CONSTRAINT escrowtransaction_pkey PRIMARY KEY (id);


--
-- Name: featureflag featureflag_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featureflag
    ADD CONSTRAINT featureflag_key_unique UNIQUE (key);


--
-- Name: featureflag featureflag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featureflag
    ADD CONSTRAINT featureflag_pkey PRIMARY KEY (id);


--
-- Name: freelancer_skills freelancer_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_skills
    ADD CONSTRAINT freelancer_skills_pkey PRIMARY KEY (freelancer_id, skill_id);


--
-- Name: freelancerprofile freelancerprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancerprofile
    ADD CONSTRAINT freelancerprofile_pkey PRIMARY KEY (user_id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


--
-- Name: invoiceline invoiceline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoiceline
    ADD CONSTRAINT invoiceline_pkey PRIMARY KEY (id);


--
-- Name: job_moderation_conversation job_moderation_conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_moderation_conversation
    ADD CONSTRAINT job_moderation_conversation_pkey PRIMARY KEY (id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (id);


--
-- Name: job_skills job_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id);


--
-- Name: jobattachment jobattachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobattachment
    ADD CONSTRAINT jobattachment_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: milestone milestone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestone
    ADD CONSTRAINT milestone_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: notification_reply notification_reply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reply
    ADD CONSTRAINT notification_reply_pkey PRIMARY KEY (id);


--
-- Name: paymentmethod paymentmethod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paymentmethod
    ADD CONSTRAINT paymentmethod_pkey PRIMARY KEY (id);


--
-- Name: payout payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_pkey PRIMARY KEY (id);


--
-- Name: proposal proposal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal
    ADD CONSTRAINT proposal_pkey PRIMARY KEY (id);


--
-- Name: report report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pkey PRIMARY KEY (id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: saved_job saved_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_job
    ADD CONSTRAINT saved_job_pkey PRIMARY KEY (user_id, job_id);


--
-- Name: savedjob savedjob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savedjob
    ADD CONSTRAINT savedjob_pkey PRIMARY KEY (id);


--
-- Name: screenshot screenshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screenshot
    ADD CONSTRAINT screenshot_pkey PRIMARY KEY (id);


--
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (id);


--
-- Name: timeentry timeentry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeentry
    ADD CONSTRAINT timeentry_pkey PRIMARY KEY (id);


--
-- Name: time_entry_claim timeentryclaim_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entry_claim
    ADD CONSTRAINT timeentryclaim_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: useroauth useroauth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.useroauth
    ADD CONSTRAINT useroauth_pkey PRIMARY KEY (id);


--
-- Name: usersession usersession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usersession
    ADD CONSTRAINT usersession_pkey PRIMARY KEY (id);


--
-- Name: verification_conversation verification_conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_conversation
    ADD CONSTRAINT verification_conversation_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: weeklytimesheet weeklytimesheet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weeklytimesheet
    ADD CONSTRAINT weeklytimesheet_pkey PRIMARY KEY (id);


--
-- Name: idx_attachment_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attachment_entity ON public.attachment USING btree (entity_type, entity_id);


--
-- Name: idx_blog_post_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_author ON public.blog_post USING btree (author_id);


--
-- Name: idx_blog_post_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_published ON public.blog_post USING btree (published_at DESC) WHERE ((status)::text = 'published'::text);


--
-- Name: idx_blog_post_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_slug ON public.blog_post USING btree (slug);


--
-- Name: idx_blog_post_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_status ON public.blog_post USING btree (status);


--
-- Name: idx_blog_post_tag_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_post_tag_tag ON public.blog_post_tag USING btree (tag_id);


--
-- Name: idx_deliverables_milestone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliverables_milestone ON public.deliverables USING btree (milestone_id);


--
-- Name: idx_job_mod_conv_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_mod_conv_job ON public.job_moderation_conversation USING btree (job_id);


--
-- Name: idx_notification_reply_notif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_reply_notif ON public.notification_reply USING btree (notification_id);


--
-- Name: idx_notification_reply_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_reply_user ON public.notification_reply USING btree (user_id);


--
-- Name: idx_paymentmethod_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paymentmethod_user ON public.paymentmethod USING btree (user_id);


--
-- Name: idx_paymentmethod_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paymentmethod_user_active ON public.paymentmethod USING btree (user_id, is_active);


--
-- Name: idx_review_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_contract ON public.review USING btree (contract_id);


--
-- Name: idx_review_reviewee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reviewee ON public.review USING btree (reviewee_id);


--
-- Name: idx_review_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reviewer ON public.review USING btree (reviewer_id);


--
-- Name: idx_screenshot_entry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_screenshot_entry ON public.screenshot USING btree (time_entry_id);


--
-- Name: idx_verif_conv_verif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verif_conv_verif ON public.verification_conversation USING btree (verification_id);


--
-- Name: skill_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX skill_slug_unique ON public.skill USING btree (slug);


--
-- Name: blog_post blog_post_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post
    ADD CONSTRAINT blog_post_author_id_fkey FOREIGN KEY (author_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: blog_post_tag blog_post_tag_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tag
    ADD CONSTRAINT blog_post_tag_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_post(id) ON DELETE CASCADE;


--
-- Name: blog_post_tag blog_post_tag_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_post_tag
    ADD CONSTRAINT blog_post_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tag(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: deliverables deliverables_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestone(id) ON DELETE CASCADE;


--
-- Name: email_preference email_preference_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_preference
    ADD CONSTRAINT email_preference_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: dispute fk_dispute_awaiting_response_from_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute
    ADD CONSTRAINT fk_dispute_awaiting_response_from_id FOREIGN KEY (awaiting_response_from_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: job fk_job_moderation_reviewed_by_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT fk_job_moderation_reviewed_by_id FOREIGN KEY (moderation_reviewed_by_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: freelancer_skills freelancer_skills_freelancer_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_skills
    ADD CONSTRAINT freelancer_skills_freelancer_profile_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.freelancerprofile(user_id) ON DELETE CASCADE;


--
-- Name: freelancer_skills freelancer_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_skills
    ADD CONSTRAINT freelancer_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(id) ON DELETE CASCADE;


--
-- Name: job_moderation_conversation job_moderation_conversation_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_moderation_conversation
    ADD CONSTRAINT job_moderation_conversation_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job(id) ON DELETE CASCADE;


--
-- Name: job_skills job_skills_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job(id) ON DELETE CASCADE;


--
-- Name: job_skills job_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(id) ON DELETE CASCADE;


--
-- Name: notification_reply notification_reply_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reply
    ADD CONSTRAINT notification_reply_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notification(id) ON DELETE CASCADE;


--
-- Name: notification_reply notification_reply_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reply
    ADD CONSTRAINT notification_reply_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: saved_job saved_job_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_job
    ADD CONSTRAINT saved_job_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job(id) ON DELETE CASCADE;


--
-- Name: saved_job saved_job_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_job
    ADD CONSTRAINT saved_job_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: screenshot screenshot_time_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screenshot
    ADD CONSTRAINT screenshot_time_entry_id_fkey FOREIGN KEY (time_entry_id) REFERENCES public.timeentry(id) ON DELETE CASCADE;


--
-- Name: verification_conversation verification_conversation_verification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_conversation
    ADD CONSTRAINT verification_conversation_verification_id_fkey FOREIGN KEY (verification_id) REFERENCES public.verification(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict uSccy5gWcQHv5QbVhHThmNsQU6qEOEHlC5fKsks6v1eftFBKYznFEPTou8bOYMg

