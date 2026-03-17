#!/usr/bin/env node
/**
 * Post-Bash Hook: Pipeline Chaining Hints
 *
 * After certain commands complete successfully, suggests the next logical
 * step in the development pipeline:
 *   - After tests pass → suggest code-review
 *   - After build succeeds → suggest testing
 *   - After lint/format passes → suggest testing
 *
 * This is advisory only (warns via stderr). It never blocks.
 */

'use strict';

const PIPELINE_HINTS = [
  {
    // Tests passing → suggest code review
    match: /\b(npm\s+test|yarn\s+test|pnpm\s+test|bun\s+test|pytest|go\s+test|cargo\s+test|jest|vitest|mocha|rspec|phpunit|gradle\s+test|mvn\s+test|dotnet\s+test)\b/i,
    successHint: '[Hook] Tests passed. Consider running /code-review or /security-review next.',
    label: 'test',
  },
  {
    // Build succeeds → suggest testing
    match: /\b(npm\s+run\s+build|yarn\s+build|pnpm\s+build|bun\s+build|cargo\s+build|go\s+build|gradle\s+build|mvn\s+(?:compile|package)|dotnet\s+build|tsc\b)/i,
    successHint: '[Hook] Build succeeded. Consider running tests next (/tdd or test command).',
    label: 'build',
  },
  {
    // Lint/format passes → suggest testing
    match: /\b(eslint|prettier|biome\s+check|ruff\s+check|pylint|flake8|golangci-lint|clippy|rubocop)\b/i,
    successHint: '[Hook] Lint passed. Consider running tests next.',
    label: 'lint',
  },
  {
    // Code review done (gh pr review) → suggest merge/deploy
    match: /\bgh\s+pr\s+review\b/i,
    successHint: '[Hook] PR reviewed. Consider merging when ready (/git-workflow).',
    label: 'review',
  },
];

/**
 * Core logic - exported for run-with-flags.js
 */
function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const cmd = String(input.tool_input?.command || '');
    const output = String(input.tool_output?.output || input.tool_output?.stdout || '');
    const exitCode = input.tool_output?.exit_code ?? input.tool_output?.exitCode;

    // Only hint on successful commands (exit code 0 or not reported)
    if (exitCode !== undefined && exitCode !== null && exitCode !== 0) {
      return rawInput;
    }

    for (const hint of PIPELINE_HINTS) {
      if (hint.match.test(cmd)) {
        process.stderr.write(`${hint.successHint}\n`);
        break; // One hint per command
      }
    }
  } catch {
    // Don't interfere on errors
  }

  return rawInput;
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    const result = run(raw);
    process.stdout.write(result);
  });
}

module.exports = { run };
