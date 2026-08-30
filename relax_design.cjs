const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // 1. Replace shadow-2xs with shadow-md to bring back the beautiful floating depth
    // (We also replace any shadow-xs with shadow-md/sm for consistency)
    content = content.replace(/shadow-2xs/g, 'shadow-md');
    content = content.replace(/shadow-xs/g, 'shadow-sm');

    // 2. Soften the border-[#BFC9D1] to border-[#BFC9D1]/30 for cards and main panels
    // We only want to soften the border of large containers, like bg-white elements.
    // If a line contains both 'bg-white' and 'border-[#BFC9D1]', we'll change it to border-[#BFC9D1]/30
    // Actually, making ALL border-[#BFC9D1] slightly softer globally is very safe and makes the overall UI less harsh/flat.
    // Let's change border-[#BFC9D1] to border-[#BFC9D1]/30 on lines that have cards, or just globally on any border container.
    // Wait, let's look at what we replace:
    // border-[#BFC9D1] -> border-[#BFC9D1]/30
    // (This is much softer, almost like a light shadow boundary)
    content = content.replace(/border border-\[#BFC9D1\]/g, 'border border-[#BFC9D1]/25');
    content = content.replace(/border-b border-\[#BFC9D1\]/g, 'border-b border-[#BFC9D1]/40');
    content = content.replace(/border-t border-\[#BFC9D1\]/g, 'border-t border-[#BFC9D1]/40');
    content = content.replace(/border-l border-\[#BFC9D1\]/g, 'border-l border-[#BFC9D1]/40');
    content = content.replace(/border-r border-\[#BFC9D1\]/g, 'border-r border-[#BFC9D1]/40');

    // Make sure we didn't duplicate /30
    content = content.replace(/\/25\/25/g, '/25');
    content = content.replace(/\/40\/40/g, '/40');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Relaxed design in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
