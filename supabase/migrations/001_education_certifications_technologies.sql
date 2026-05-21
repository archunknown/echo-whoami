-- ============================================================
-- Migration 001: Education table, certifications category,
--                technology logos, project custom link
-- ============================================================

-- 1. Education table
-- Categories: 'university' | 'technical' | 'certification' | 'complementary'
CREATE TABLE IF NOT EXISTS education (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       jsonb NOT NULL,           -- { en: '...', es: '...' }
    institution jsonb NOT NULL,           -- { en: '...', es: '...' }
    description jsonb,                    -- { en: '...', es: '...' } optional
    category    text NOT NULL CHECK (
        category IN ('university', 'technical', 'certification', 'complementary')
    ),
    start_date  date,
    end_date    date,                     -- null = present
    is_current  boolean DEFAULT false,
    credential_url text,
    is_published boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at  timestamptz DEFAULT now()
);

-- 2. Add category to certifications
ALTER TABLE certifications
    ADD COLUMN IF NOT EXISTS category text DEFAULT 'certification'
        CHECK (category IN ('university', 'technical', 'certification', 'complementary'));

-- 3. Add logo_url to technologies (for official logos, as alternative to icon_slug)
ALTER TABLE technologies
    ADD COLUMN IF NOT EXISTS logo_url text;

-- 4. Add custom link fields to projects
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS custom_link text,
    ADD COLUMN IF NOT EXISTS custom_link_label text;

-- 5. Add github_url and linkedin_url to profile (if not already)
ALTER TABLE profile
    ADD COLUMN IF NOT EXISTS linkedin_url text,
    ADD COLUMN IF NOT EXISTS twitter_url  text;

-- 6. Make cover_image_url nullable in projects (was NOT NULL, causing insert issues)
ALTER TABLE projects
    ALTER COLUMN cover_image_url DROP NOT NULL;
