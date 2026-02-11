# 🔧 LexCoworkAI Scripts

This directory contains utility scripts for maintaining code quality.

## 📋 Available Scripts

### `fixtypescriptbug`

Checks for TypeScript errors in your codebase and provides a detailed report.

#### Usage

```bash
# Run TypeScript error check
pnpm fixtypescriptbug

# Watch mode (auto-check on file changes)
pnpm fixtypescriptbug:watch

# Quick check (prettier output without report)
pnpm fixtypescriptbug:quick

# Run all checks (TypeScript + ESLint)
pnpm check
```

#### Features

✅ **Colorized Output** - Easy-to-read error messages with colors  
✅ **Error Grouping** - Groups errors by file for easier navigation  
✅ **Error Statistics** - Shows most common error types  
✅ **JSON Reports** - Saves detailed reports to `/reports` directory  
✅ **Helpful Tips** - Suggests next steps to fix issues  

#### Example Output

```
🔍 Checking TypeScript Errors...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Errors: 10
Files with Errors: 1

🔝 Most Common Error Types:
   TS2339: 8 occurrences
   TS2769: 1 occurrence

📁 Errors by File:

   lib/anthropic/enhanced-client.ts (10 errors)
      Line 70:13 - TS2769: No overload matches this call
      Line 78:38 - TS2339: Property 'usage' does not exist
      Line 78:68 - TS2339: Property 'usage' does not exist
      ...

💡 Tips to Fix TypeScript Errors:
   1. Focus on files with the most errors first
   2. Use Cursor AI: Select error and press Ctrl+Shift+P -> "Fix"
   3. Run with watch mode: pnpm fixtypescriptbug:watch
   4. Check the saved report for detailed breakdown

💾 Detailed report saved to: reports/typescript-errors-2026-02-11T12-30-45.json
```

#### Report Files

Error reports are saved to `/reports` directory with timestamps:
- Format: `typescript-errors-YYYY-MM-DDTHH-MM-SS.json`
- Contains: Error details, statistics, and timestamps
- Useful for tracking error trends over time

**Note:** The `/reports` directory is git-ignored to keep your repo clean.

## 🚀 Tips

### Fix TypeScript Errors Quickly

1. **Run the check** to see all errors
   ```bash
   pnpm fixtypescriptbug
   ```

2. **Focus on one file** at a time (start with the file that has the most errors)

3. **Use Cursor AI** to help fix:
   - Select the error line
   - Press `Ctrl+Shift+P`
   - Type "Fix" and select a fix option

4. **Watch mode** for real-time feedback:
   ```bash
   pnpm fixtypescriptbug:watch
   ```

### Pre-commit Hook

Add to `.husky/pre-commit` to prevent commits with TypeScript errors:

```bash
#!/bin/sh
pnpm fixtypescriptbug || exit 1
```

### CI/CD Integration

Add to your CI pipeline (GitHub Actions, etc.):

```yaml
- name: Check TypeScript
  run: pnpm fixtypescriptbug
```

## 📝 Current Status

Run `pnpm fixtypescriptbug` to check current status.

As of the last check, there are **10 TypeScript errors** in:
- `lib/anthropic/enhanced-client.ts` - Type incompatibilities with Anthropic SDK

These need to be fixed for production deployment.
