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

    // Fix [#HEX]/val1/val2 -> [#HEX]/val1
    content = content.replace(/\[(#[0-9a-fA-F]{3,8})\]\/(\d+)\/(\d+)/g, '[$1]/$2');
    
    // Also, let's inspect if we have [#HEX]/val1/val2/val3 (unlikely, but just in case)
    content = content.replace(/\[(#[0-9a-fA-F]{3,8})\]\/(\d+)\/(\d+)\/(\d+)/g, '[$1]/$2');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Cleaned slashes in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished cleaning slashes. Modified ${modifiedCount} files.`);
