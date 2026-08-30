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

  // Add font-mono to classNames wrapping formatRupiah
  // Find <tag className="...">...{formatRupiah...}...
  // Better approach: regex to find formatRupiah, then look backwards to find className=""
  // A simpler regex replace to just add font-mono:
  // Since we don't have a full AST parser, we'll look for specific patterns:
  
  content = content.replace(/className="([^"]*?text-(?:[a-z]+-\d+|slate-900|emerald-500|rose-600)[^"]*?)"([^>]*>)\s*\{?(?:[A-Za-z0-9_.]+\s*\?\s*)?formatRupiah/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}`;
    }
    return match;
  });

  content = content.replace(/className='([^']*?)'([^>]*>)\s*\{formatRupiah/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className='${classes} font-mono'${rest}`;
    }
    return match;
  });

  // Adding font-mono to {order.id} displays
  content = content.replace(/className="([^"]*?text-(?:[a-z]+-\d+|slate-900)[^"]*?)"([^>]*>)(?:\s*(?:#|No\.\s*|INV-|ORD-))?\s*\{order\.id/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}`;
    }
    return match;
  });

  // Adding font-mono to {product.sku}
  content = content.replace(/className="([^"]*?text-(?:[a-z]+-\d+|slate-500|slate-600)[^"]*?)"([^>]*>)(?:\s*(?:SKU:\s*))?\{product\.sku/g, (match, classes, rest) => {
    if (!classes.includes('font-mono')) {
      return `className="${classes} font-mono"${rest}`;
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
