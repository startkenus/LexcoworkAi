#!/usr/bin/env node

/**
 * Add DROP POLICY IF EXISTS before all CREATE POLICY statements
 * Makes all policy creation idempotent
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node fix-policies.js <path-to-sql-file>');
  process.exit(1);
}

console.log(`Processing: ${filePath}`);

let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;

// Pattern to match CREATE POLICY statements
// Matches: CREATE POLICY "policy name" (spaces may vary)
const policyPattern = /^(CREATE POLICY "([^"]+)")$/gm;

let count = 0;
content = content.replace(policyPattern, (match, createStatement, policyName, offset) => {
  // Check if there's already a DROP POLICY before this CREATE
  const beforeText = content.substring(Math.max(0, offset - 200), offset);
  const alreadyHasDrop = beforeText.includes(`DROP POLICY IF EXISTS "${policyName}"`);
  
  if (alreadyHasDrop) {
    return match; // Already has DROP, don't add another
  }
  
  // Find the table name from the ON clause (next line usually)
  const afterText = content.substring(offset, offset + 300);
  const onClauseMatch = afterText.match(/ON\s+(\w+)\s+FOR/);
  
  if (onClauseMatch) {
    const tableName = onClauseMatch[1];
    count++;
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n${createStatement}`;
  }
  
  // If we can't find table name, just add DROP without table (will need manual fix)
  console.warn(`Warning: Could not find table name for policy "${policyName}"`);
  count++;
  return `DROP POLICY IF EXISTS "${policyName}";\n${createStatement}`;
});

if (content !== originalContent) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Added ${count} DROP POLICY IF EXISTS statements`);
  console.log(`✅ File updated successfully!`);
} else {
  console.log('ℹ️  No changes needed - all policies already have DROP statements');
}
