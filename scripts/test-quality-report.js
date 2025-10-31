#!/usr/bin/env node

/**
 * Test Quality Report Generator
 *
 * Analyzes test coverage data and generates insights about test quality:
 * - Files with tests but low coverage (shallow tests)
 * - Uncovered critical paths
 * - Dead code (high coverage but not used)
 * - Test-to-code ratio
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readCoverageData() {
  const coveragePath = path.join(
    process.cwd(),
    'coverage',
    'coverage-summary.json',
  );

  if (!fs.existsSync(coveragePath)) {
    log('❌ Coverage file not found. Run: pnpm test:coverage', 'red');
    log(`   Looking for: ${coveragePath}`, 'yellow');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

function analyzeTestQuality(coverage) {
  const results = {
    shallowTests: [], // Files with tests but <50% coverage
    wellTested: [], // Files with >80% coverage
    criticalUncovered: [], // Important files with <60% coverage
    perfectCoverage: [], // 100% coverage (might be dead code)
    zeroCoverage: [], // 0% coverage
  };

  // Skip the 'total' entry
  const files = Object.keys(coverage).filter((key) => key !== 'total');

  files.forEach((file) => {
    const fileCoverage = coverage[file];
    const avgCoverage =
      (fileCoverage.lines.pct +
        fileCoverage.statements.pct +
        fileCoverage.functions.pct +
        fileCoverage.branches.pct) /
      4;

    const metrics = {
      file,
      lines: fileCoverage.lines.pct,
      statements: fileCoverage.statements.pct,
      functions: fileCoverage.functions.pct,
      branches: fileCoverage.branches.pct,
      avgCoverage: avgCoverage.toFixed(2),
    };

    // Categorize
    if (avgCoverage === 0) {
      results.zeroCoverage.push(metrics);
    } else if (avgCoverage === 100) {
      results.perfectCoverage.push(metrics);
    } else if (avgCoverage > 80) {
      results.wellTested.push(metrics);
    } else if (avgCoverage < 50) {
      // Check if it's a critical file
      if (isCriticalFile(file)) {
        results.criticalUncovered.push(metrics);
      } else {
        results.shallowTests.push(metrics);
      }
    }
  });

  // Sort by average coverage
  results.shallowTests.sort((a, b) => a.avgCoverage - b.avgCoverage);
  results.criticalUncovered.sort((a, b) => a.avgCoverage - b.avgCoverage);
  results.wellTested.sort((a, b) => b.avgCoverage - a.avgCoverage);

  return results;
}

function isCriticalFile(filePath) {
  const criticalPatterns = [
    '/services/',
    '/stores/',
    '/hooks/',
    '/utils/',
    'Manager.ts',
    'Service.ts',
    'Handler.ts',
  ];

  return criticalPatterns.some((pattern) => filePath.includes(pattern));
}

function generateReport(results, totalCoverage) {
  log(
    '\n╔════════════════════════════════════════════════════════════╗',
    'cyan',
  );
  log('║           TEST QUALITY ANALYSIS REPORT                    ║', 'cyan');
  log(
    '╚════════════════════════════════════════════════════════════╝\n',
    'cyan',
  );

  // Overall stats
  log('📊 OVERALL COVERAGE', 'bright');
  log(`   Lines:      ${totalCoverage.lines.pct.toFixed(2)}%`, 'blue');
  log(`   Statements: ${totalCoverage.statements.pct.toFixed(2)}%`, 'blue');
  log(`   Functions:  ${totalCoverage.functions.pct.toFixed(2)}%`, 'blue');
  log(`   Branches:   ${totalCoverage.branches.pct.toFixed(2)}%`, 'blue');

  // Critical uncovered files
  log('\n🚨 CRITICAL FILES NEEDING TESTS (Priority)', 'red');
  if (results.criticalUncovered.length === 0) {
    log('   ✅ All critical files have acceptable coverage!', 'green');
  } else {
    results.criticalUncovered.slice(0, 10).forEach((file) => {
      log(`   ⚠️  ${file.file}`, 'yellow');
      log(
        `      Coverage: ${file.avgCoverage}% (L:${file.lines}% S:${file.statements}% F:${file.functions}% B:${file.branches}%)`,
        'red',
      );
    });
    if (results.criticalUncovered.length > 10) {
      log(`   ... and ${results.criticalUncovered.length - 10} more`, 'yellow');
    }
  }

  // Shallow tests
  log('\n⚠️  SHALLOW TESTS (<50% coverage)', 'yellow');
  if (results.shallowTests.length === 0) {
    log('   ✅ No files with shallow tests detected!', 'green');
  } else {
    log(
      `   Found ${results.shallowTests.length} files with low-quality tests`,
      'yellow',
    );
    results.shallowTests.slice(0, 10).forEach((file) => {
      log(`   • ${file.file}`, 'yellow');
      log(
        `     Coverage: ${file.avgCoverage}% - Tests exist but don't cover much`,
        'yellow',
      );
    });
    if (results.shallowTests.length > 10) {
      log(`   ... and ${results.shallowTests.length - 10} more`, 'yellow');
    }
  }

  // Well-tested files
  log('\n✅ WELL-TESTED FILES (>80% coverage)', 'green');
  log(`   Found ${results.wellTested.length} well-tested files`, 'green');
  if (results.wellTested.length > 0) {
    results.wellTested.slice(0, 5).forEach((file) => {
      log(`   ✓ ${file.file} (${file.avgCoverage}%)`, 'green');
    });
  }

  // Perfect coverage files
  log('\n⭐ PERFECT COVERAGE (100%)', 'magenta');
  if (results.perfectCoverage.length === 0) {
    log('   No files with perfect coverage', 'magenta');
  } else {
    log(
      `   Found ${results.perfectCoverage.length} files with 100% coverage`,
      'magenta',
    );
    log('   (These might be dead code or overly simple)', 'magenta');
    results.perfectCoverage.slice(0, 5).forEach((file) => {
      log(`   • ${file.file}`, 'magenta');
    });
  }

  // Zero coverage files
  log('\n❌ ZERO COVERAGE (0%)', 'red');
  if (results.zeroCoverage.length === 0) {
    log('   ✅ No untested files!', 'green');
  } else {
    log(`   Found ${results.zeroCoverage.length} untested files`, 'red');
    results.zeroCoverage.slice(0, 10).forEach((file) => {
      log(`   • ${file.file}`, 'red');
    });
    if (results.zeroCoverage.length > 10) {
      log(`   ... and ${results.zeroCoverage.length - 10} more`, 'yellow');
    }
  }

  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'cyan');
  log('   1. Focus on critical files first (services, stores, hooks)', 'cyan');
  log('   2. Improve shallow tests - they give false confidence', 'cyan');
  log('   3. Review perfect coverage files - might be dead code', 'cyan');
  log('   4. Run mutation testing: pnpm test:mutation', 'cyan');
  log('   5. Check for duplicate tests: pnpm test:duplicates', 'cyan');

  log('\n');
}

function saveHTMLReport(results, totalCoverage) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Quality Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    .metric { display: inline-block; margin: 10px 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; }
    .section { margin: 30px 0; }
    .critical { color: #f44336; }
    .warning { color: #ff9800; }
    .success { color: #4CAF50; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    tr:hover { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Quality Analysis Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="section">
      <h2>Overall Coverage</h2>
      <div class="metric">Lines: <strong>${totalCoverage.lines.pct.toFixed(2)}%</strong></div>
      <div class="metric">Statements: <strong>${totalCoverage.statements.pct.toFixed(2)}%</strong></div>
      <div class="metric">Functions: <strong>${totalCoverage.functions.pct.toFixed(2)}%</strong></div>
      <div class="metric">Branches: <strong>${totalCoverage.branches.pct.toFixed(2)}%</strong></div>
    </div>

    ${generateSection('Critical Files Needing Tests', results.criticalUncovered, 'critical')}
    ${generateSection('Shallow Tests', results.shallowTests, 'warning')}
    ${generateSection('Well-Tested Files', results.wellTested.slice(0, 20), 'success')}

    <div class="section">
      <h2>Summary Statistics</h2>
      <ul>
        <li>Critical files needing attention: <strong>${results.criticalUncovered.length}</strong></li>
        <li>Files with shallow tests: <strong>${results.shallowTests.length}</strong></li>
        <li>Well-tested files: <strong>${results.wellTested.length}</strong></li>
        <li>Perfect coverage files: <strong>${results.perfectCoverage.length}</strong></li>
        <li>Untested files: <strong>${results.zeroCoverage.length}</strong></li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;

  const reportPath = path.join(
    process.cwd(),
    'coverage',
    'test-quality-report.html',
  );
  fs.writeFileSync(reportPath, html);
  log(`📄 HTML report saved to: ${reportPath}`, 'green');
}

function generateSection(title, files, className) {
  if (files.length === 0) {
    return `<div class="section ${className}"><h2>${title}</h2><p>None found!</p></div>`;
  }

  const rows = files
    .slice(0, 50)
    .map(
      (file) => `
    <tr>
      <td>${file.file}</td>
      <td>${file.avgCoverage}%</td>
      <td>${file.lines}%</td>
      <td>${file.statements}%</td>
      <td>${file.functions}%</td>
      <td>${file.branches}%</td>
    </tr>
  `,
    )
    .join('');

  return `
    <div class="section ${className}">
      <h2>${title} (${files.length})</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Avg</th>
            <th>Lines</th>
            <th>Statements</th>
            <th>Functions</th>
            <th>Branches</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Main execution
try {
  const coverage = readCoverageData();
  const results = analyzeTestQuality(coverage);
  generateReport(results, coverage.total);
  saveHTMLReport(results, coverage.total);

  log('✅ Test quality analysis complete!', 'green');
  log('📊 Open coverage/test-quality-report.html for detailed view', 'cyan');

  // Exit with error if too many critical files are uncovered
  if (results.criticalUncovered.length > 5) {
    log(
      `\n⚠️  Warning: ${results.criticalUncovered.length} critical files need better tests`,
      'yellow',
    );
    process.exit(1);
  }
} catch (error) {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
}
