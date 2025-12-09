/**
 * Script to identify potentially unused files in the codebase
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { readFileSync } from 'fs';

const projectRoot = process.cwd();

// Files to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'index.tsx',
  '.env',
  '.env.local',
  'README.md',
  'metadata.json'
];

// Extensions to check
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const DOC_EXTENSIONS = ['.md', '.sql', '.sh', '.mjs'];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORE_PATTERNS.some(pattern => filePath.includes(pattern))) {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFileUsage(filePath: string, allFiles: string[]): boolean {
  const fileName = basename(filePath);
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const relativePath = filePath.replace(projectRoot + '/', '');

  // Skip if it's the file itself
  if (filePath === relativePath) return true;

  // Check if file is imported/referenced
  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;
    if (!CODE_EXTENSIONS.includes(extname(otherFile))) continue;

    try {
      const content = readFileSync(otherFile, 'utf-8');
      
      // Check various import patterns
      const patterns = [
        new RegExp(`import.*from.*['"]\\.?/?${relativePath.replace(/\.tsx?$/, '')}['"]`, 'i'),
        new RegExp(`import.*from.*['"]\\.?/?${relativePath.replace(/\.tsx?$/, '').replace(/\//g, '[/\\\\]')}['"]`, 'i'),
        new RegExp(`require\\(['"]\\.?/?${relativePath.replace(/\.tsx?$/, '')}['"]\\)`, 'i'),
        new RegExp(`['"]${fileName}['"]`, 'i'),
        new RegExp(`['"]${fileNameWithoutExt}['"]`, 'i'),
        new RegExp(`/${fileNameWithoutExt}`, 'i'),
      ];

      if (patterns.some(pattern => pattern.test(content))) {
        return true;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  return false;
}

function main() {
  console.log('🔍 Checking for unused files...\n');

  const allFiles = getAllFiles(projectRoot);
  const codeFiles = allFiles.filter(f => CODE_EXTENSIONS.includes(extname(f)));
  const docFiles = allFiles.filter(f => DOC_EXTENSIONS.includes(extname(f)));

  console.log(`📊 Found ${codeFiles.length} code files`);
  console.log(`📄 Found ${docFiles.length} documentation/config files\n`);

  // Check scripts directory
  const scriptsDir = join(projectRoot, 'scripts');
  const scriptsFiles = codeFiles.filter(f => f.startsWith(scriptsDir));
  
  console.log('📜 Checking scripts...');
  const unusedScripts: string[] = [];
  
  for (const script of scriptsFiles) {
    const relativePath = script.replace(projectRoot + '/', '');
    const isUsed = checkFileUsage(script, allFiles);
    
    if (!isUsed) {
      unusedScripts.push(relativePath);
    }
  }

  // Check components
  const componentsDir = join(projectRoot, 'components');
  const componentFiles = codeFiles.filter(f => f.startsWith(componentsDir));
  
  console.log('🧩 Checking components...');
  const unusedComponents: string[] = [];
  
  for (const component of componentFiles) {
    const relativePath = component.replace(projectRoot + '/', '');
    const isUsed = checkFileUsage(component, allFiles);
    
    if (!isUsed && !relativePath.includes('shared')) {
      unusedComponents.push(relativePath);
    }
  }

  // Check pages
  const pagesDir = join(projectRoot, 'pages');
  const pageFiles = codeFiles.filter(f => f.startsWith(pagesDir));
  
  console.log('📄 Checking pages...');
  const unusedPages: string[] = [];
  
  for (const page of pageFiles) {
    const relativePath = page.replace(projectRoot + '/', '');
    const isUsed = checkFileUsage(page, allFiles);
    
    if (!isUsed) {
      unusedPages.push(relativePath);
    }
  }

  // Check for duplicate files
  console.log('\n🔍 Checking for duplicate files...');
  const fileNames = new Map<string, string[]>();
  
  for (const file of allFiles) {
    const name = basename(file);
    if (!fileNames.has(name)) {
      fileNames.set(name, []);
    }
    fileNames.get(name)!.push(file.replace(projectRoot + '/', ''));
  }

  const duplicates = Array.from(fileNames.entries())
    .filter(([_, paths]) => paths.length > 1);

  // Report results
  console.log('\n═══════════════════════════════════════');
  console.log('📊 UNUSED FILES REPORT');
  console.log('═══════════════════════════════════════\n');

  if (unusedScripts.length > 0) {
    console.log(`⚠️  Potentially Unused Scripts (${unusedScripts.length}):`);
    unusedScripts.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  if (unusedComponents.length > 0) {
    console.log(`⚠️  Potentially Unused Components (${unusedComponents.length}):`);
    unusedComponents.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  if (unusedPages.length > 0) {
    console.log(`⚠️  Potentially Unused Pages (${unusedPages.length}):`);
    unusedPages.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  if (duplicates.length > 0) {
    console.log(`⚠️  Duplicate File Names (${duplicates.length}):`);
    duplicates.forEach(([name, paths]) => {
      console.log(`   ${name}:`);
      paths.forEach(p => console.log(`      - ${p}`));
    });
    console.log('');
  }

  if (unusedScripts.length === 0 && unusedComponents.length === 0 && unusedPages.length === 0 && duplicates.length === 0) {
    console.log('✅ No unused files found!');
  }

  console.log('\n📝 Note: This is a heuristic check. Some files may be:');
  console.log('   - Used dynamically (require, dynamic imports)');
  console.log('   - Entry points (index.tsx, App.tsx)');
  console.log('   - Configuration files');
  console.log('   - Test files');
  console.log('   - Documentation files');
}

main();

