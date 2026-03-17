#!/usr/bin/env node
/**
 * Pre-Bash Hook: Environment Variable Validation Before Deploys
 *
 * Detects deployment commands and checks that required environment variables
 * exist before allowing the deploy to proceed. Looks for .env.required,
 * .env.example, or a deploy-env section in package.json.
 *
 * Exit codes:
 *   0 - All env vars present or not a deploy command
 *   2 - Missing required env vars, blocks the tool call
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEPLOY_PATTERNS = [
  /\bdeploy\b/i,
  /\bcdk\s+deploy\b/i,
  /\bserverless\s+deploy\b/i,
  /\bsam\s+deploy\b/i,
  /\bterraform\s+apply\b/i,
  /\bpulumi\s+up\b/i,
  /\bkubectl\s+apply\b/i,
  /\bhelm\s+(install|upgrade)\b/i,
  /\bdocker\s+push\b/i,
  /\bfly\s+deploy\b/i,
  /\brailway\s+up\b/i,
  /\bvercel\s+--prod\b/i,
  /\bnpm\s+run\s+deploy\b/i,
  /\byarn\s+deploy\b/i,
  /\bpnpm\s+deploy\b/i,
];

function isDeployCommand(cmd) {
  return DEPLOY_PATTERNS.some(p => p.test(cmd));
}

/**
 * Find required env var names from project config files.
 * Checks in order: .env.required, .env.example, package.json deployEnv
 */
function findRequiredEnvVars() {
  const cwd = process.cwd();
  const required = new Set();

  // Check .env.required (one var name per line)
  const envRequiredPath = path.join(cwd, '.env.required');
  if (fs.existsSync(envRequiredPath)) {
    const content = fs.readFileSync(envRequiredPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // Support both "VAR_NAME" and "VAR_NAME=default_value" formats
        const varName = trimmed.split('=')[0].trim();
        if (varName) required.add(varName);
      }
    }
    return { source: '.env.required', vars: Array.from(required) };
  }

  // Check .env.example (extract var names, skip comments)
  const envExamplePath = path.join(cwd, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([A-Z][A-Z0-9_]*)\s*=/);
        if (match) required.add(match[1]);
      }
    }
    return { source: '.env.example', vars: Array.from(required) };
  }

  // Check package.json for deployEnv field
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deployEnv = pkg.deployEnv || pkg['deploy-env'];
      if (Array.isArray(deployEnv)) {
        return { source: 'package.json deployEnv', vars: deployEnv };
      }
    } catch {
      // ignore parse errors
    }
  }

  return { source: null, vars: [] };
}

/**
 * Core logic - exported for run-with-flags.js
 */
function run(rawInput) {
  try {
    const input = JSON.parse(rawInput);
    const cmd = String(input.tool_input?.command || '');

    if (!isDeployCommand(cmd)) {
      return rawInput;
    }

    const { source, vars } = findRequiredEnvVars();

    if (vars.length === 0) {
      // No env var requirements defined — warn but don't block
      process.stderr.write('[Hook] Deploy detected but no .env.required or .env.example found.\n');
      process.stderr.write('[Hook] Consider creating .env.required to list required env vars for deploys.\n');
      return rawInput;
    }

    const missing = vars.filter(v => !process.env[v] || process.env[v].trim() === '');

    if (missing.length > 0) {
      process.stderr.write(`[Hook] BLOCKED: Missing required environment variables for deployment!\n`);
      process.stderr.write(`[Hook] Source: ${source}\n`);
      process.stderr.write(`[Hook] Missing variables:\n`);

      for (const v of missing) {
        process.stderr.write(`[Hook]   - ${v}\n`);
      }

      process.stderr.write('[Hook] Set these env vars before deploying.\n');
      process.stderr.write('[Hook] To skip this check: ECC_DISABLED_HOOKS=pre:bash:deploy-env-check\n');
      process.exitCode = 2;
      return rawInput;
    }

    process.stderr.write(`[Hook] Deploy env check passed (${vars.length} vars verified from ${source})\n`);
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
