#!/usr/bin/env node
/**
 * SessionStart Hook: Load tasks/lessons.md
 *
 * On session start, checks for tasks/lessons.md in the current project
 * and injects its content into Claude's context via stdout. This ensures
 * Claude never repeats past mistakes.
 *
 * Also checks tasks/todo.md for in-progress work context.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MAX_LESSONS_SIZE = 8000;  // Don't inject more than 8KB
const MAX_TODO_SIZE = 4000;     // Don't inject more than 4KB of todo

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

function readFileSafe(filePath, maxSize) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size === 0) return null;
    if (stat.size > maxSize) {
      // Read only the first maxSize bytes
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(maxSize);
      fs.readSync(fd, buffer, 0, maxSize, 0);
      fs.closeSync(fd);
      return buffer.toString('utf8') + '\n...(truncated)';
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// Read stdin (required by hook protocol) and pass through
let stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { stdinData += chunk; });
process.stdin.on('end', () => {
  const projectRoot = findProjectRoot(process.cwd());

  // Load lessons
  const lessonsPath = path.join(projectRoot, 'tasks', 'lessons.md');
  const lessons = readFileSafe(lessonsPath, MAX_LESSONS_SIZE);

  if (lessons) {
    process.stderr.write(`[SessionStart] Loaded lessons from ${lessonsPath}\n`);
    process.stdout.write(`Project lessons (from tasks/lessons.md — avoid repeating these mistakes):\n${lessons}\n\n`);
  }

  // Load todo for work context
  const todoPath = path.join(projectRoot, 'tasks', 'todo.md');
  const todo = readFileSafe(todoPath, MAX_TODO_SIZE);

  if (todo) {
    process.stderr.write(`[SessionStart] Loaded todo from ${todoPath}\n`);
    process.stdout.write(`Current task status (from tasks/todo.md):\n${todo}\n\n`);
  }

  if (!lessons && !todo) {
    process.stderr.write('[SessionStart] No tasks/lessons.md or tasks/todo.md found\n');
  }

  // Pass through stdin
  process.stdout.write(stdinData);
});
