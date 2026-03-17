#!/usr/bin/env node
/**
 * Pre-Bash Hook: Secret Scanning Before Commits
 *
 * Scans staged files for potential secrets (API keys, tokens, passwords,
 * private keys) before git commit or git push. Blocks the operation if
 * secrets are detected.
 *
 * Exit codes:
 *   0 - No secrets found or not a commit/push command
 *   2 - Secrets detected, blocks the tool call
 */

'use strict';

const { spawnSync } = require('child_process');

const SECRET_PATTERNS = [
  // API keys and tokens
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i, label: 'API key' },
  { pattern: /(?:secret[_-]?key|secretkey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i, label: 'Secret key' },
  { pattern: /(?:access[_-]?token|accesstoken)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i, label: 'Access token' },
  { pattern: /(?:auth[_-]?token|authtoken)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i, label: 'Auth token' },

  // AWS
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS Access Key ID' },
  { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/i, label: 'AWS Secret Key' },

  // Private keys
  { pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, label: 'Private key' },

  // Connection strings
  { pattern: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s'"]{10,}/i, label: 'Database connection string' },

  // Generic password assignments
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/i, label: 'Hardcoded password' },

  // GitHub/GitLab tokens
  { pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/, label: 'GitHub token' },
  { pattern: /glpat-[A-Za-z0-9_\-]{20,}/, label: 'GitLab token' },

  // Slack tokens
  { pattern: /xox[baprs]-[0-9]{10,}-[A-Za-z0-9\-]+/, label: 'Slack token' },

  // Generic bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9_\-\.]{20,}/i, label: 'Bearer token' },
];

// Files to skip (binary, lock files, test fixtures)
const SKIP_PATTERNS = [
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.js$/,
  /\.map$/,
  /node_modules/,
  /\.git\//,
  /fixtures?\//i,
  /\.test\.|\.spec\.|__tests__/,
  /\.example$|\.sample$|\.template$/,
];

function isCommitOrPush(cmd) {
  return /\bgit\s+(commit|push)\b/.test(cmd);
}

function shouldSkipFile(filePath) {
  return SKIP_PATTERNS.some(p => p.test(filePath));
}

function getStagedFiles() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf8',
    timeout: 10000,
  });

  if (result.status !== 0 || !result.stdout) return [];
  return result.stdout.trim().split('\n').filter(Boolean);
}

function getStagedContent(filePath) {
  const result = spawnSync('git', ['show', `:${filePath}`], {
    encoding: 'utf8',
    timeout: 10000,
  });

  if (result.status !== 0) return '';
  return result.stdout || '';
}

function scanContent(content, filePath) {
  const findings = [];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments that look like examples or documentation
    if (/^\s*[#\/\*].*(?:example|placeholder|your[_-]|xxx|changeme|TODO)/i.test(line)) continue;

    for (const { pattern, label } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({ file: filePath, line: i + 1, type: label });
        break; // One finding per line is enough
      }
    }
  }

  return findings;
}

/**
 * Core logic - exported for run-with-flags.js
 */
function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const cmd = String(input.tool_input?.command || '');

    if (!isCommitOrPush(cmd)) {
      return rawInput;
    }

    const stagedFiles = getStagedFiles();
    if (stagedFiles.length === 0) {
      return rawInput;
    }

    const allFindings = [];

    for (const file of stagedFiles) {
      if (shouldSkipFile(file)) continue;

      const content = getStagedContent(file);
      if (!content) continue;

      const findings = scanContent(content, file);
      allFindings.push(...findings);
    }

    if (allFindings.length > 0) {
      process.stderr.write('[Hook] BLOCKED: Potential secrets detected in staged files!\n');
      process.stderr.write('[Hook] Review these findings before committing:\n');

      for (const f of allFindings.slice(0, 10)) {
        process.stderr.write(`[Hook]   ${f.file}:${f.line} - ${f.type}\n`);
      }

      if (allFindings.length > 10) {
        process.stderr.write(`[Hook]   ... and ${allFindings.length - 10} more\n`);
      }

      process.stderr.write('[Hook] If these are intentional (e.g. test fixtures), use ECC_DISABLED_HOOKS=pre:bash:secret-scan\n');
      process.exitCode = 2;
      return rawInput;
    }
  } catch {
    // Don't block on errors
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
