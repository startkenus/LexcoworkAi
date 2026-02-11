#!/usr/bin/env node

/**
 * Combine all SQL migrations into a single file for Supabase web editor
 * This script reads all .sql files from supabase/migrations/ and combines them
 * in the correct order (sorted by filename) into a single master SQL file.
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const outputFile = path.join(__dirname, '..', 'supabase', 'MASTER_MIGRATION.sql');

console.log('🔍 Scanning for SQL migration files...\n');

// Read all .sql files from migrations directory
const files = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort alphabetically (which sorts by timestamp for our naming convention)

console.log(`Found ${files.length} migration files:\n`);
files.forEach((file, index) => {
  console.log(`  ${index + 1}. ${file}`);
});

console.log('\n📝 Combining migrations...\n');

// Start building the master SQL file
let masterSQL = `-- ============================================
-- LexCoworkAI - Complete Database Migration
-- ============================================
-- This file combines all migrations in the correct order
-- Run this in Supabase SQL Editor to set up your database
-- 
-- Project ID: idgfbmvfqyirgdowsxrm
-- SQL Editor: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new
-- 
-- Generated: ${new Date().toISOString()}
-- Total Migrations: ${files.length}
-- ============================================

`;

// Add each migration file's content
files.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  masterSQL += `
-- ============================================
-- Migration ${index + 1}/${files.length}: ${file}
-- ============================================

${content}

`;
});

// Add final setup for existing user
masterSQL += `
-- ============================================
-- Final Setup: Create Profile for Existing User
-- ============================================

-- Create or update profile for your existing user
INSERT INTO public.profiles (user_id, role, full_name, tenant_id)
VALUES (
  '1cad0354-425e-4f30-8f85-5b77786851cd'::uuid,
  'super_admin',
  'Admin User',
  (SELECT id FROM public.tenants WHERE domain = 'default.lexcoworkai.com')
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  tenant_id = (SELECT id FROM public.tenants WHERE domain = 'default.lexcoworkai.com'),
  updated_at = NOW();

-- ============================================
-- Migration Complete! ✅
-- ============================================
-- All ${files.length} migrations have been applied.
-- Your database is now ready to use!
-- ============================================
`;

// Write the combined file
fs.writeFileSync(outputFile, masterSQL, 'utf8');

console.log(`✅ Successfully created master migration file!\n`);
console.log(`📄 Output: ${outputFile}\n`);
console.log(`📊 Total size: ${(masterSQL.length / 1024).toFixed(2)} KB\n`);
console.log('🚀 Next steps:\n');
console.log('  1. Open: https://app.supabase.com/project/idgfbmvfqyirgdowsxrm/sql/new');
console.log('  2. Open the generated file: supabase/MASTER_MIGRATION.sql');
console.log('  3. Copy all content (Ctrl+A, Ctrl+C)');
console.log('  4. Paste into Supabase SQL Editor (Ctrl+V)');
console.log('  5. Click RUN button\n');
console.log('✨ Done!');
