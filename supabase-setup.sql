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
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id),
    category_id TEXT REFERENCES categories(id),
    tags TEXT[] NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    rating NUMERIC NOT NULL,
    reviews INTEGER NOT NULL,
    image TEXT NOT NULL
);

-- 6. Create SEO Articles Table
CREATE TABLE seo_articles (
    slug TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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

INSERT INTO products (id, brand, name, slug, department_id, category_id, tags, price, currency, rating, reviews, image) VALUES
('prod_1', 'Maxman', 'Maxman Capsules', 'maxman-capsules', 'mens-health', 'ibinini', ARRAY['kurangiza-vuba', 'kongera-igitsina', 'kubura-ubushake'], 25000, 'RWF', 4.8, 542, 'https://www.arogga.com/_next/image?url=https%3A%2F%2Fcdn2.arogga.com%2FeyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNDRcLzQ0MjMxLU1heG1hbi1jOXhqLnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTAwMCwiaGVpZ2h0IjoxMDAwLCJmaXQiOiJvdXRzaWRlIn0sIm92ZXJsYXlXaXRoIjp7ImJ1Y2tldCI6ImFyb2dnYSIsImtleSI6Im1pc2NcL3dtLnBuZyIsImFscGhhIjo5MH19fQ%3D%3D&w=1280&q=75'),
('prod_2', 'Titan Gel', 'Titan Gel Gold', 'titan-gel-gold', 'mens-health', 'amavuta', ARRAY['kurangiza-vuba', 'kongera-igitsina'], 20000, 'RWF', 4.9, 890, 'https://m.media-amazon.com/images/I/71fl3xZuzwL._AC_SL1500_.jpg');
