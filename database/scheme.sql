-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bounty_targets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bounty_targets_pkey PRIMARY KEY (id),
  CONSTRAINT bounty_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.bugs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  severity USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'Draft'::bug_status,
  vulnerability_type text,
  impact_description text,
  poc_steps text,
  remediation_suggestion text,
  program_id uuid,
  user_id uuid NOT NULL,
  submission_date date,
  resolution_date date,
  bounty_amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  collaborators jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT bugs_pkey PRIMARY KEY (id),
  CONSTRAINT bugs_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.checklist_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  text text NOT NULL,
  checklist_id uuid,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_items_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.security_checklists(id)
);
CREATE TABLE public.knowledge_base (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  url text,
  entry_type text NOT NULL DEFAULT 'note'::text CHECK (entry_type = ANY (ARRAY['note'::text, 'tip'::text, 'link'::text, 'payload'::text, 'reference'::text, 'writeup'::text])),
  category text,
  tags ARRAY,
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_base_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_base_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.link_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT link_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.personal_notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personal_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.platforms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  url text,
  platform_type USER-DEFINED NOT NULL DEFAULT 'bug_bounty'::platform_type,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platforms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  target_name text NOT NULL,
  company text,
  scope text NOT NULL,
  platform_id uuid,
  program_url text,
  min_bounty numeric,
  max_bounty numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  target_type text DEFAULT 'bug_bounty'::text,
  notes text,
  last_tested date,
  program_type text DEFAULT 'Public'::text,
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id),
  CONSTRAINT programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reading_list (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  category text,
  priority integer DEFAULT 1,
  is_read boolean DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_list_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rss_articles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  link text NOT NULL,
  description text,
  author text,
  pub_date timestamp with time zone,
  guid text,
  feed_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rss_articles_pkey PRIMARY KEY (id),
  CONSTRAINT rss_articles_feed_id_fkey FOREIGN KEY (feed_id) REFERENCES public.rss_feeds(id)
);
CREATE TABLE public.rss_feeds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rss_feeds_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_checklists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  checklist_type text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_checklists_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_tips (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags ARRAY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_tips_pkey PRIMARY KEY (id)
);
CREATE TABLE public.useful_links (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  category text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT useful_links_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_platform_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username text NOT NULL,
  platform_id uuid,
  user_id uuid NOT NULL,
  profile_url text,
  reputation_points integer DEFAULT 0,
  rank_position text,
  total_bounties_earned numeric DEFAULT 0,
  bugs_submitted integer DEFAULT 0,
  bugs_accepted integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_platform_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_platform_profiles_platform_id_fkey FOREIGN KEY (platform_id) REFERENCES public.platforms(id)
);
CREATE TABLE public.user_rss_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  feed_id uuid,
  subscribed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_rss_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_rss_subscriptions_feed_id_fkey FOREIGN KEY (feed_id) REFERENCES public.rss_feeds(id)
);