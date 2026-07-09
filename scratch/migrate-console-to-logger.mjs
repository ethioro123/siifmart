#!/usr/bin/env node
/**
 * Migrate raw console.log / console.error calls to logger in pages/ and components/
 *
 * Strategy:
 *   console.error('msg', err)  →  logger.error('Module', 'msg', err)
 *   console.error('msg')       →  logger.error('Module', 'msg', new Error('msg'))
 *   console.log('msg')         →  logger.debug('Module', 'msg')
 *   console.warn('msg')        →  logger.warn('Module', 'msg')
 *
 * The module name is derived from the file path (last directory + file stem).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TARGETS = ['pages', 'components', 'hooks', 'contexts'];
const EXT = ['.ts', '.tsx'];

let totalFiles = 0;
let totalReplacements = 0;

function deriveModule(filePath) {
    const rel = path.relative(ROOT, filePath);
    const parts = rel.replace(/\\/g, '/').split('/');
    const stem = path.basename(parts[parts.length - 1], path.extname(parts[parts.length - 1]));
    // e.g. pages/Inventory.tsx → "Inventory"
    // e.g. components/fulfillment/pack/PackScanner.tsx → "PackScanner"
    return stem;
}

function needsLoggerImport(content) {
    return /console\.(log|error|warn)/.test(content) && !/import.*logger.*from/.test(content);
}

function addLoggerImport(content, filePath) {
    // Calculate relative path from file to utils/logger
    const rel = path.relative(path.dirname(filePath), path.join(ROOT, 'utils', 'logger'));
    const importPath = rel.startsWith('.') ? rel.replace(/\\/g, '/') : './' + rel.replace(/\\/g, '/');

    // Insert after the last import statement
    const lines = content.split('\n');
    let lastImportLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImportLine = i;
    }
    const insertAt = lastImportLine === -1 ? 0 : lastImportLine + 1;
    lines.splice(insertAt, 0, `import { logger } from '${importPath}';`);
    return lines.join('\n');
}

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const module = deriveModule(filePath);
    let replacements = 0;

    // Skip files that already use logger and have no console calls
    if (!/console\.(log|error|warn)/.test(content)) return;

    // console.error(msg, err) or console.error(msg)
    content = content.replace(/console\.error\(([^)]+)\)/g, (match, args) => {
        replacements++;
        const trimmed = args.trim();
        // If two args: first is message, second is error
        if (trimmed.includes(',')) {
            const commaIdx = trimmed.indexOf(',');
            const msg = trimmed.slice(0, commaIdx).trim();
            const err = trimmed.slice(commaIdx + 1).trim();
            return `logger.error('${module}', ${msg}, ${err})`;
        }
        return `logger.error('${module}', ${trimmed}, new Error(String(${trimmed})))`;
    });

    // console.warn(...)
    content = content.replace(/console\.warn\(([^)]+)\)/g, (match, args) => {
        replacements++;
        return `logger.warn('${module}', ${args.trim()})`;
    });

    // console.log(...)
    content = content.replace(/console\.log\(([^)]+)\)/g, (match, args) => {
        replacements++;
        return `logger.debug('${module}', ${args.trim()})`;
    });

    if (replacements > 0) {
        // Add logger import if not present
        if (needsLoggerImport(content) || !/import.*logger.*from/.test(content)) {
            // Only add if we actually replaced something
            if (!/import.*logger.*from/.test(content)) {
                content = addLoggerImport(content, filePath);
            }
        }
        fs.writeFileSync(filePath, content, 'utf8');
        totalFiles++;
        totalReplacements += replacements;
        console.log(`  ✅ ${path.relative(ROOT, filePath)} — ${replacements} replacements`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full);
        } else if (entry.isFile() && EXT.includes(path.extname(entry.name))) {
            migrateFile(full);
        }
    }
}

console.log('🔄 Migrating console.log/error/warn → logger...\n');
for (const target of TARGETS) {
    walkDir(path.join(ROOT, target));
}
console.log(`\n✅ Done — ${totalReplacements} replacements across ${totalFiles} files`);
