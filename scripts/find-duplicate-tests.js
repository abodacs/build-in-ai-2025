#!/usr/bin/env node

/**
 * Duplicate Test Detector
 *
 * Analyzes test files to find:
 * - Tests with identical or very similar assertions
 * - Multiple tests covering the same code paths
 * - Redundant test files
 * - Tests with similar descriptions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function findTestFiles(dir, testFiles = []) {
  if (!fs.existsSync(dir)) {
    return testFiles;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('dist')) {
        findTestFiles(filePath, testFiles);
      }
    } else if (
      file.endsWith('.test.ts') ||
      file.endsWith('.test.tsx') ||
      file.endsWith('.spec.ts') ||
      file.endsWith('.spec.tsx')
    ) {
      testFiles.push(filePath);
    }
  });

  return testFiles;
}

function extractTestInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract test descriptions
  const testRegex = /(it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;

  const tests = [];
  const describes = [];

  let match;
  while ((match = testRegex.exec(content)) !== null) {
    tests.push(match[2]);
  }

  while ((match = describeRegex.exec(content)) !== null) {
    describes.push(match[1]);
  }

  // Extract assertions
  const assertionRegex = /(expect|assert)\s*\([^)]+\)/g;
  const assertions = [];
  while ((match = assertionRegex.exec(content)) !== null) {
    // Normalize assertion for comparison
    const normalized = match[0]
      .replace(/\s+/g, ' ')
      .replace(/["'`]/g, '')
      .toLowerCase();
    assertions.push(normalized);
  }

  return {
    filePath,
    tests,
    describes,
    assertions,
    testCount: tests.length,
    assertionCount: assertions.length,
    content,
  };
}

function findSimilarStrings(strings) {
  const similar = [];

  for (let i = 0; i < strings.length; i++) {
    for (let j = i + 1; j < strings.length; j++) {
      const similarity = calculateSimilarity(strings[i], strings[j]);
      if (similarity > 0.8) {
        // 80% similar
        similar.push({
          str1: strings[i],
          str2: strings[j],
          similarity: (similarity * 100).toFixed(1),
        });
      }
    }
  }

  return similar;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function findDuplicateAssertions(testFiles) {
  const assertionMap = new Map();
  const duplicates = [];

  testFiles.forEach((testFile) => {
    testFile.assertions.forEach((assertion) => {
      const hash = crypto.createHash('md5').update(assertion).digest('hex');

      if (assertionMap.has(hash)) {
        assertionMap.get(hash).push(testFile.filePath);
      } else {
        assertionMap.set(hash, [testFile.filePath]);
      }
    });
  });

  assertionMap.forEach((files, hash) => {
    if (files.length > 1) {
      duplicates.push({
        assertion: Array.from(new Set(files)),
        count: files.length,
      });
    }
  });

  return duplicates;
}

function analyzeTestRedundancy(testFiles) {
  const results = {
    similarDescriptions: [],
    duplicateAssertions: [],
    emptyTests: [],
    largeTestFiles: [],
    suspiciousPatterns: [],
  };

  // Find similar test descriptions
  const allDescriptions = testFiles.flatMap((file) =>
    file.tests.map((test) => ({ file: file.filePath, test })),
  );

  for (let i = 0; i < allDescriptions.length; i++) {
    for (let j = i + 1; j < allDescriptions.length; j++) {
      const sim = calculateSimilarity(
        allDescriptions[i].test,
        allDescriptions[j].test,
      );

      if (sim > 0.85 && allDescriptions[i].file !== allDescriptions[j].file) {
        results.similarDescriptions.push({
          test1: allDescriptions[i].test,
          file1: allDescriptions[i].file,
          test2: allDescriptions[j].test,
          file2: allDescriptions[j].file,
          similarity: (sim * 100).toFixed(1),
        });
      }
    }
  }

  // Find duplicate assertions
  results.duplicateAssertions = findDuplicateAssertions(testFiles);

  // Find empty or nearly empty tests
  testFiles.forEach((file) => {
    if (file.testCount > 0 && file.assertionCount === 0) {
      results.emptyTests.push({
        file: file.filePath,
        testCount: file.testCount,
      });
    }
  });

  // Find suspiciously large test files
  testFiles.forEach((file) => {
    if (file.testCount > 50) {
      results.largeTestFiles.push({
        file: file.filePath,
        testCount: file.testCount,
        assertionCount: file.assertionCount,
      });
    }
  });

  // Find suspicious patterns
  testFiles.forEach((file) => {
    // Tests with only "should work" descriptions
    const genericTests = file.tests.filter((test) =>
      /should work|works|basic|test|example/i.test(test),
    );
    if (genericTests.length > file.testCount * 0.3) {
      results.suspiciousPatterns.push({
        file: file.filePath,
        issue: 'Too many generic test descriptions',
        count: genericTests.length,
        total: file.testCount,
      });
    }

    // Tests with very few assertions per test
    const avgAssertions = file.assertionCount / Math.max(file.testCount, 1);
    if (avgAssertions < 1 && file.testCount > 5) {
      results.suspiciousPatterns.push({
        file: file.filePath,
        issue: 'Very few assertions per test',
        avgAssertions: avgAssertions.toFixed(2),
      });
    }
  });

  return results;
}

function generateReport(results, totalTests) {
  log(
    '\n╔════════════════════════════════════════════════════════════╗',
    'cyan',
  );
  log('║           DUPLICATE TEST ANALYSIS REPORT                  ║', 'cyan');
  log(
    '╚════════════════════════════════════════════════════════════╝\n',
    'cyan',
  );

  log(`📊 Total test files analyzed: ${totalTests}`, 'blue');
  log('');

  // Similar descriptions
  log('🔍 SIMILAR TEST DESCRIPTIONS', 'yellow');
  if (results.similarDescriptions.length === 0) {
    log('   ✅ No duplicate test descriptions found!', 'green');
  } else {
    log(
      `   Found ${results.similarDescriptions.length} pairs of similar tests\n`,
      'yellow',
    );
    results.similarDescriptions.slice(0, 10).forEach((pair) => {
      log(`   ${pair.similarity}% similar:`, 'yellow');
      log(`   📝 "${pair.test1}"`, 'yellow');
      log(`      ${pair.file1}`, 'blue');
      log(`   📝 "${pair.test2}"`, 'yellow');
      log(`      ${pair.file2}`, 'blue');
      log('');
    });
    if (results.similarDescriptions.length > 10) {
      log(
        `   ... and ${results.similarDescriptions.length - 10} more`,
        'yellow',
      );
    }
  }

  // Empty tests
  log('\n⚠️  TESTS WITHOUT ASSERTIONS', 'red');
  if (results.emptyTests.length === 0) {
    log('   ✅ All tests have assertions!', 'green');
  } else {
    log(
      `   Found ${results.emptyTests.length} test files with no assertions\n`,
      'red',
    );
    results.emptyTests.forEach((file) => {
      log(`   ❌ ${file.file}`, 'red');
      log(`      ${file.testCount} tests but 0 assertions`, 'red');
    });
  }

  // Large test files
  log('\n📦 LARGE TEST FILES (>50 tests)', 'magenta');
  if (results.largeTestFiles.length === 0) {
    log('   ✅ No oversized test files!', 'green');
  } else {
    log(
      `   Found ${results.largeTestFiles.length} large test files (consider splitting)\n`,
      'magenta',
    );
    results.largeTestFiles.forEach((file) => {
      log(`   📄 ${file.file}`, 'magenta');
      log(
        `      ${file.testCount} tests, ${file.assertionCount} assertions`,
        'magenta',
      );
    });
  }

  // Suspicious patterns
  log('\n🚩 SUSPICIOUS PATTERNS', 'yellow');
  if (results.suspiciousPatterns.length === 0) {
    log('   ✅ No suspicious patterns detected!', 'green');
  } else {
    log(
      `   Found ${results.suspiciousPatterns.length} potential issues\n`,
      'yellow',
    );
    results.suspiciousPatterns.forEach((pattern) => {
      log(`   ⚠️  ${pattern.file}`, 'yellow');
      log(`      Issue: ${pattern.issue}`, 'red');
      if (pattern.count) {
        log(`      ${pattern.count}/${pattern.total} tests affected`, 'yellow');
      }
      if (pattern.avgAssertions) {
        log(
          `      Average: ${pattern.avgAssertions} assertions/test`,
          'yellow',
        );
      }
    });
  }

  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'cyan');
  const totalIssues =
    results.similarDescriptions.length +
    results.emptyTests.length +
    results.suspiciousPatterns.length;

  if (totalIssues === 0) {
    log('   🎉 Your test suite looks good!', 'green');
  } else {
    log('   1. Remove or merge tests with similar descriptions', 'cyan');
    log('   2. Add assertions to empty tests or remove them', 'cyan');
    log('   3. Split large test files into smaller, focused ones', 'cyan');
    log('   4. Replace generic test descriptions with specific ones', 'cyan');
    log('   5. Ensure each test has meaningful assertions', 'cyan');
  }

  log('\n');
}

// Main execution
try {
  log('🔍 Scanning for test files...', 'blue');

  const srcDir = path.join(process.cwd(), 'src');
  const testFilePaths = findTestFiles(srcDir);

  log(`📁 Found ${testFilePaths.length} test files\n`, 'green');

  log('📊 Analyzing test content...', 'blue');
  const testFiles = testFilePaths.map(extractTestInfo);

  log('🔍 Detecting duplicates and patterns...\n', 'blue');
  const results = analyzeTestRedundancy(testFiles);

  generateReport(results, testFiles.length);

  log('✅ Analysis complete!', 'green');

  // Exit with warning if too many issues
  const totalIssues =
    results.similarDescriptions.length +
    results.emptyTests.length +
    results.suspiciousPatterns.length;

  if (totalIssues > 10) {
    log(
      `\n⚠️  Warning: Found ${totalIssues} potential test quality issues`,
      'yellow',
    );
    process.exit(1);
  }
} catch (error) {
  log(`❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
