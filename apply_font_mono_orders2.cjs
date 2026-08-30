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

  // Add font-mono to order.id wrappers
  content = content.replace(/className="([^"]*?text-[^"]*?)"([^>]*>)((?:\s*(?:#|No\.\s*|INV-|ORD-))?\s*\{order\.id[^}]*\})/g, (match, classes, rest, theMatch) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}${theMatch}`;
    }
    return match;
  });

  // Add font-mono to product.sku wrappers
  content = content.replace(/className="([^"]*?text-[^"]*?)"([^>]*>)((?:\s*(?:SKU:\s*))?\{product\.sku[^}]*\})/g, (match, classes, rest, theMatch) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}${theMatch}`;
    }
    return match;
  });

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
