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

    content = content.replace(/'text-white hover:bg-\[#EAEFEF\]'/g, "'text-[#25343F] hover:bg-[#EAEFEF]'");
    content = content.replace(/"text-white hover:bg-\[#EAEFEF\]"/g, '"text-[#25343F] hover:bg-[#EAEFEF]"');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed text color in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished fixing text colors. Modified ${modifiedCount} files.`);
