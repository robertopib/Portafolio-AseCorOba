import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('es', 'en');
  CREATE TYPE "public"."enum_pages_blocks_block_type" AS ENUM('hero', 'portfolioIntro', 'categoryGallery', 'brandingPreview', 'webAppsPreview', 'uxuiPreview', 'fotografiaPreview', 'marketingPreview', 'experiencia', 'contacto', 'brandingHeader', 'gallery:deportes', 'gallery:belleza', 'gallery:logos', 'webAppsHeader', 'webAppsGallery', 'fotografiaHeader', 'fotografiaGallery', 'marketingHeader', 'marketingGallery', 'uxuiHeader', 'uxuiHero', 'uxuiOverview', 'uxuiIntro', 'uxuiProblemSolution', 'uxuiDetails', 'uxuiTimeline', 'uxuiJourney', 'uxuiPersonas', 'uxuiSketches', 'uxuiLearnings');
  CREATE TYPE "public"."enum_pages_blocks_source_category" AS ENUM('branding', 'web-apps', 'uxui-producto', 'fotografia-producto', 'marketing-360');
  CREATE TYPE "public"."enum_pages_blocks_source_placement" AS ENUM('page', 'home');
  CREATE TYPE "public"."enum_pages_blocks_layout_variant" AS ENUM('branding:sports', 'branding:beauty', 'branding:logos', 'web-apps:page', 'fotografia:page', 'marketing:page', 'branding:home', 'web-apps:home', 'uxui:home', 'fotografia:home', 'marketing:home');
  CREATE TYPE "public"."enum_pages_blocks_placement" AS ENUM('home', 'page', 'all');
  CREATE TYPE "public"."enum_projects_type" AS ENUM('image', 'caseStudy');
  CREATE TYPE "public"."enum_projects_placement" AS ENUM('home', 'page', 'both');
  CREATE TYPE "public"."enum_projects_size" AS ENUM('small', 'medium', 'large', 'wide', 'tall');
  CREATE TABLE "car_resp" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "car_resp_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "car_exp" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "car_exp_locales" (
  	"role" varchar,
  	"period" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "abt_edu" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "abt_edu_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "abt_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "abt_langs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "abt_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "u_ov" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_ov_locales" (
  	"label" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_rows_locales" (
  	"tools" varchar,
  	"team" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_phases_locales" (
  	"phase" varchar,
  	"duration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_jn_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_jn_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "u_stages_locales" (
  	"name" varchar,
  	"action" varchar,
  	"thought" varchar,
  	"friction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_jn_bul" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_jn_bul_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_jn_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_jn_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_pr_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_pr_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_pr_ans" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_pr_ans_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_pr_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_pr_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_c_bi" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_c_bi_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_c_ch" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_c_ch_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_c_mo" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_c_mo_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_c_pp" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_c_pp_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_cards_locales" (
  	"name" varchar,
  	"descriptor" varchar,
  	"quote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_sk_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_sk_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_sk_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_sk_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_ln_ans" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_ln_ans_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "u_ln_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "u_ln_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_type" "enum_pages_blocks_block_type" NOT NULL,
  	"anchor_id" varchar,
  	"source_category" "enum_pages_blocks_source_category",
  	"source_placement" "enum_pages_blocks_source_placement",
  	"source_group" varchar,
  	"category_id" integer,
  	"grupo" varchar,
  	"layout_variant" "enum_pages_blocks_layout_variant",
  	"placement" "enum_pages_blocks_placement",
  	"max_items" numeric,
  	"hero_content_background_image" varchar,
  	"hero_content_background_image_visible" boolean DEFAULT true,
  	"hero_content_title_visible" boolean DEFAULT true,
  	"hero_content_subtitle_visible" boolean DEFAULT true,
  	"hero_content_body_visible" boolean DEFAULT true,
  	"hero_content_cta1_visible" boolean DEFAULT true,
  	"hero_content_cta2_visible" boolean DEFAULT true,
  	"career_content_headings_career_path_visible" boolean DEFAULT true,
  	"career_content_headings_professional_experience_visible" boolean DEFAULT true,
  	"career_content_experience_visible" boolean DEFAULT true,
  	"about_content_headings_education_visible" boolean DEFAULT true,
  	"about_content_headings_tools_visible" boolean DEFAULT true,
  	"about_content_headings_languages_visible" boolean DEFAULT true,
  	"about_content_education_visible" boolean DEFAULT true,
  	"about_content_tools_visible" boolean DEFAULT true,
  	"about_content_languages_visible" boolean DEFAULT true,
  	"about_content_contact_heading_visible" boolean DEFAULT true,
  	"about_content_contact_body_visible" boolean DEFAULT true,
  	"about_content_contact_email" varchar,
  	"about_content_contact_email_visible" boolean DEFAULT true,
  	"about_content_contact_phone" varchar,
  	"about_content_contact_phone_visible" boolean DEFAULT true,
  	"about_content_social_links_visible" boolean DEFAULT true,
  	"about_content_footer_copyright_prefix" varchar,
  	"about_content_footer_copyright_prefix_visible" boolean DEFAULT true,
  	"about_content_footer_rights_visible" boolean DEFAULT true,
  	"about_content_footer_privacy_visible" boolean DEFAULT true,
  	"about_content_footer_terms_visible" boolean DEFAULT true,
  	"uxui_content_header_title_visible" boolean DEFAULT true,
  	"uxui_content_header_tagline_visible" boolean DEFAULT true,
  	"uxui_content_hero_image" varchar,
  	"uxui_content_hero_image_visible" boolean DEFAULT true,
  	"uxui_content_hero_alt_visible" boolean DEFAULT true,
  	"uxui_content_project_name_visible" boolean DEFAULT true,
  	"uxui_content_project_subtitle_visible" boolean DEFAULT true,
  	"uxui_content_project_overview_visible" boolean DEFAULT true,
  	"uxui_content_intro_visible" boolean DEFAULT true,
  	"uxui_content_problem_solution_problem_label_visible" boolean DEFAULT true,
  	"uxui_content_problem_solution_problem_text_visible" boolean DEFAULT true,
  	"uxui_content_problem_solution_solution_label_visible" boolean DEFAULT true,
  	"uxui_content_problem_solution_solution_text_visible" boolean DEFAULT true,
  	"uxui_content_details_headers_tools_visible" boolean DEFAULT true,
  	"uxui_content_details_headers_team_visible" boolean DEFAULT true,
  	"uxui_content_details_headers_role_visible" boolean DEFAULT true,
  	"uxui_content_details_rows_visible" boolean DEFAULT true,
  	"uxui_content_timeline_title_visible" boolean DEFAULT true,
  	"uxui_content_timeline_duration_label_visible" boolean DEFAULT true,
  	"uxui_content_timeline_duration_value_visible" boolean DEFAULT true,
  	"uxui_content_timeline_phases_visible" boolean DEFAULT true,
  	"uxui_content_journey_title_visible" boolean DEFAULT true,
  	"uxui_content_journey_intro_visible" boolean DEFAULT true,
  	"uxui_content_journey_labels_action_visible" boolean DEFAULT true,
  	"uxui_content_journey_labels_thought_visible" boolean DEFAULT true,
  	"uxui_content_journey_labels_friction_visible" boolean DEFAULT true,
  	"uxui_content_journey_stages_visible" boolean DEFAULT true,
  	"uxui_content_journey_qa_visible" boolean DEFAULT true,
  	"uxui_content_personas_title_visible" boolean DEFAULT true,
  	"uxui_content_personas_intro_visible" boolean DEFAULT true,
  	"uxui_content_personas_qa_visible" boolean DEFAULT true,
  	"uxui_content_personas_section_labels_basic_info_visible" boolean DEFAULT true,
  	"uxui_content_personas_section_labels_channels_visible" boolean DEFAULT true,
  	"uxui_content_personas_section_labels_motivations_visible" boolean DEFAULT true,
  	"uxui_content_personas_section_labels_pain_points_visible" boolean DEFAULT true,
  	"uxui_content_personas_cards_visible" boolean DEFAULT true,
  	"uxui_content_sketches_title_visible" boolean DEFAULT true,
  	"uxui_content_sketches_intro_visible" boolean DEFAULT true,
  	"uxui_content_sketches_qa_visible" boolean DEFAULT true,
  	"uxui_content_learnings_title_visible" boolean DEFAULT true,
  	"uxui_content_learnings_qa_visible" boolean DEFAULT true
  );
  
  CREATE TABLE "pages_blocks_locales" (
  	"subheading" varchar,
  	"hero_content_title" varchar,
  	"hero_content_subtitle" varchar,
  	"hero_content_body" varchar,
  	"hero_content_cta1" varchar,
  	"hero_content_cta2" varchar,
  	"career_content_headings_career_path" varchar,
  	"career_content_headings_professional_experience" varchar,
  	"about_content_headings_education" varchar,
  	"about_content_headings_tools" varchar,
  	"about_content_headings_languages" varchar,
  	"about_content_contact_heading" varchar,
  	"about_content_contact_body" varchar,
  	"about_content_footer_rights" varchar,
  	"about_content_footer_privacy" varchar,
  	"about_content_footer_terms" varchar,
  	"uxui_content_header_title" varchar,
  	"uxui_content_header_tagline" varchar,
  	"uxui_content_hero_alt" varchar,
  	"uxui_content_project_name" varchar,
  	"uxui_content_project_subtitle" varchar,
  	"uxui_content_problem_solution_problem_label" varchar,
  	"uxui_content_problem_solution_problem_text" varchar,
  	"uxui_content_problem_solution_solution_label" varchar,
  	"uxui_content_problem_solution_solution_text" varchar,
  	"uxui_content_details_headers_tools" varchar,
  	"uxui_content_details_headers_team" varchar,
  	"uxui_content_details_headers_role" varchar,
  	"uxui_content_timeline_title" varchar,
  	"uxui_content_timeline_duration_label" varchar,
  	"uxui_content_timeline_duration_value" varchar,
  	"uxui_content_journey_title" varchar,
  	"uxui_content_journey_labels_action" varchar,
  	"uxui_content_journey_labels_thought" varchar,
  	"uxui_content_journey_labels_friction" varchar,
  	"uxui_content_personas_title" varchar,
  	"uxui_content_personas_section_labels_basic_info" varchar,
  	"uxui_content_personas_section_labels_channels" varchar,
  	"uxui_content_personas_section_labels_motivations" varchar,
  	"uxui_content_personas_section_labels_pain_points" varchar,
  	"uxui_content_sketches_title" varchar,
  	"uxui_content_learnings_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"anchor_id" varchar,
  	"order" numeric NOT NULL,
  	"home_heading_visible" boolean DEFAULT true,
  	"home_tagline_visible" boolean DEFAULT true,
  	"home_description_visible" boolean DEFAULT true,
  	"home_studio_label_visible" boolean DEFAULT true,
  	"home_studio_name" varchar,
  	"home_studio_name_visible" boolean DEFAULT true,
  	"home_role_label_visible" boolean DEFAULT true,
  	"home_role_description_visible" boolean DEFAULT true,
  	"home_cta_visible" boolean DEFAULT true,
  	"home_section_heading_visible" boolean DEFAULT true,
  	"home_sketch_image" varchar,
  	"home_sketch_image_visible" boolean DEFAULT true,
  	"home_sketch_alt_visible" boolean DEFAULT true,
  	"page_title_visible" boolean DEFAULT true,
  	"page_description_visible" boolean DEFAULT true,
  	"page_subtitle_sports_visible" boolean DEFAULT true,
  	"page_subtitle_beauty_visible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"home_heading" varchar,
  	"home_tagline" varchar,
  	"home_description" varchar,
  	"home_studio_label" varchar,
  	"home_role_label" varchar,
  	"home_role_description" varchar,
  	"home_cta" varchar,
  	"home_section_heading" varchar,
  	"home_sketch_alt" varchar,
  	"page_title" varchar,
  	"page_description" varchar,
  	"page_subtitle_sports" varchar,
  	"page_subtitle_beauty" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"tagline_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_header_locales" (
  	"title" varchar,
  	"tagline" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image" varchar,
  	"image_visible" boolean DEFAULT true,
  	"alt_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_hero_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_ov" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_ov_locales" (
  	"label" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_overview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name_visible" boolean DEFAULT true,
  	"subtitle_visible" boolean DEFAULT true,
  	"overview_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_overview_locales" (
  	"name" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_problem_solution" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"problem_label_visible" boolean DEFAULT true,
  	"problem_text_visible" boolean DEFAULT true,
  	"solution_label_visible" boolean DEFAULT true,
  	"solution_text_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_problem_solution_locales" (
  	"problem_label" varchar,
  	"problem_text" varchar,
  	"solution_label" varchar,
  	"solution_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_rows_locales" (
  	"tools" varchar,
  	"team" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headers_tools_visible" boolean DEFAULT true,
  	"headers_team_visible" boolean DEFAULT true,
  	"headers_role_visible" boolean DEFAULT true,
  	"rows_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_details_locales" (
  	"headers_tools" varchar,
  	"headers_team" varchar,
  	"headers_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_phases_locales" (
  	"phase" varchar,
  	"duration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"duration_label_visible" boolean DEFAULT true,
  	"duration_value_visible" boolean DEFAULT true,
  	"phases_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_timeline_locales" (
  	"title" varchar,
  	"duration_label" varchar,
  	"duration_value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_jn_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_jn_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "b_stages_locales" (
  	"name" varchar,
  	"action" varchar,
  	"thought" varchar,
  	"friction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_jn_bul" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_jn_bul_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_jn_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_jn_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"intro_visible" boolean DEFAULT true,
  	"labels_action_visible" boolean DEFAULT true,
  	"labels_thought_visible" boolean DEFAULT true,
  	"labels_friction_visible" boolean DEFAULT true,
  	"stages_visible" boolean DEFAULT true,
  	"qa_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_journey_locales" (
  	"title" varchar,
  	"labels_action" varchar,
  	"labels_thought" varchar,
  	"labels_friction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_pr_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_pr_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_pr_ans" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_pr_ans_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_pr_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_pr_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_c_bi" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_c_bi_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_c_ch" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_c_ch_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_c_mo" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_c_mo_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_c_pp" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_c_pp_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_cards_locales" (
  	"name" varchar,
  	"descriptor" varchar,
  	"quote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_personas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"intro_visible" boolean DEFAULT true,
  	"qa_visible" boolean DEFAULT true,
  	"section_labels_basic_info_visible" boolean DEFAULT true,
  	"section_labels_channels_visible" boolean DEFAULT true,
  	"section_labels_motivations_visible" boolean DEFAULT true,
  	"section_labels_pain_points_visible" boolean DEFAULT true,
  	"cards_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_personas_locales" (
  	"title" varchar,
  	"section_labels_basic_info" varchar,
  	"section_labels_channels" varchar,
  	"section_labels_motivations" varchar,
  	"section_labels_pain_points" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_sk_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_sk_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_sk_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_sk_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_sketches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"intro_visible" boolean DEFAULT true,
  	"qa_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_sketches_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_ln_ans" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_ln_ans_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "b_ln_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "b_ln_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_blocks_uxui_learnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_visible" boolean DEFAULT true,
  	"qa_visible" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_uxui_learnings_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_project_overview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_project_overview_locales" (
  	"label" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_details_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_details_rows_locales" (
  	"tools" varchar,
  	"team" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_timeline_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_timeline_phases_locales" (
  	"phase" varchar,
  	"duration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "projects_case_study_journey_stages_locales" (
  	"name" varchar,
  	"action" varchar,
  	"thought" varchar,
  	"friction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_qa_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_qa_bullets_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_journey_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_qa_answer" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_qa_answer_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_basic_info" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_basic_info_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_channels" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_channels_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_motivations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_motivations_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_pain_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_pain_points_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_personas_cards_locales" (
  	"name" varchar,
  	"descriptor" varchar,
  	"quote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_sketches_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_sketches_intro_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_sketches_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_sketches_qa_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_learnings_qa_answer" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_learnings_qa_answer_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_case_study_learnings_qa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_case_study_learnings_qa_locales" (
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL,
  	"type" "enum_projects_type" DEFAULT 'image' NOT NULL,
  	"placement" "enum_projects_placement" NOT NULL,
  	"group" varchar,
  	"size" "enum_projects_size",
  	"image_id" integer,
  	"order" numeric NOT NULL,
  	"internal_title" varchar,
  	"slug" varchar,
  	"case_study_hero_image" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar,
  	"alt" varchar,
  	"category_label" varchar,
  	"case_study_header_title" varchar,
  	"case_study_header_tagline" varchar,
  	"case_study_hero_alt" varchar,
  	"case_study_project_name" varchar,
  	"case_study_project_subtitle" varchar,
  	"case_study_problem_solution_problem_label" varchar,
  	"case_study_problem_solution_problem_text" varchar,
  	"case_study_problem_solution_solution_label" varchar,
  	"case_study_problem_solution_solution_text" varchar,
  	"case_study_details_headers_tools" varchar,
  	"case_study_details_headers_team" varchar,
  	"case_study_details_headers_role" varchar,
  	"case_study_timeline_title" varchar,
  	"case_study_timeline_duration_label" varchar,
  	"case_study_timeline_duration_value" varchar,
  	"case_study_journey_title" varchar,
  	"case_study_journey_labels_action" varchar,
  	"case_study_journey_labels_thought" varchar,
  	"case_study_journey_labels_friction" varchar,
  	"case_study_personas_title" varchar,
  	"case_study_personas_section_labels_basic_info" varchar,
  	"case_study_personas_section_labels_channels" varchar,
  	"case_study_personas_section_labels_motivations" varchar,
  	"case_study_personas_section_labels_pain_points" varchar,
  	"case_study_sketches_title" varchar,
  	"case_study_learnings_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"projects_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_background_image" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_locales" (
  	"hero_title" varchar,
  	"hero_subtitle" varchar,
  	"hero_body" varchar,
  	"hero_cta1" varchar,
  	"hero_cta2" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "about_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "about_education_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "about_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "about_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"footer_copyright_prefix" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_locales" (
  	"headings_education" varchar,
  	"headings_tools" varchar,
  	"headings_languages" varchar,
  	"contact_heading" varchar,
  	"contact_body" varchar,
  	"footer_rights" varchar,
  	"footer_privacy" varchar,
  	"footer_terms" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "career_experience_responsibilities" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "career_experience_responsibilities_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "career_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "career_experience_locales" (
  	"role" varchar,
  	"period" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "career" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "career_locales" (
  	"headings_career_path" varchar,
  	"headings_professional_experience" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "ui_strings_strings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "ui_strings_strings_locales" (
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ui_strings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"target" varchar NOT NULL
  );
  
  CREATE TABLE "site_nav_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_locales" (
  	"site_title" varchar,
  	"brand" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "car_resp" ADD CONSTRAINT "car_resp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."car_exp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_resp_locales" ADD CONSTRAINT "car_resp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."car_resp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_exp" ADD CONSTRAINT "car_exp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car_exp_locales" ADD CONSTRAINT "car_exp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."car_exp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "abt_edu" ADD CONSTRAINT "abt_edu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "abt_edu_locales" ADD CONSTRAINT "abt_edu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."abt_edu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "abt_tools" ADD CONSTRAINT "abt_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "abt_langs" ADD CONSTRAINT "abt_langs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "abt_social" ADD CONSTRAINT "abt_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ov" ADD CONSTRAINT "u_ov_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ov_locales" ADD CONSTRAINT "u_ov_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_ov"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_intro" ADD CONSTRAINT "u_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_intro_locales" ADD CONSTRAINT "u_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_rows" ADD CONSTRAINT "u_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_rows_locales" ADD CONSTRAINT "u_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_phases" ADD CONSTRAINT "u_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_phases_locales" ADD CONSTRAINT "u_phases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_intro" ADD CONSTRAINT "u_jn_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_intro_locales" ADD CONSTRAINT "u_jn_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_jn_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_stages" ADD CONSTRAINT "u_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_stages_locales" ADD CONSTRAINT "u_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_bul" ADD CONSTRAINT "u_jn_bul_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_jn_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_bul_locales" ADD CONSTRAINT "u_jn_bul_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_jn_bul"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_qa" ADD CONSTRAINT "u_jn_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_jn_qa_locales" ADD CONSTRAINT "u_jn_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_jn_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_intro" ADD CONSTRAINT "u_pr_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_intro_locales" ADD CONSTRAINT "u_pr_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_pr_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_ans" ADD CONSTRAINT "u_pr_ans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_pr_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_ans_locales" ADD CONSTRAINT "u_pr_ans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_pr_ans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_qa" ADD CONSTRAINT "u_pr_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_pr_qa_locales" ADD CONSTRAINT "u_pr_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_pr_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_bi" ADD CONSTRAINT "u_c_bi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_bi_locales" ADD CONSTRAINT "u_c_bi_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_c_bi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_ch" ADD CONSTRAINT "u_c_ch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_ch_locales" ADD CONSTRAINT "u_c_ch_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_c_ch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_mo" ADD CONSTRAINT "u_c_mo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_mo_locales" ADD CONSTRAINT "u_c_mo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_c_mo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_pp" ADD CONSTRAINT "u_c_pp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_c_pp_locales" ADD CONSTRAINT "u_c_pp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_c_pp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_cards" ADD CONSTRAINT "u_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_cards_locales" ADD CONSTRAINT "u_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_sk_intro" ADD CONSTRAINT "u_sk_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_sk_intro_locales" ADD CONSTRAINT "u_sk_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_sk_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_sk_qa" ADD CONSTRAINT "u_sk_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_sk_qa_locales" ADD CONSTRAINT "u_sk_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_sk_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ln_ans" ADD CONSTRAINT "u_ln_ans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_ln_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ln_ans_locales" ADD CONSTRAINT "u_ln_ans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_ln_ans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ln_qa" ADD CONSTRAINT "u_ln_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "u_ln_qa_locales" ADD CONSTRAINT "u_ln_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."u_ln_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks" ADD CONSTRAINT "pages_blocks_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks" ADD CONSTRAINT "pages_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_locales" ADD CONSTRAINT "pages_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_header" ADD CONSTRAINT "projects_blocks_uxui_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_header_locales" ADD CONSTRAINT "projects_blocks_uxui_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_hero" ADD CONSTRAINT "projects_blocks_uxui_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_hero_locales" ADD CONSTRAINT "projects_blocks_uxui_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ov" ADD CONSTRAINT "b_ov_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_overview"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ov_locales" ADD CONSTRAINT "b_ov_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_ov"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_overview" ADD CONSTRAINT "projects_blocks_uxui_overview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_overview_locales" ADD CONSTRAINT "projects_blocks_uxui_overview_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_overview"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_intro" ADD CONSTRAINT "b_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_intro_locales" ADD CONSTRAINT "b_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_intro" ADD CONSTRAINT "projects_blocks_uxui_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_problem_solution" ADD CONSTRAINT "projects_blocks_uxui_problem_solution_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_problem_solution_locales" ADD CONSTRAINT "projects_blocks_uxui_problem_solution_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_problem_solution"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_rows" ADD CONSTRAINT "b_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_details"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_rows_locales" ADD CONSTRAINT "b_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_details" ADD CONSTRAINT "projects_blocks_uxui_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_details_locales" ADD CONSTRAINT "projects_blocks_uxui_details_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_details"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_phases" ADD CONSTRAINT "b_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_phases_locales" ADD CONSTRAINT "b_phases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_timeline" ADD CONSTRAINT "projects_blocks_uxui_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_timeline_locales" ADD CONSTRAINT "projects_blocks_uxui_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_intro" ADD CONSTRAINT "b_jn_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_intro_locales" ADD CONSTRAINT "b_jn_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_jn_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_stages" ADD CONSTRAINT "b_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_stages_locales" ADD CONSTRAINT "b_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_bul" ADD CONSTRAINT "b_jn_bul_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_jn_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_bul_locales" ADD CONSTRAINT "b_jn_bul_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_jn_bul"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_qa" ADD CONSTRAINT "b_jn_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_jn_qa_locales" ADD CONSTRAINT "b_jn_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_jn_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_journey" ADD CONSTRAINT "projects_blocks_uxui_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_journey_locales" ADD CONSTRAINT "projects_blocks_uxui_journey_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_intro" ADD CONSTRAINT "b_pr_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_intro_locales" ADD CONSTRAINT "b_pr_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_pr_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_ans" ADD CONSTRAINT "b_pr_ans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_pr_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_ans_locales" ADD CONSTRAINT "b_pr_ans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_pr_ans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_qa" ADD CONSTRAINT "b_pr_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_pr_qa_locales" ADD CONSTRAINT "b_pr_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_pr_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_bi" ADD CONSTRAINT "b_c_bi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_bi_locales" ADD CONSTRAINT "b_c_bi_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_c_bi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_ch" ADD CONSTRAINT "b_c_ch_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_ch_locales" ADD CONSTRAINT "b_c_ch_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_c_ch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_mo" ADD CONSTRAINT "b_c_mo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_mo_locales" ADD CONSTRAINT "b_c_mo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_c_mo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_pp" ADD CONSTRAINT "b_c_pp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_c_pp_locales" ADD CONSTRAINT "b_c_pp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_c_pp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_cards" ADD CONSTRAINT "b_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_cards_locales" ADD CONSTRAINT "b_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_personas" ADD CONSTRAINT "projects_blocks_uxui_personas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_personas_locales" ADD CONSTRAINT "projects_blocks_uxui_personas_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_personas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_sk_intro" ADD CONSTRAINT "b_sk_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_sketches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_sk_intro_locales" ADD CONSTRAINT "b_sk_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_sk_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_sk_qa" ADD CONSTRAINT "b_sk_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_sketches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_sk_qa_locales" ADD CONSTRAINT "b_sk_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_sk_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_sketches" ADD CONSTRAINT "projects_blocks_uxui_sketches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_sketches_locales" ADD CONSTRAINT "projects_blocks_uxui_sketches_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_sketches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ln_ans" ADD CONSTRAINT "b_ln_ans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_ln_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ln_ans_locales" ADD CONSTRAINT "b_ln_ans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_ln_ans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ln_qa" ADD CONSTRAINT "b_ln_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_learnings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "b_ln_qa_locales" ADD CONSTRAINT "b_ln_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."b_ln_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_learnings" ADD CONSTRAINT "projects_blocks_uxui_learnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_uxui_learnings_locales" ADD CONSTRAINT "projects_blocks_uxui_learnings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_uxui_learnings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_project_overview" ADD CONSTRAINT "projects_case_study_project_overview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_project_overview_locales" ADD CONSTRAINT "projects_case_study_project_overview_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_project_overview"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_intro" ADD CONSTRAINT "projects_case_study_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_intro_locales" ADD CONSTRAINT "projects_case_study_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_details_rows" ADD CONSTRAINT "projects_case_study_details_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_details_rows_locales" ADD CONSTRAINT "projects_case_study_details_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_details_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_timeline_phases" ADD CONSTRAINT "projects_case_study_timeline_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_timeline_phases_locales" ADD CONSTRAINT "projects_case_study_timeline_phases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_timeline_phases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_intro" ADD CONSTRAINT "projects_case_study_journey_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_intro_locales" ADD CONSTRAINT "projects_case_study_journey_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_journey_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_stages" ADD CONSTRAINT "projects_case_study_journey_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_stages_locales" ADD CONSTRAINT "projects_case_study_journey_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_journey_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_qa_bullets" ADD CONSTRAINT "projects_case_study_journey_qa_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_journey_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_qa_bullets_locales" ADD CONSTRAINT "projects_case_study_journey_qa_bullets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_journey_qa_bullets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_qa" ADD CONSTRAINT "projects_case_study_journey_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_journey_qa_locales" ADD CONSTRAINT "projects_case_study_journey_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_journey_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_intro" ADD CONSTRAINT "projects_case_study_personas_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_intro_locales" ADD CONSTRAINT "projects_case_study_personas_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_qa_answer" ADD CONSTRAINT "projects_case_study_personas_qa_answer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_qa_answer_locales" ADD CONSTRAINT "projects_case_study_personas_qa_answer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_qa_answer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_qa" ADD CONSTRAINT "projects_case_study_personas_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_qa_locales" ADD CONSTRAINT "projects_case_study_personas_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_basic_info" ADD CONSTRAINT "projects_case_study_personas_cards_basic_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_basic_info_locales" ADD CONSTRAINT "projects_case_study_personas_cards_basic_info_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards_basic_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_channels" ADD CONSTRAINT "projects_case_study_personas_cards_channels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_channels_locales" ADD CONSTRAINT "projects_case_study_personas_cards_channels_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards_channels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_motivations" ADD CONSTRAINT "projects_case_study_personas_cards_motivations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_motivations_locales" ADD CONSTRAINT "projects_case_study_personas_cards_motivations_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards_motivations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_pain_points" ADD CONSTRAINT "projects_case_study_personas_cards_pain_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_pain_points_locales" ADD CONSTRAINT "projects_case_study_personas_cards_pain_points_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards_pain_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards" ADD CONSTRAINT "projects_case_study_personas_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_personas_cards_locales" ADD CONSTRAINT "projects_case_study_personas_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_personas_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_sketches_intro" ADD CONSTRAINT "projects_case_study_sketches_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_sketches_intro_locales" ADD CONSTRAINT "projects_case_study_sketches_intro_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_sketches_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_sketches_qa" ADD CONSTRAINT "projects_case_study_sketches_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_sketches_qa_locales" ADD CONSTRAINT "projects_case_study_sketches_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_sketches_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_learnings_qa_answer" ADD CONSTRAINT "projects_case_study_learnings_qa_answer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_learnings_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_learnings_qa_answer_locales" ADD CONSTRAINT "projects_case_study_learnings_qa_answer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_learnings_qa_answer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_learnings_qa" ADD CONSTRAINT "projects_case_study_learnings_qa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_case_study_learnings_qa_locales" ADD CONSTRAINT "projects_case_study_learnings_qa_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_case_study_learnings_qa"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_locales" ADD CONSTRAINT "home_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_education" ADD CONSTRAINT "about_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_education_locales" ADD CONSTRAINT "about_education_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_education"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_tools" ADD CONSTRAINT "about_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_languages" ADD CONSTRAINT "about_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_social_links" ADD CONSTRAINT "about_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_locales" ADD CONSTRAINT "about_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "career_experience_responsibilities" ADD CONSTRAINT "career_experience_responsibilities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."career_experience"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "career_experience_responsibilities_locales" ADD CONSTRAINT "career_experience_responsibilities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."career_experience_responsibilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "career_experience" ADD CONSTRAINT "career_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."career"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "career_experience_locales" ADD CONSTRAINT "career_experience_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."career_experience"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "career_locales" ADD CONSTRAINT "career_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."career"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ui_strings_strings" ADD CONSTRAINT "ui_strings_strings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ui_strings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ui_strings_strings_locales" ADD CONSTRAINT "ui_strings_strings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ui_strings_strings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_nav_items" ADD CONSTRAINT "site_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_nav_items_locales" ADD CONSTRAINT "site_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_locales" ADD CONSTRAINT "site_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "car_resp_order_idx" ON "car_resp" USING btree ("_order");
  CREATE INDEX "car_resp_parent_id_idx" ON "car_resp" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "car_resp_locales_locale_parent_id_unique" ON "car_resp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "car_exp_order_idx" ON "car_exp" USING btree ("_order");
  CREATE INDEX "car_exp_parent_id_idx" ON "car_exp" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "car_exp_locales_locale_parent_id_unique" ON "car_exp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "abt_edu_order_idx" ON "abt_edu" USING btree ("_order");
  CREATE INDEX "abt_edu_parent_id_idx" ON "abt_edu" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "abt_edu_locales_locale_parent_id_unique" ON "abt_edu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "abt_tools_order_idx" ON "abt_tools" USING btree ("_order");
  CREATE INDEX "abt_tools_parent_id_idx" ON "abt_tools" USING btree ("_parent_id");
  CREATE INDEX "abt_langs_order_idx" ON "abt_langs" USING btree ("_order");
  CREATE INDEX "abt_langs_parent_id_idx" ON "abt_langs" USING btree ("_parent_id");
  CREATE INDEX "abt_social_order_idx" ON "abt_social" USING btree ("_order");
  CREATE INDEX "abt_social_parent_id_idx" ON "abt_social" USING btree ("_parent_id");
  CREATE INDEX "u_ov_order_idx" ON "u_ov" USING btree ("_order");
  CREATE INDEX "u_ov_parent_id_idx" ON "u_ov" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_ov_locales_locale_parent_id_unique" ON "u_ov_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_intro_order_idx" ON "u_intro" USING btree ("_order");
  CREATE INDEX "u_intro_parent_id_idx" ON "u_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_intro_locales_locale_parent_id_unique" ON "u_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_rows_order_idx" ON "u_rows" USING btree ("_order");
  CREATE INDEX "u_rows_parent_id_idx" ON "u_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_rows_locales_locale_parent_id_unique" ON "u_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_phases_order_idx" ON "u_phases" USING btree ("_order");
  CREATE INDEX "u_phases_parent_id_idx" ON "u_phases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_phases_locales_locale_parent_id_unique" ON "u_phases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_jn_intro_order_idx" ON "u_jn_intro" USING btree ("_order");
  CREATE INDEX "u_jn_intro_parent_id_idx" ON "u_jn_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_jn_intro_locales_locale_parent_id_unique" ON "u_jn_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_stages_order_idx" ON "u_stages" USING btree ("_order");
  CREATE INDEX "u_stages_parent_id_idx" ON "u_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_stages_locales_locale_parent_id_unique" ON "u_stages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_jn_bul_order_idx" ON "u_jn_bul" USING btree ("_order");
  CREATE INDEX "u_jn_bul_parent_id_idx" ON "u_jn_bul" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_jn_bul_locales_locale_parent_id_unique" ON "u_jn_bul_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_jn_qa_order_idx" ON "u_jn_qa" USING btree ("_order");
  CREATE INDEX "u_jn_qa_parent_id_idx" ON "u_jn_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_jn_qa_locales_locale_parent_id_unique" ON "u_jn_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_pr_intro_order_idx" ON "u_pr_intro" USING btree ("_order");
  CREATE INDEX "u_pr_intro_parent_id_idx" ON "u_pr_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_pr_intro_locales_locale_parent_id_unique" ON "u_pr_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_pr_ans_order_idx" ON "u_pr_ans" USING btree ("_order");
  CREATE INDEX "u_pr_ans_parent_id_idx" ON "u_pr_ans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_pr_ans_locales_locale_parent_id_unique" ON "u_pr_ans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_pr_qa_order_idx" ON "u_pr_qa" USING btree ("_order");
  CREATE INDEX "u_pr_qa_parent_id_idx" ON "u_pr_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_pr_qa_locales_locale_parent_id_unique" ON "u_pr_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_c_bi_order_idx" ON "u_c_bi" USING btree ("_order");
  CREATE INDEX "u_c_bi_parent_id_idx" ON "u_c_bi" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_c_bi_locales_locale_parent_id_unique" ON "u_c_bi_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_c_ch_order_idx" ON "u_c_ch" USING btree ("_order");
  CREATE INDEX "u_c_ch_parent_id_idx" ON "u_c_ch" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_c_ch_locales_locale_parent_id_unique" ON "u_c_ch_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_c_mo_order_idx" ON "u_c_mo" USING btree ("_order");
  CREATE INDEX "u_c_mo_parent_id_idx" ON "u_c_mo" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_c_mo_locales_locale_parent_id_unique" ON "u_c_mo_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_c_pp_order_idx" ON "u_c_pp" USING btree ("_order");
  CREATE INDEX "u_c_pp_parent_id_idx" ON "u_c_pp" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_c_pp_locales_locale_parent_id_unique" ON "u_c_pp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_cards_order_idx" ON "u_cards" USING btree ("_order");
  CREATE INDEX "u_cards_parent_id_idx" ON "u_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_cards_locales_locale_parent_id_unique" ON "u_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_sk_intro_order_idx" ON "u_sk_intro" USING btree ("_order");
  CREATE INDEX "u_sk_intro_parent_id_idx" ON "u_sk_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_sk_intro_locales_locale_parent_id_unique" ON "u_sk_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_sk_qa_order_idx" ON "u_sk_qa" USING btree ("_order");
  CREATE INDEX "u_sk_qa_parent_id_idx" ON "u_sk_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_sk_qa_locales_locale_parent_id_unique" ON "u_sk_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_ln_ans_order_idx" ON "u_ln_ans" USING btree ("_order");
  CREATE INDEX "u_ln_ans_parent_id_idx" ON "u_ln_ans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_ln_ans_locales_locale_parent_id_unique" ON "u_ln_ans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "u_ln_qa_order_idx" ON "u_ln_qa" USING btree ("_order");
  CREATE INDEX "u_ln_qa_parent_id_idx" ON "u_ln_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "u_ln_qa_locales_locale_parent_id_unique" ON "u_ln_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_order_idx" ON "pages_blocks" USING btree ("_order");
  CREATE INDEX "pages_blocks_parent_id_idx" ON "pages_blocks" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_category_idx" ON "pages_blocks" USING btree ("category_id");
  CREATE UNIQUE INDEX "pages_blocks_locales_locale_parent_id_unique" ON "pages_blocks_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_header_order_idx" ON "projects_blocks_uxui_header" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_header_parent_id_idx" ON "projects_blocks_uxui_header" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_header_path_idx" ON "projects_blocks_uxui_header" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_header_locales_locale_parent_id_unique" ON "projects_blocks_uxui_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_hero_order_idx" ON "projects_blocks_uxui_hero" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_hero_parent_id_idx" ON "projects_blocks_uxui_hero" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_hero_path_idx" ON "projects_blocks_uxui_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_hero_locales_locale_parent_id_unique" ON "projects_blocks_uxui_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_ov_order_idx" ON "b_ov" USING btree ("_order");
  CREATE INDEX "b_ov_parent_id_idx" ON "b_ov" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_ov_locales_locale_parent_id_unique" ON "b_ov_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_overview_order_idx" ON "projects_blocks_uxui_overview" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_overview_parent_id_idx" ON "projects_blocks_uxui_overview" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_overview_path_idx" ON "projects_blocks_uxui_overview" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_overview_locales_locale_parent_id_uniqu" ON "projects_blocks_uxui_overview_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_intro_order_idx" ON "b_intro" USING btree ("_order");
  CREATE INDEX "b_intro_parent_id_idx" ON "b_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_intro_locales_locale_parent_id_unique" ON "b_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_intro_order_idx" ON "projects_blocks_uxui_intro" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_intro_parent_id_idx" ON "projects_blocks_uxui_intro" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_intro_path_idx" ON "projects_blocks_uxui_intro" USING btree ("_path");
  CREATE INDEX "projects_blocks_uxui_problem_solution_order_idx" ON "projects_blocks_uxui_problem_solution" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_problem_solution_parent_id_idx" ON "projects_blocks_uxui_problem_solution" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_problem_solution_path_idx" ON "projects_blocks_uxui_problem_solution" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_problem_solution_locales_locale_parent_" ON "projects_blocks_uxui_problem_solution_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_rows_order_idx" ON "b_rows" USING btree ("_order");
  CREATE INDEX "b_rows_parent_id_idx" ON "b_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_rows_locales_locale_parent_id_unique" ON "b_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_details_order_idx" ON "projects_blocks_uxui_details" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_details_parent_id_idx" ON "projects_blocks_uxui_details" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_details_path_idx" ON "projects_blocks_uxui_details" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_details_locales_locale_parent_id_unique" ON "projects_blocks_uxui_details_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_phases_order_idx" ON "b_phases" USING btree ("_order");
  CREATE INDEX "b_phases_parent_id_idx" ON "b_phases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_phases_locales_locale_parent_id_unique" ON "b_phases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_timeline_order_idx" ON "projects_blocks_uxui_timeline" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_timeline_parent_id_idx" ON "projects_blocks_uxui_timeline" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_timeline_path_idx" ON "projects_blocks_uxui_timeline" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_timeline_locales_locale_parent_id_uniqu" ON "projects_blocks_uxui_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_jn_intro_order_idx" ON "b_jn_intro" USING btree ("_order");
  CREATE INDEX "b_jn_intro_parent_id_idx" ON "b_jn_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_jn_intro_locales_locale_parent_id_unique" ON "b_jn_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_stages_order_idx" ON "b_stages" USING btree ("_order");
  CREATE INDEX "b_stages_parent_id_idx" ON "b_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_stages_locales_locale_parent_id_unique" ON "b_stages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_jn_bul_order_idx" ON "b_jn_bul" USING btree ("_order");
  CREATE INDEX "b_jn_bul_parent_id_idx" ON "b_jn_bul" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_jn_bul_locales_locale_parent_id_unique" ON "b_jn_bul_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_jn_qa_order_idx" ON "b_jn_qa" USING btree ("_order");
  CREATE INDEX "b_jn_qa_parent_id_idx" ON "b_jn_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_jn_qa_locales_locale_parent_id_unique" ON "b_jn_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_journey_order_idx" ON "projects_blocks_uxui_journey" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_journey_parent_id_idx" ON "projects_blocks_uxui_journey" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_journey_path_idx" ON "projects_blocks_uxui_journey" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_journey_locales_locale_parent_id_unique" ON "projects_blocks_uxui_journey_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_pr_intro_order_idx" ON "b_pr_intro" USING btree ("_order");
  CREATE INDEX "b_pr_intro_parent_id_idx" ON "b_pr_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_pr_intro_locales_locale_parent_id_unique" ON "b_pr_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_pr_ans_order_idx" ON "b_pr_ans" USING btree ("_order");
  CREATE INDEX "b_pr_ans_parent_id_idx" ON "b_pr_ans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_pr_ans_locales_locale_parent_id_unique" ON "b_pr_ans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_pr_qa_order_idx" ON "b_pr_qa" USING btree ("_order");
  CREATE INDEX "b_pr_qa_parent_id_idx" ON "b_pr_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_pr_qa_locales_locale_parent_id_unique" ON "b_pr_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_c_bi_order_idx" ON "b_c_bi" USING btree ("_order");
  CREATE INDEX "b_c_bi_parent_id_idx" ON "b_c_bi" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_c_bi_locales_locale_parent_id_unique" ON "b_c_bi_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_c_ch_order_idx" ON "b_c_ch" USING btree ("_order");
  CREATE INDEX "b_c_ch_parent_id_idx" ON "b_c_ch" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_c_ch_locales_locale_parent_id_unique" ON "b_c_ch_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_c_mo_order_idx" ON "b_c_mo" USING btree ("_order");
  CREATE INDEX "b_c_mo_parent_id_idx" ON "b_c_mo" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_c_mo_locales_locale_parent_id_unique" ON "b_c_mo_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_c_pp_order_idx" ON "b_c_pp" USING btree ("_order");
  CREATE INDEX "b_c_pp_parent_id_idx" ON "b_c_pp" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_c_pp_locales_locale_parent_id_unique" ON "b_c_pp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_cards_order_idx" ON "b_cards" USING btree ("_order");
  CREATE INDEX "b_cards_parent_id_idx" ON "b_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_cards_locales_locale_parent_id_unique" ON "b_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_personas_order_idx" ON "projects_blocks_uxui_personas" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_personas_parent_id_idx" ON "projects_blocks_uxui_personas" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_personas_path_idx" ON "projects_blocks_uxui_personas" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_personas_locales_locale_parent_id_uniqu" ON "projects_blocks_uxui_personas_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_sk_intro_order_idx" ON "b_sk_intro" USING btree ("_order");
  CREATE INDEX "b_sk_intro_parent_id_idx" ON "b_sk_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_sk_intro_locales_locale_parent_id_unique" ON "b_sk_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_sk_qa_order_idx" ON "b_sk_qa" USING btree ("_order");
  CREATE INDEX "b_sk_qa_parent_id_idx" ON "b_sk_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_sk_qa_locales_locale_parent_id_unique" ON "b_sk_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_sketches_order_idx" ON "projects_blocks_uxui_sketches" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_sketches_parent_id_idx" ON "projects_blocks_uxui_sketches" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_sketches_path_idx" ON "projects_blocks_uxui_sketches" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_sketches_locales_locale_parent_id_uniqu" ON "projects_blocks_uxui_sketches_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_ln_ans_order_idx" ON "b_ln_ans" USING btree ("_order");
  CREATE INDEX "b_ln_ans_parent_id_idx" ON "b_ln_ans" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_ln_ans_locales_locale_parent_id_unique" ON "b_ln_ans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "b_ln_qa_order_idx" ON "b_ln_qa" USING btree ("_order");
  CREATE INDEX "b_ln_qa_parent_id_idx" ON "b_ln_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "b_ln_qa_locales_locale_parent_id_unique" ON "b_ln_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_blocks_uxui_learnings_order_idx" ON "projects_blocks_uxui_learnings" USING btree ("_order");
  CREATE INDEX "projects_blocks_uxui_learnings_parent_id_idx" ON "projects_blocks_uxui_learnings" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_uxui_learnings_path_idx" ON "projects_blocks_uxui_learnings" USING btree ("_path");
  CREATE UNIQUE INDEX "projects_blocks_uxui_learnings_locales_locale_parent_id_uniq" ON "projects_blocks_uxui_learnings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_project_overview_order_idx" ON "projects_case_study_project_overview" USING btree ("_order");
  CREATE INDEX "projects_case_study_project_overview_parent_id_idx" ON "projects_case_study_project_overview" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_project_overview_locales_locale_parent_i" ON "projects_case_study_project_overview_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_intro_order_idx" ON "projects_case_study_intro" USING btree ("_order");
  CREATE INDEX "projects_case_study_intro_parent_id_idx" ON "projects_case_study_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_intro_locales_locale_parent_id_unique" ON "projects_case_study_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_details_rows_order_idx" ON "projects_case_study_details_rows" USING btree ("_order");
  CREATE INDEX "projects_case_study_details_rows_parent_id_idx" ON "projects_case_study_details_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_details_rows_locales_locale_parent_id_un" ON "projects_case_study_details_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_timeline_phases_order_idx" ON "projects_case_study_timeline_phases" USING btree ("_order");
  CREATE INDEX "projects_case_study_timeline_phases_parent_id_idx" ON "projects_case_study_timeline_phases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_timeline_phases_locales_locale_parent_id" ON "projects_case_study_timeline_phases_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_journey_intro_order_idx" ON "projects_case_study_journey_intro" USING btree ("_order");
  CREATE INDEX "projects_case_study_journey_intro_parent_id_idx" ON "projects_case_study_journey_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_journey_intro_locales_locale_parent_id_u" ON "projects_case_study_journey_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_journey_stages_order_idx" ON "projects_case_study_journey_stages" USING btree ("_order");
  CREATE INDEX "projects_case_study_journey_stages_parent_id_idx" ON "projects_case_study_journey_stages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_journey_stages_locales_locale_parent_id_" ON "projects_case_study_journey_stages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_journey_qa_bullets_order_idx" ON "projects_case_study_journey_qa_bullets" USING btree ("_order");
  CREATE INDEX "projects_case_study_journey_qa_bullets_parent_id_idx" ON "projects_case_study_journey_qa_bullets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_journey_qa_bullets_locales_locale_parent" ON "projects_case_study_journey_qa_bullets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_journey_qa_order_idx" ON "projects_case_study_journey_qa" USING btree ("_order");
  CREATE INDEX "projects_case_study_journey_qa_parent_id_idx" ON "projects_case_study_journey_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_journey_qa_locales_locale_parent_id_uniq" ON "projects_case_study_journey_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_intro_order_idx" ON "projects_case_study_personas_intro" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_intro_parent_id_idx" ON "projects_case_study_personas_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_intro_locales_locale_parent_id_" ON "projects_case_study_personas_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_qa_answer_order_idx" ON "projects_case_study_personas_qa_answer" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_qa_answer_parent_id_idx" ON "projects_case_study_personas_qa_answer" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_qa_answer_locales_locale_parent" ON "projects_case_study_personas_qa_answer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_qa_order_idx" ON "projects_case_study_personas_qa" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_qa_parent_id_idx" ON "projects_case_study_personas_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_qa_locales_locale_parent_id_uni" ON "projects_case_study_personas_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_cards_basic_info_order_idx" ON "projects_case_study_personas_cards_basic_info" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_cards_basic_info_parent_id_idx" ON "projects_case_study_personas_cards_basic_info" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_cards_basic_info_locales_locale" ON "projects_case_study_personas_cards_basic_info_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_cards_channels_order_idx" ON "projects_case_study_personas_cards_channels" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_cards_channels_parent_id_idx" ON "projects_case_study_personas_cards_channels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_cards_channels_locales_locale_p" ON "projects_case_study_personas_cards_channels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_cards_motivations_order_idx" ON "projects_case_study_personas_cards_motivations" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_cards_motivations_parent_id_idx" ON "projects_case_study_personas_cards_motivations" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_cards_motivations_locales_local" ON "projects_case_study_personas_cards_motivations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_cards_pain_points_order_idx" ON "projects_case_study_personas_cards_pain_points" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_cards_pain_points_parent_id_idx" ON "projects_case_study_personas_cards_pain_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_cards_pain_points_locales_local" ON "projects_case_study_personas_cards_pain_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_personas_cards_order_idx" ON "projects_case_study_personas_cards" USING btree ("_order");
  CREATE INDEX "projects_case_study_personas_cards_parent_id_idx" ON "projects_case_study_personas_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_personas_cards_locales_locale_parent_id_" ON "projects_case_study_personas_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_sketches_intro_order_idx" ON "projects_case_study_sketches_intro" USING btree ("_order");
  CREATE INDEX "projects_case_study_sketches_intro_parent_id_idx" ON "projects_case_study_sketches_intro" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_sketches_intro_locales_locale_parent_id_" ON "projects_case_study_sketches_intro_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_sketches_qa_order_idx" ON "projects_case_study_sketches_qa" USING btree ("_order");
  CREATE INDEX "projects_case_study_sketches_qa_parent_id_idx" ON "projects_case_study_sketches_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_sketches_qa_locales_locale_parent_id_uni" ON "projects_case_study_sketches_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_learnings_qa_answer_order_idx" ON "projects_case_study_learnings_qa_answer" USING btree ("_order");
  CREATE INDEX "projects_case_study_learnings_qa_answer_parent_id_idx" ON "projects_case_study_learnings_qa_answer" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_learnings_qa_answer_locales_locale_paren" ON "projects_case_study_learnings_qa_answer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_case_study_learnings_qa_order_idx" ON "projects_case_study_learnings_qa" USING btree ("_order");
  CREATE INDEX "projects_case_study_learnings_qa_parent_id_idx" ON "projects_case_study_learnings_qa" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_case_study_learnings_qa_locales_locale_parent_id_un" ON "projects_case_study_learnings_qa_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");
  CREATE INDEX "projects_image_idx" ON "projects" USING btree ("image_id");
  CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "home_locales_locale_parent_id_unique" ON "home_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_education_order_idx" ON "about_education" USING btree ("_order");
  CREATE INDEX "about_education_parent_id_idx" ON "about_education" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_education_locales_locale_parent_id_unique" ON "about_education_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_tools_order_idx" ON "about_tools" USING btree ("_order");
  CREATE INDEX "about_tools_parent_id_idx" ON "about_tools" USING btree ("_parent_id");
  CREATE INDEX "about_languages_order_idx" ON "about_languages" USING btree ("_order");
  CREATE INDEX "about_languages_parent_id_idx" ON "about_languages" USING btree ("_parent_id");
  CREATE INDEX "about_social_links_order_idx" ON "about_social_links" USING btree ("_order");
  CREATE INDEX "about_social_links_parent_id_idx" ON "about_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_locales_locale_parent_id_unique" ON "about_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "career_experience_responsibilities_order_idx" ON "career_experience_responsibilities" USING btree ("_order");
  CREATE INDEX "career_experience_responsibilities_parent_id_idx" ON "career_experience_responsibilities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "career_experience_responsibilities_locales_locale_parent_id_" ON "career_experience_responsibilities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "career_experience_order_idx" ON "career_experience" USING btree ("_order");
  CREATE INDEX "career_experience_parent_id_idx" ON "career_experience" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "career_experience_locales_locale_parent_id_unique" ON "career_experience_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "career_locales_locale_parent_id_unique" ON "career_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ui_strings_strings_order_idx" ON "ui_strings_strings" USING btree ("_order");
  CREATE INDEX "ui_strings_strings_parent_id_idx" ON "ui_strings_strings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ui_strings_strings_locales_locale_parent_id_unique" ON "ui_strings_strings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_nav_items_order_idx" ON "site_nav_items" USING btree ("_order");
  CREATE INDEX "site_nav_items_parent_id_idx" ON "site_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_nav_items_locales_locale_parent_id_unique" ON "site_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_locales_locale_parent_id_unique" ON "site_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "car_resp" CASCADE;
  DROP TABLE "car_resp_locales" CASCADE;
  DROP TABLE "car_exp" CASCADE;
  DROP TABLE "car_exp_locales" CASCADE;
  DROP TABLE "abt_edu" CASCADE;
  DROP TABLE "abt_edu_locales" CASCADE;
  DROP TABLE "abt_tools" CASCADE;
  DROP TABLE "abt_langs" CASCADE;
  DROP TABLE "abt_social" CASCADE;
  DROP TABLE "u_ov" CASCADE;
  DROP TABLE "u_ov_locales" CASCADE;
  DROP TABLE "u_intro" CASCADE;
  DROP TABLE "u_intro_locales" CASCADE;
  DROP TABLE "u_rows" CASCADE;
  DROP TABLE "u_rows_locales" CASCADE;
  DROP TABLE "u_phases" CASCADE;
  DROP TABLE "u_phases_locales" CASCADE;
  DROP TABLE "u_jn_intro" CASCADE;
  DROP TABLE "u_jn_intro_locales" CASCADE;
  DROP TABLE "u_stages" CASCADE;
  DROP TABLE "u_stages_locales" CASCADE;
  DROP TABLE "u_jn_bul" CASCADE;
  DROP TABLE "u_jn_bul_locales" CASCADE;
  DROP TABLE "u_jn_qa" CASCADE;
  DROP TABLE "u_jn_qa_locales" CASCADE;
  DROP TABLE "u_pr_intro" CASCADE;
  DROP TABLE "u_pr_intro_locales" CASCADE;
  DROP TABLE "u_pr_ans" CASCADE;
  DROP TABLE "u_pr_ans_locales" CASCADE;
  DROP TABLE "u_pr_qa" CASCADE;
  DROP TABLE "u_pr_qa_locales" CASCADE;
  DROP TABLE "u_c_bi" CASCADE;
  DROP TABLE "u_c_bi_locales" CASCADE;
  DROP TABLE "u_c_ch" CASCADE;
  DROP TABLE "u_c_ch_locales" CASCADE;
  DROP TABLE "u_c_mo" CASCADE;
  DROP TABLE "u_c_mo_locales" CASCADE;
  DROP TABLE "u_c_pp" CASCADE;
  DROP TABLE "u_c_pp_locales" CASCADE;
  DROP TABLE "u_cards" CASCADE;
  DROP TABLE "u_cards_locales" CASCADE;
  DROP TABLE "u_sk_intro" CASCADE;
  DROP TABLE "u_sk_intro_locales" CASCADE;
  DROP TABLE "u_sk_qa" CASCADE;
  DROP TABLE "u_sk_qa_locales" CASCADE;
  DROP TABLE "u_ln_ans" CASCADE;
  DROP TABLE "u_ln_ans_locales" CASCADE;
  DROP TABLE "u_ln_qa" CASCADE;
  DROP TABLE "u_ln_qa_locales" CASCADE;
  DROP TABLE "pages_blocks" CASCADE;
  DROP TABLE "pages_blocks_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_header" CASCADE;
  DROP TABLE "projects_blocks_uxui_header_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_hero" CASCADE;
  DROP TABLE "projects_blocks_uxui_hero_locales" CASCADE;
  DROP TABLE "b_ov" CASCADE;
  DROP TABLE "b_ov_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_overview" CASCADE;
  DROP TABLE "projects_blocks_uxui_overview_locales" CASCADE;
  DROP TABLE "b_intro" CASCADE;
  DROP TABLE "b_intro_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_intro" CASCADE;
  DROP TABLE "projects_blocks_uxui_problem_solution" CASCADE;
  DROP TABLE "projects_blocks_uxui_problem_solution_locales" CASCADE;
  DROP TABLE "b_rows" CASCADE;
  DROP TABLE "b_rows_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_details" CASCADE;
  DROP TABLE "projects_blocks_uxui_details_locales" CASCADE;
  DROP TABLE "b_phases" CASCADE;
  DROP TABLE "b_phases_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_timeline" CASCADE;
  DROP TABLE "projects_blocks_uxui_timeline_locales" CASCADE;
  DROP TABLE "b_jn_intro" CASCADE;
  DROP TABLE "b_jn_intro_locales" CASCADE;
  DROP TABLE "b_stages" CASCADE;
  DROP TABLE "b_stages_locales" CASCADE;
  DROP TABLE "b_jn_bul" CASCADE;
  DROP TABLE "b_jn_bul_locales" CASCADE;
  DROP TABLE "b_jn_qa" CASCADE;
  DROP TABLE "b_jn_qa_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_journey" CASCADE;
  DROP TABLE "projects_blocks_uxui_journey_locales" CASCADE;
  DROP TABLE "b_pr_intro" CASCADE;
  DROP TABLE "b_pr_intro_locales" CASCADE;
  DROP TABLE "b_pr_ans" CASCADE;
  DROP TABLE "b_pr_ans_locales" CASCADE;
  DROP TABLE "b_pr_qa" CASCADE;
  DROP TABLE "b_pr_qa_locales" CASCADE;
  DROP TABLE "b_c_bi" CASCADE;
  DROP TABLE "b_c_bi_locales" CASCADE;
  DROP TABLE "b_c_ch" CASCADE;
  DROP TABLE "b_c_ch_locales" CASCADE;
  DROP TABLE "b_c_mo" CASCADE;
  DROP TABLE "b_c_mo_locales" CASCADE;
  DROP TABLE "b_c_pp" CASCADE;
  DROP TABLE "b_c_pp_locales" CASCADE;
  DROP TABLE "b_cards" CASCADE;
  DROP TABLE "b_cards_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_personas" CASCADE;
  DROP TABLE "projects_blocks_uxui_personas_locales" CASCADE;
  DROP TABLE "b_sk_intro" CASCADE;
  DROP TABLE "b_sk_intro_locales" CASCADE;
  DROP TABLE "b_sk_qa" CASCADE;
  DROP TABLE "b_sk_qa_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_sketches" CASCADE;
  DROP TABLE "projects_blocks_uxui_sketches_locales" CASCADE;
  DROP TABLE "b_ln_ans" CASCADE;
  DROP TABLE "b_ln_ans_locales" CASCADE;
  DROP TABLE "b_ln_qa" CASCADE;
  DROP TABLE "b_ln_qa_locales" CASCADE;
  DROP TABLE "projects_blocks_uxui_learnings" CASCADE;
  DROP TABLE "projects_blocks_uxui_learnings_locales" CASCADE;
  DROP TABLE "projects_case_study_project_overview" CASCADE;
  DROP TABLE "projects_case_study_project_overview_locales" CASCADE;
  DROP TABLE "projects_case_study_intro" CASCADE;
  DROP TABLE "projects_case_study_intro_locales" CASCADE;
  DROP TABLE "projects_case_study_details_rows" CASCADE;
  DROP TABLE "projects_case_study_details_rows_locales" CASCADE;
  DROP TABLE "projects_case_study_timeline_phases" CASCADE;
  DROP TABLE "projects_case_study_timeline_phases_locales" CASCADE;
  DROP TABLE "projects_case_study_journey_intro" CASCADE;
  DROP TABLE "projects_case_study_journey_intro_locales" CASCADE;
  DROP TABLE "projects_case_study_journey_stages" CASCADE;
  DROP TABLE "projects_case_study_journey_stages_locales" CASCADE;
  DROP TABLE "projects_case_study_journey_qa_bullets" CASCADE;
  DROP TABLE "projects_case_study_journey_qa_bullets_locales" CASCADE;
  DROP TABLE "projects_case_study_journey_qa" CASCADE;
  DROP TABLE "projects_case_study_journey_qa_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_intro" CASCADE;
  DROP TABLE "projects_case_study_personas_intro_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_qa_answer" CASCADE;
  DROP TABLE "projects_case_study_personas_qa_answer_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_qa" CASCADE;
  DROP TABLE "projects_case_study_personas_qa_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_basic_info" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_basic_info_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_channels" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_channels_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_motivations" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_motivations_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_pain_points" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_pain_points_locales" CASCADE;
  DROP TABLE "projects_case_study_personas_cards" CASCADE;
  DROP TABLE "projects_case_study_personas_cards_locales" CASCADE;
  DROP TABLE "projects_case_study_sketches_intro" CASCADE;
  DROP TABLE "projects_case_study_sketches_intro_locales" CASCADE;
  DROP TABLE "projects_case_study_sketches_qa" CASCADE;
  DROP TABLE "projects_case_study_sketches_qa_locales" CASCADE;
  DROP TABLE "projects_case_study_learnings_qa_answer" CASCADE;
  DROP TABLE "projects_case_study_learnings_qa_answer_locales" CASCADE;
  DROP TABLE "projects_case_study_learnings_qa" CASCADE;
  DROP TABLE "projects_case_study_learnings_qa_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_locales" CASCADE;
  DROP TABLE "about_education" CASCADE;
  DROP TABLE "about_education_locales" CASCADE;
  DROP TABLE "about_tools" CASCADE;
  DROP TABLE "about_languages" CASCADE;
  DROP TABLE "about_social_links" CASCADE;
  DROP TABLE "about" CASCADE;
  DROP TABLE "about_locales" CASCADE;
  DROP TABLE "career_experience_responsibilities" CASCADE;
  DROP TABLE "career_experience_responsibilities_locales" CASCADE;
  DROP TABLE "career_experience" CASCADE;
  DROP TABLE "career_experience_locales" CASCADE;
  DROP TABLE "career" CASCADE;
  DROP TABLE "career_locales" CASCADE;
  DROP TABLE "ui_strings_strings" CASCADE;
  DROP TABLE "ui_strings_strings_locales" CASCADE;
  DROP TABLE "ui_strings" CASCADE;
  DROP TABLE "site_nav_items" CASCADE;
  DROP TABLE "site_nav_items_locales" CASCADE;
  DROP TABLE "site" CASCADE;
  DROP TABLE "site_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_pages_blocks_block_type";
  DROP TYPE "public"."enum_pages_blocks_source_category";
  DROP TYPE "public"."enum_pages_blocks_source_placement";
  DROP TYPE "public"."enum_pages_blocks_layout_variant";
  DROP TYPE "public"."enum_pages_blocks_placement";
  DROP TYPE "public"."enum_projects_type";
  DROP TYPE "public"."enum_projects_placement";
  DROP TYPE "public"."enum_projects_size";`)
}
