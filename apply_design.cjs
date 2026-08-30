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
  // MobileBottomNav Active/Inactive
  { search: /text-zinc-900(?=.*currentView ===)/g, replace: 'text-[#FF9B51]' },
  { search: /text-zinc-400(?=.*currentView ===)/g, replace: 'text-[#898989]' },
  { search: /bg-white\/95 backdrop-blur-md border-t border-zinc-200\/80/g, replace: 'bg-white/95 backdrop-blur-md border-t border-[#BFC9D1]/50' },
  { search: /bg-black text-white/g, replace: 'bg-[#FF9B51] text-[#25343F]' }, // badges

  // Sidebar Active/Inactive
  { search: /bg-zinc-100 text-zinc-900 font-bold shadow-2xs/g, replace: 'bg-[#FF9B51]/15 text-[#25343F] font-bold border border-[#FF9B51]/30' },
  { search: /text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 font-medium/g, replace: 'text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] font-medium' },
  { search: /text-zinc-900 stroke-\[2\.2\]/g, replace: 'text-[#FF9B51] stroke-[2.2]' },
  { search: /text-zinc-400 group-hover:text-zinc-700/g, replace: 'text-[#898989] group-hover:text-[#25343F]' },
  { search: /text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/g, replace: 'text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF]' },

  // General text and backgrounds
  { search: /text-zinc-900/g, replace: 'text-[#25343F]' },
  { search: /text-zinc-800/g, replace: 'text-[#25343F]' },
  { search: /text-zinc-500/g, replace: 'text-[#898989]' },
  { search: /text-zinc-400/g, replace: 'text-[#898989]' },
  { search: /bg-zinc-50/g, replace: 'bg-[#EAEFEF]' },
  { search: /bg-zinc-100/g, replace: 'bg-[#EAEFEF]' },
  { search: /border-zinc-200/g, replace: 'border-[#BFC9D1]' },
  { search: /border-zinc-300/g, replace: 'border-[#BFC9D1]' },
];

let modifiedCount = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });

    // Make CTAs primary orange
    // Replace typical CTA buttons: bg-[#25343F] text-white -> bg-[#FF9B51] text-[#25343F]
    // We'll target ones that have 'Tambah' or 'Simpan' or are main CTAs.
    // To be safe, we can manually check or just use regex for typical button classes.
    // For now, let's just do the ones above.

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${path.basename(filePath)}`);
      modifiedCount++;
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
