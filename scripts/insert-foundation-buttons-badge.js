#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VIEWS_DIR = path.join(ROOT, 'templates', 'blog', 'views');

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHref(html, href) {
  const re = new RegExp(`href=["']${escapeRegExp(href)}["']`);
  return re.test(html);
}

function insertAfterLine(html, lineToMatch, insertLines) {
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  const lines = html.split(/\r\n|\n/);
  const idx = lines.findIndex((l) => l.includes(lineToMatch));
  if (idx === -1) return null;
  const out = lines.slice(0, idx + 1).concat(insertLines).concat(lines.slice(idx + 1));
  return out.join(newline);
}

function main() {
  if (!fs.existsSync(VIEWS_DIR)) {
    console.error(`Views directory not found: ${VIEWS_DIR}`);
    process.exit(1);
  }

  const files = listHtmlFiles(VIEWS_DIR);
  const modified = [];
  const skipped = [];
  const missingAnchor = [];

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const colorHrefMatch = original.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*css\/foundation\/color\.css)["'][^>]*>/i);
    if (!colorHrefMatch) {
      missingAnchor.push(path.relative(ROOT, filePath));
      continue;
    }

    const colorHref = colorHrefMatch[1];
    const prefix = colorHref.slice(0, colorHref.length - 'color.css'.length);
    const buttonsHref = `${prefix}buttons.css`;
    const badgeHref = `${prefix}badge.css`;

    const needsButtons = !hasHref(original, buttonsHref);
    const needsBadge = !hasHref(original, badgeHref);

    if (!needsButtons && !needsBadge) {
      skipped.push(path.relative(ROOT, filePath));
      continue;
    }

    const insertLines = [];
    if (needsButtons) insertLines.push(`  <link rel="stylesheet" href="${buttonsHref}">`);
    if (needsBadge) insertLines.push(`  <link rel="stylesheet" href="${badgeHref}">`);
    const colorLineNeedle = colorHref;
    const updated = insertAfterLine(original, colorLineNeedle, insertLines);
    if (updated == null) {
      missingAnchor.push(path.relative(ROOT, filePath));
      continue;
    }

    fs.writeFileSync(filePath, updated, 'utf8');
    modified.push(path.relative(ROOT, filePath));
  }

  const summary = {
    total: files.length,
    modified: modified.length,
    skipped: skipped.length,
    missingAnchor: missingAnchor.length
  };

  console.log(JSON.stringify({ summary, modified, skipped, missingAnchor }, null, 2));
}

main();
