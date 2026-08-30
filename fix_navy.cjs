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

    // Fix navy bg with navy text to white text
    content = content.replace(/(bg-\[#25343F\][^"\}]*)text-\[#25343F\]/g, '$1text-white');

    // Make main CTA buttons orange. We search for generic button combinations.
    // e.g. "bg-[#25343F] hover:bg-[#1a2530] text-white" -> "bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]"
    content = content.replace(/bg-\[#25343F\] hover:bg-\[#1a2530\] text-white/g, 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished fixing navy text. Modified ${modifiedCount} files.`);
