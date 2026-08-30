const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
const mynaui = require('@mynaui/icons-react');
const mynauiKeys = Object.keys(mynaui);

let usedIcons = new Set();
let filesWithLucide = [];

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    // Multiline import regex
    const match = content.match(/import\s+\{([\s\S]*?)\}\s+from\s+['"]lucide-react['"]/);
    if (match) {
        filesWithLucide.push(f);
        // Handle aliases like `Image as ImageIcon` -> `Image`
        const imports = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
        imports.forEach(i => usedIcons.add(i));
    }
});

const usedArray = Array.from(usedIcons);
const missing = usedArray.filter(i => !mynauiKeys.includes(i));
console.log('Total used:', usedArray.length);
console.log('Used:', usedArray.join(', '));
console.log('Missing:', missing.join(', '));
