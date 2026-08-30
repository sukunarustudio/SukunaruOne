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

    // Replace the specific patterns we found:
    // 1. bg-white text-white border-[#BFC9D1] hover:bg-[#EAEFEF] -> bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]
    content = content.replace(/bg-white text-white border-\[#BFC9D1\]/g, 'bg-white text-[#898989] border-[#BFC9D1]');
    
    // 2. Variants where classes are ordered differently, e.g. bg-white border-[#BFC9D1] text-white
    content = content.replace(/bg-white border-\[#BFC9D1\] text-white/g, 'bg-white border-[#BFC9D1] text-[#898989]');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed white icons in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished fixing white icons. Modified ${modifiedCount} files.`);
