-- 0. Drop existing tables if they exist to allow recreating the schema
DROP TABLE IF EXISTS seo_articles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
    -- Also drop old tables from the previous version if they exist
    DROP TABLE IF EXISTS concerns CASCADE;
    DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. Create Departments Table (MEN'S HEALTH, WOMEN'S HEALTH, SPORTS, BEAUTY)
CREATE TABLE departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT
);

-- 2. Create Categories Table (CAPSULES, WHEY, CREAMS)
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    department_id TEXT REFERENCES departments(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT
);

-- 3. Create Tags & Concerns Table (LOW LIBIDO, MASS GAINER, ACNE)
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

-- 4. Create Locations Table (KIGALI, RUBAVU)
CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

-- 5. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    description TEXT,
    ai_context TEXT, -- Added context for AI content generation
    department_id UUID REFERENCES departments(id),
    category_id UUID REFERENCES categories(id),
    tags TEXT[], -- array of tag slugs for easy matching
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rating NUMERIC NOT NULL,
    reviews INTEGER NOT NULL,
    image TEXT NOT NULL
);

-- 6. Create SEO Articles Table
CREATE TABLE IF NOT EXISTS seo_articles (
    slug TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    edited_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEED DATA (EXAMPLE FOR MEN'S HEALTH)
-- ==========================================

INSERT INTO departments (id, name, slug, description) VALUES
('mens-health', 'Men''s Health', 'mens-health', 'Ibisubizo by''abagabo'),
('sports-nutrition', 'Sports Nutrition', 'sports-nutrition', 'Inyongeramusaruro za Siporo');

INSERT INTO categories (id, department_id, name, slug, description) VALUES
('ibinini', 'mens-health', 'Ibinini (Capsules)', 'ibinini', 'umuti wizewe'),
('amavuta', 'mens-health', 'Amavuta (Creams)', 'amavuta', 'Amavuta yo kongera ingufu'),
('whey-protein', 'sports-nutrition', 'Whey Protein', 'whey-protein', 'Kongera imikaya');

INSERT INTO tags (id, name, slug) VALUES
('kurangiza-vuba', 'Kurangiza Vuba', 'kurangiza-vuba'),
('kongera-igitsina', 'Kongera Igitsina', 'kongera-igitsina'),
('kubura-ubushake', 'Kubura Ubushake', 'kubura-ubushake'),
('muscle-growth', 'Kongera Imikaya', 'muscle-growth');

INSERT INTO locations (id, name, slug) VALUES
('kigali', 'Muri Kigali', 'kigali'),
('rwanda', 'Mu Rwanda', 'rwanda');

INSERT INTO products (name, price, image_url, description, ai_context, department_id, category_id, tags)
VALUES 
('Maxman Capsules', 25000, 'https://cdn2.arogga.com/medicine/44/44231-Maxman-c9xj.png', 'Nyongeramusaruro ifasha kongera ingufu...', 'Contains horny goat weed and maca root. Focus on stamina and blood flow.', (SELECT id FROM departments WHERE slug = 'mens-health'), (SELECT id FROM categories WHERE slug = 'ibinini'), ARRAY['kurangiza-vuba', 'kongera-igitsina']),
('Titan Gel Gold', 35000, 'https://m.media-amazon.com/images/I/71fl3xZuzwL._AC_SL1500_.jpg', 'Amavuta yizewe mu kugarura icyizere...', 'High concentration of succinic acid. Safe for daily skin application.', (SELECT id FROM departments WHERE slug = 'mens-health'), (SELECT id FROM categories WHERE slug = 'amavuta'), ARRAY['kurangiza-vuba', 'kubura-ubushake']);
