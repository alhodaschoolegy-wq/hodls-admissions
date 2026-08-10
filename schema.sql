-- ============================================================================
-- 🏛️ HODLS School Admission System — Supabase PostgreSQL Schema
-- ============================================================================

-- 1. Create Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id BIGSERIAL PRIMARY KEY,
    application_id VARCHAR(32) UNIQUE NOT NULL,
    stage VARCHAR(64) NOT NULL,
    grade VARCHAR(64) NOT NULL,
    second_language VARCHAR(64) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(14) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    governorate VARCHAR(64) NOT NULL,
    gender VARCHAR(16) NOT NULL,
    age_text VARCHAR(128),
    father_name VARCHAR(255) NOT NULL,
    father_job VARCHAR(255),
    mother_name VARCHAR(255) NOT NULL,
    mother_job VARCHAR(255),
    guardian_phone VARCHAR(20) NOT NULL,
    guardian_phone_alt VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    previous_school VARCHAR(255),
    notes TEXT,
    status VARCHAR(64) DEFAULT 'قيد المراجعة',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Admin Users Table with RBAC (Master Admin vs Staff Admin)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'staff_admin', -- 'master_admin' or 'staff_admin'
    status VARCHAR(32) DEFAULT 'active',    -- 'active' or 'disabled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_apps_national_id ON public.applications (national_id);
CREATE INDEX IF NOT EXISTS idx_apps_application_id ON public.applications (application_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_apps_stage_grade ON public.applications (stage, grade);
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON public.applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.admin_users (username);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 5. Public and Service Role Policies
CREATE POLICY "Allow public insert application" ON public.applications
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow read application status by national_id or app_id" ON public.applications
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service Role Full Access Applications" ON public.applications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access Users" ON public.admin_users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Create School Settings Table
CREATE TABLE IF NOT EXISTS public.school_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'current_settings',
    academic_year VARCHAR(64) DEFAULT '2026 / 2027',
    academic_year_start INT DEFAULT 2026,
    parent_edits_enabled BOOLEAN DEFAULT TRUE,
    parent_edit_deadline TIMESTAMPTZ DEFAULT '2026-08-31 23:59:59+03',
    school_photos JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read school settings" ON public.school_settings
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service Role Full Access Settings" ON public.school_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);
