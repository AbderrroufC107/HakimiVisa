-- ============================================
-- Data Normalization Script
-- Run on the production database (VPS)
-- Usage: mysql -u root -p hakimi_visa < normalize_data.sql
-- Or: docker exec -i hakimivisa-mysql mysql -u root -p hakimi_visa < normalize_data.sql
-- ============================================

START TRANSACTION;

-- ============================================
-- 1. Populate countries table from distinct visa_cases values
-- ============================================
INSERT IGNORE INTO countries (id, name, createdAt) VALUES
  (UUID(), 'Allemagne', NOW()),
  (UUID(), 'Canada', NOW()),
  (UUID(), 'Espagne', NOW()),
  (UUID(), 'France', NOW()),
  (UUID(), 'Italie', NOW()),
  (UUID(), 'Pays-Bas', NOW()),
  (UUID(), 'Royaume-Uni', NOW()),
  (UUID(), 'États-Unis', NOW());

-- ============================================
-- 2. Populate visa_types table from distinct visa_cases values
-- ============================================
INSERT IGNORE INTO visa_types (id, name, createdAt) VALUES
  (UUID(), 'B1/B2', NOW()),
  (UUID(), 'Étudiant', NOW()),
  (UUID(), 'Long Séjour', NOW()),
  (UUID(), 'Schengen', NOW()),
  (UUID(), 'Schengen Business', NOW()),
  (UUID(), 'Schengen Family Visit', NOW()),
  (UUID(), 'Touristique', NOW()),
  (UUID(), 'Visiteur', NOW()),
  (UUID(), 'Work Visa', NOW());

-- ============================================
-- 3. Normalize visa_cases.visaCountry
-- ============================================
UPDATE visa_cases SET visaCountry = 'Allemagne' WHERE visaCountry IN ('Germany');
UPDATE visa_cases SET visaCountry = 'Espagne' WHERE visaCountry IN ('Spain');
UPDATE visa_cases SET visaCountry = 'États-Unis' WHERE visaCountry IN ('United States', 'USA');
UPDATE visa_cases SET visaCountry = 'Italie' WHERE visaCountry IN ('Italy');
UPDATE visa_cases SET visaCountry = 'Pays-Bas' WHERE visaCountry IN ('Netherlands');
UPDATE visa_cases SET visaCountry = 'Royaume-Uni' WHERE visaCountry IN ('United Kingdom');

-- ============================================
-- 4. Normalize visa_cases.visaType
-- ============================================
UPDATE visa_cases SET visaType = 'Étudiant' WHERE visaType IN ('Long Stay Student');
UPDATE visa_cases SET visaType = 'Touristique' WHERE visaType IN ('Schengen Tourism');
UPDATE visa_cases SET visaType = 'Visiteur' WHERE visaType IN ('Standard Visitor', 'Visitor Visa');

-- ============================================
-- 5. Normalize clients.nationality
-- ============================================
UPDATE clients SET nationality = 'Algérienne' WHERE nationality IN ('Algeria', 'Algérie');
UPDATE clients SET nationality = 'Française' WHERE nationality IN ('France');
UPDATE clients SET nationality = 'Marocaine' WHERE nationality IN ('Maroc', 'Morocco');
UPDATE clients SET nationality = 'Tunisienne' WHERE nationality IN ('Tunisia', 'Tunisie');

COMMIT;
