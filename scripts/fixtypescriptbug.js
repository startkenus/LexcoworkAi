#!/usr/bin/env node

/**
 * TypeScript Error Checker - fixtypescriptbug
 * Runs TypeScript compiler and provides formatted error reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseTypeScriptErrors(output) {
  // Parse TypeScript error format
  // Format 1: file(line,col): error TS####: message
  // Format 2: file:line:col - error TS####: message
  const errors = [];
  
  // Try format 1 (Windows style with ANSI codes)
  const pattern1 = /\[96m(.+?)\[0m:\[93m(\d+)\[0m:\[93m(\d+)\[0m - \[91merror\[0m\[90m (TS\d+):/g;
  let match;
  
  while ((match = pattern1.exec(output)) !== null) {
    // Extract message (everything until next file or end)
    const startPos = match.index + match[0].length;
    const nextMatch = output.indexOf('[96m', startPos);
    const endPos = nextMatch !== -1 ? nextMatch : output.indexOf('\n\n', startPos);
    const message = output.substring(startPos, endPos !== -1 ? endPos : startPos + 200)
      .replace(/\[[\d;]+m/g, '') // Remove ANSI codes
      .split('\n')[0]
      .trim();
    
    errors.push({
      file: match[1].trim(),
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      code: match[4],
      message: message.substring(0, 200), // Limit message length
    });
  }
  
  // If no errors found with format 1, try format 2 (standard)
  if (errors.length === 0) {
    const pattern2 = /(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/g;
    while ((match = pattern2.exec(output)) !== null) {
      errors.push({
        file: match[1].trim(),
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5].trim(),
      });
    }
  }
  
  return errors;
}

function groupErrorsByFile(errors) {
  const grouped = {};
  errors.forEach(error => {
    if (!grouped[error.file]) {
      grouped[error.file] = [];
    }
    grouped[error.file].push(error);
  });
  return grouped;
}

function countErrorTypes(errors) {
  const counts = {};
  errors.forEach(error => {
    counts[error.code] = (counts[error.code] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function generateReport(errors) {
  const groupedErrors = groupErrorsByFile(errors);
  const errorTypes = countErrorTypes(errors);
  
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TypeScript Error Report', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`\n${colors.red}Total Errors: ${errors.length}${colors.reset}`);
  log(`${colors.yellow}Files with Errors: ${Object.keys(groupedErrors).length}${colors.reset}\n`);
  
  // Show top error types
  if (errorTypes.length > 0) {
    log('🔝 Most Common Error Types:', 'cyan');
    errorTypes.slice(0, 5).forEach(([code, count]) => {
      log(`   ${code}: ${count} occurrence${count > 1 ? 's' : ''}`, 'yellow');
    });
    log('');
  }
  
  // Show errors by file (sorted by error count)
  log('📁 Errors by File:', 'cyan');
  Object.entries(groupedErrors)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([file, fileErrors]) => {
      const relativePath = path.relative(process.cwd(), file);
      log(`\n   ${relativePath} ${colors.gray}(${fileErrors.length} error${fileErrors.length > 1 ? 's' : ''})${colors.reset}`, 'blue');
      
      fileErrors.forEach((error, index) => {
        if (index < 3) { // Show first 3 errors per file
          log(`      Line ${error.line}:${error.column} - ${error.code}`, 'red');
          log(`      ${error.message}`, 'gray');
        }
      });
      
      if (fileErrors.length > 3) {
        log(`      ... and ${fileErrors.length - 3} more error${fileErrors.length - 3 > 1 ? 's' : ''}`, 'gray');
      }
    });
}

function saveReport(errors) {
  const reportsDir = path.join(process.cwd(), 'reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const reportFile = path.join(reportsDir, `typescript-errors-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    filesAffected: [...new Set(errors.map(e => e.file))].length,
    errors: errors,
    errorsByType: countErrorTypes(errors).reduce((acc, [code, count]) => {
      acc[code] = count;
      return acc;
    }, {}),
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  log(`\n💾 Detailed report saved to: ${path.relative(process.cwd(), reportFile)}`, 'green');
}

function showTips() {
  log('\n💡 Tips to Fix TypeScript Errors:', 'yellow');
  log('   1. Focus on files with the most errors first', 'gray');
  log('   2. Use Cursor AI: Select error and press Ctrl+Shift+P -> "Fix"', 'gray');
  log('   3. Run with watch mode: pnpm fixtypescriptbug:watch', 'gray');
  log('   4. Check the saved report for detailed breakdown', 'gray');
  log('');
}

// Main execution
function main() {
  log('\n🔍 Checking TypeScript Errors...', 'blue');
  log('━'.repeat(60), 'cyan');
  
  try {
    // Run TypeScript compiler with no emit (check only)
    execSync('tsc --noEmit --pretty', { 
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    
    // No errors found
    log('\n✅ No TypeScript errors found!', 'green');
    log('━'.repeat(60), 'cyan');
    
    // Show file count
    try {
      const tsFiles = execSync('git ls-files "*.ts" "*.tsx" 2>nul || dir /s/b *.ts *.tsx 2>nul | find /c /v ""', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      }).trim();
      log(`\n📊 All TypeScript files are error-free! 🎉`, 'cyan');
    } catch (e) {
      // Ignore file count errors
    }
    
    log('');
    process.exit(0);
    
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    
    if (!output.trim()) {
      log('\n❌ TypeScript check failed with unknown error', 'red');
      log('━'.repeat(60), 'cyan');
      console.error(error);
      process.exit(1);
    }
    
    const errors = parseTypeScriptErrors(output);
    
    if (errors.length > 0) {
      generateReport(errors);
      saveReport(errors);
      showTips();
      log('━'.repeat(60), 'cyan');
      log('');
    } else {
      // Show raw output if we couldn't parse errors
      log('\n❌ TypeScript errors detected:', 'red');
      log('━'.repeat(60), 'cyan');
      console.log(output);
      log('━'.repeat(60), 'cyan');
      log('');
    }
    
    process.exit(1);
  }
}

// Run the script
main();
