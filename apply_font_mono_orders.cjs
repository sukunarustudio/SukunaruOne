const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  content = content.replace(/className="([^"]*?text-(?:[a-z]+-\d+|slate-900)[^"]*?)"([^>]*>)(?:\s*(?:#|No\.\s*|INV-|ORD-))?\s*\{order\.id/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}`;
    }
    return match;
  });

  content = content.replace(/className="([^"]*?text-(?:[a-z]+-\d+|slate-500|slate-600)[^"]*?)"([^>]*>)(?:\s*(?:SKU:\s*))?\{product\.sku/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}`;
    }
    return match;
  });

  // also format like {order.id} inside <span> without className
  content = content.replace(/<span>\s*(\{order\.id[^}]*\})\s*<\/span>/g, '<span className="font-mono">$1</span>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    processFile(filePath);
  }
});
console.log('Done');
