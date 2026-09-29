# Mutation Testing Guide

This document outlines the mutation testing setup using Stryker.NET for the Dorisio frontend application to verify test quality and identify coverage gaps.

## Overview

Mutation testing evaluates the quality of your tests by introducing small changes (mutations) to your code and checking if your tests catch these changes. This helps identify:
- Weak or ineffective tests
- Missing test coverage
- False sense of security from high coverage percentages

## What is Mutation Testing?

Mutation testing works by:
1. **Creating Mutants**: Small modifications to your source code
2. **Running Tests**: Execute your test suite against each mutant
3. **Calculating Scores**: Measure how many mutants your tests can detect (kill)
4. **Identifying Weak Areas**: Find code where tests don't catch mutations

### Example Mutations
```typescript
// Original code
if (user.age >= 18) {
  return 'adult';
}

// Mutant 1: Boundary condition
if (user.age > 18) {  // >= changed to >
  return 'adult';
}

// Mutant 2: Logical operator
if (user.age <= 18) { // >= changed to <=
  return 'adult';
}

// Mutant 3: Constant replacement  
if (user.age >= 21) { // 18 changed to 21
  return 'adult';
}
```

## Setup and Configuration

### Dependencies
```json
{
  "devDependencies": {
    "@stryker-mutator/core": "^8.5.0",
    "@stryker-mutator/vitest-runner": "^8.5.0", 
    "@stryker-mutator/typescript-checker": "^8.5.0"
  }
}
```

### Configuration File: `stryker.conf.mjs`
```javascript
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.*',
    '!src/**/*.spec.*', 
    '!src/**/*.stories.*'
  ],
  thresholds: {
    high: 80,    // Good mutation score
    low: 70,     // Acceptable mutation score  
    break: 60    // Minimum required score
  }
};
```

## Running Mutation Tests

### Local Development
```bash
# Run mutation tests
pnpm test:mutation

# Run with specific files
npx stryker run --mutate src/components/Button/**/*.ts

# Run with HTML report
npx stryker run --reporters html,clear-text

# Incremental mode (only test changed files)
npx stryker run --incremental
```

### CI/CD Pipeline
```yaml
mutation-testing:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Needed for incremental mode
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Run mutation tests
      run: pnpm test:mutation
      
    - name: Upload mutation report
      uses: actions/upload-artifact@v4
      with:
        name: mutation-report
        path: reports/mutation/
```

## Understanding Mutation Scores

### Score Calculation
```
Mutation Score = (Killed Mutants / Total Mutants) × 100
```

### Score Interpretation
- **90-100%**: Excellent test quality
- **80-90%**: Good test quality  
- **70-80%**: Acceptable test quality
- **60-70%**: Poor test quality (needs improvement)
- **<60%**: Very poor test quality (major issues)

### Example Report
```
Mutant killed: 847/1000 (84.70%)
Mutant survived: 153/1000 (15.30%)
Mutant timeout: 0/1000 (0.00%)
Mutant runtime error: 0/1000 (0.00%)
Mutant compile error: 0/1000 (0.00%)
```

## Types of Mutations

### 1. Arithmetic Operators
```typescript
// Original
const total = a + b;

// Mutations  
const total = a - b;  // Addition to subtraction
const total = a * b;  // Addition to multiplication
const total = a / b;  // Addition to division
const total = a % b;  // Addition to modulus
```

### 2. Relational Operators
```typescript
// Original
if (score >= passing) {

// Mutations
if (score > passing) {   // >= to >
if (score <= passing) {  // >= to <=  
if (score < passing) {   // >= to <
if (score === passing) { // >= to ===
if (score !== passing) { // >= to !==
```

### 3. Logical Operators
```typescript
// Original  
if (isActive && hasPermission) {

// Mutations
if (isActive || hasPermission) {  // && to ||
if (isActive) {                  // Remove hasPermission
if (hasPermission) {             // Remove isActive
```

### 4. Conditional Boundaries
```typescript
// Original
for (let i = 0; i < items.length; i++) {

// Mutations  
for (let i = 0; i <= items.length; i++) { // < to <=
for (let i = 1; i < items.length; i++) {  // 0 to 1
for (let i = 0; i < items.length - 1; i++) { // length to length - 1
```

### 5. Boolean Literals
```typescript
// Original
const isEnabled = true;

// Mutations
const isEnabled = false;  // true to false
```

## Improving Test Quality

### 1. Identify Surviving Mutants
```bash
# Generate detailed report
npx stryker run --reporters html

# Open report (usually at reports/mutation/html/index.html)
# Look for "Survived" mutants in red
```

