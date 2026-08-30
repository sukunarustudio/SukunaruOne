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

const replacements = [
  // Typography
  { search: /text-slate-900/g, replace: 'text-[#25343F]' },
  { search: /text-slate-800/g, replace: 'text-[#25343F]' },
  { search: /text-slate-700/g, replace: 'text-[#25343F]' },
  { search: /text-slate-600/g, replace: 'text-[#898989]' },
  { search: /text-slate-500/g, replace: 'text-[#898989]' },
  { search: /text-slate-400/g, replace: 'text-[#898989]' },
  
  // Backgrounds
  { search: /bg-slate-900/g, replace: 'bg-[#25343F]' },
  { search: /bg-slate-800/g, replace: 'bg-[#25343F]' },
  { search: /bg-slate-100/g, replace: 'bg-[#EAEFEF]' },
  { search: /bg-slate-50/g, replace: 'bg-[#EAEFEF]' },
  { search: /bg-slate-200/g, replace: 'bg-[#EAEFEF]' },
  
  // Borders
  { search: /border-slate-200/g, replace: 'border-[#BFC9D1]' },
  { search: /border-slate-300/g, replace: 'border-[#BFC9D1]' },
  { search: /border-slate-400/g, replace: 'border-[#BFC9D1]' },
  
  // Hover states
  { search: /hover:bg-slate-100/g, replace: 'hover:bg-[#EAEFEF]' },
  { search: /hover:bg-slate-50/g, replace: 'hover:bg-[#EAEFEF]' },
  { search: /hover:bg-slate-800/g, replace: 'hover:bg-[#1a2530]' },
  { search: /hover:bg-slate-900/g, replace: 'hover:bg-[#1a2530]' },
  { search: /hover:text-slate-900/g, replace: 'hover:text-[#25343F]' },
  { search: /hover:text-slate-800/g, replace: 'hover:text-[#25343F]' },
  
  // Make primary buttons orange (finding common patterns)
  // E.g., bg-[#25343F] hover:bg-[#1a2530] text-white -> bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]
  // Let's do this carefully
  { search: /bg-\[#25343F\] hover:bg-\[#1a2530\] text-white/g, replace: 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]' },
  // And fix some specific button text
  { search: /bg-\[#FF9B51\] hover:bg-\[#ff8c38\] text-white/g, replace: 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]' },
  
  // Replace the old shadow classes with BisnisUrang's subtle shadows
  { search: /shadow-sm/g, replace: 'shadow-2xs' },
  { search: /shadow-md/g, replace: 'shadow-sm' },
];

let modifiedCount = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
    }
  }
});

console.log(`Finished slate/zinc replacement. Modified ${modifiedCount} files.`);
