const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetFiles = [];
walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    targetFiles.push(filePath);
  }
});

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add font-mono to formatRupiah wrappers
  content = content.replace(/<span>(\{formatRupiah[^}]+\})<\/span>/g, '<span className="font-mono">$1</span>');
  content = content.replace(/HPP: (\{formatRupiah[^}]+\})/g, 'HPP: <span className="font-mono">$1</span>');
  content = content.replace(/Bayar \(\{formatRupiah[^}]+\}\)/g, 'Bayar (<span className="font-mono">$1</span>)');
  
  // also where we have <div>{formatRupiah...}</div> we want to add font-mono to the div
  content = content.replace(/<div className="([^"]*?)">(\{formatRupiah[^}]+\})<\/div>/g, (match, classes, format) => {
    if (!classes.includes('font-mono')) {
      return `<div className="${classes} font-mono">${format}</div>`;
    }
    return match;
  });

  // also for span
  content = content.replace(/<span className="([^"]*?)">(\{formatRupiah[^}]+\})<\/span>/g, (match, classes, format) => {
    if (!classes.includes('font-mono')) {
      return `<span className="${classes} font-mono">${format}</span>`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

targetFiles.forEach(processFile);
console.log('Done');