### 2. Analyze Weak Tests

**Example: Boundary Condition Issue**
```typescript
// Weak test
test('user can vote if 18 or older', () => {
  const user = { age: 20 };
  expect(canVote(user)).toBe(true);
});

// Better test (catches >= vs > mutation)
test('user can vote at exactly 18', () => {
  const user = { age: 18 };
  expect(canVote(user)).toBe(true);
});

test('user cannot vote at 17', () => {
  const user = { age: 17 };  
  expect(canVote(user)).toBe(false);
});
```

### 3. Add Missing Edge Cases
```typescript
// Original function
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Comprehensive tests
describe('divide function', () => {
  test('divides positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  test('divides negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
  });
  
  test('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
  
  test('handles decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333);
  });
});
```

## Common Patterns and Solutions

### 1. Untested Error Paths
```typescript
// Code with untested error handling
async function fetchUser(id: string) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.log('Error fetching user'); // ← This line survives mutation
    throw error;
  }
}

// Add test for error path
test('throws error when API fails', async () => {
  jest.spyOn(api, 'get').mockRejectedValue(new Error('API Error'));
  
  await expect(fetchUser('123')).rejects.toThrow('API Error');
});
```

### 2. Ineffective Assertions
```typescript
// Weak assertion
test('calculates total', () => {
  const result = calculateTotal([1, 2, 3]);
  expect(result).toBeDefined(); // ← Too weak
});

// Strong assertion  
test('calculates total', () => {
  const result = calculateTotal([1, 2, 3]);
  expect(result).toBe(6); // ← Specific expectation
});
```

### 3. Missing Null/Undefined Checks
```typescript
// Function with potential null issue
function getDisplayName(user?: User): string {
  return user?.name || 'Anonymous'; // ← Need to test both paths
}

// Comprehensive tests
test('returns user name when user exists', () => {
  expect(getDisplayName({ name: 'John' })).toBe('John');
});

test('returns Anonymous when user is undefined', () => {
  expect(getDisplayName(undefined)).toBe('Anonymous');
});

test('returns Anonymous when user has no name', () => {
  expect(getDisplayName({ name: '' })).toBe('Anonymous');
});
```

## Monitoring and Maintenance

### 1. Track Mutation Score Over Time
```javascript
// Store results for trending
const mutationHistory = [
  { date: '2024-01-01', score: 78.5 },
  { date: '2024-02-01', score: 82.1 },
  { date: '2024-03-01', score: 85.3 }
];
```

### 2. Set Quality Gates
```yaml
# GitHub Actions quality gate
- name: Check mutation score
  run: |
    SCORE=$(cat reports/mutation/mutation-score.json | jq '.mutationScore')
    if [ $(echo "$SCORE < 80" | bc) -eq 1 ]; then
      echo "Mutation score $SCORE% is below threshold of 80%"
      exit 1
    fi
```

### 3. Focus Areas for Improvement
- **Critical business logic**: Target 90%+ mutation score
- **Utility functions**: Target 85%+ mutation score  
- **UI components**: Target 75%+ mutation score
- **Configuration/constants**: May exclude from mutation testing

## Performance Optimization

### 1. Incremental Testing
```bash
# Only test changed files since last run
npx stryker run --incremental --since HEAD~1
```

### 2. Parallel Execution
```javascript
// stryker.conf.mjs
export default {
  concurrency: 4,
  maxConcurrentTestRunners: 4,
  timeoutMS: 60000,
};
```

### 3. Exclude Non-Critical Files
```javascript
mutate: [
  'src/**/*.ts',
  '!src/**/*.test.*',
  '!src/**/*.stories.*',
  '!src/types/**/*',      // Type definitions
  '!src/constants/**/*',  // Configuration
  '!src/mocks/**/*'       // Test utilities
]
```

## Integration with Other Tools

### 1. Coverage Reports
```bash
# Combine with coverage analysis
npx stryker run --coverageAnalysis perTest
```

### 2. Static Analysis
```bash
# Run after ESLint/TypeScript checks
pnpm lint && pnpm type-check && pnpm test:mutation
```

### 3. Performance Testing
```bash
# Ensure mutations don't break performance tests
pnpm test:mutation && pnpm test:performance
```

## Resources

- [Stryker Mutator Documentation](https://stryker-mutator.io/)
- [Mutation Testing Introduction](https://stryker-mutator.io/docs/general/introduction/)
- [Vitest Integration Guide](https://stryker-mutator.io/docs/stryker-js/guides/vitest/)
- [Mutation Testing Best Practices](https://stryker-mutator.io/docs/general/mutation-testing-elements/)