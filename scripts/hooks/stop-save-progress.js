#!/usr/bin/env node
/**
 * Stop Hook: Save Progress Summary to tasks/todo.md
 *
 * After each response, checks if tasks/todo.md exists and updates
 * the "Last Active" timestamp. If the file doesn't exist, this hook
 * is a no-op (it doesn't create todo.md from scratch — that's done
 * by the planning workflow).
 *
 * This ensures the next session always knows when work last happened.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.git')) ||
        fs.existsSync(path.join(dir, 'package.json')) ||
        fs.existsSync(path.join(dir, 'CLAUDE.md'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Core logic - exported for run-with-flags.js
 */
function run(rawInput) {
  try {
    const projectRoot = findProjectRoot(process.cwd());
    const todoPath = path.join(projectRoot, 'tasks', 'todo.md');

    if (!fs.existsSync(todoPath)) {
      return rawInput;
    }

    let content = fs.readFileSync(todoPath, 'utf8');
    const timestamp = getTimestamp();

    // Update or add "Last Active" line
    const lastActivePattern = /^>\s*\*\*Last Active:\*\*.*$/m;
    const lastActiveLine = `> **Last Active:** ${timestamp}`;

    if (lastActivePattern.test(content)) {
      content = content.replace(lastActivePattern, lastActiveLine);
    } else {
      // Add after the first heading
      const headingMatch = content.match(/^#.+$/m);
      if (headingMatch) {
        const idx = content.indexOf(headingMatch[0]) + headingMatch[0].length;
        content = content.slice(0, idx) + '\n' + lastActiveLine + content.slice(idx);
      }
    }

    fs.writeFileSync(todoPath, content, 'utf8');
    process.stderr.write(`[Hook] Updated tasks/todo.md last active: ${timestamp}\n`);
  } catch {
    // Silent — don't interrupt session for todo tracking failures
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
