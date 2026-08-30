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

    // 1. MobileBottomNav: make active text orange
    if (filePath.includes('MobileBottomNav.tsx')) {
      content = content.replace(/text-\[#25343F\] font-bold/g, 'text-[#FF9B51] font-bold');
    }

    // 2. Change all bg-[#25343F] text-white buttons to bg-[#FF9B51] text-[#25343F] if they are primary actions.
    // Since BisnisUrang uses Orange as the primary brand/CTA color, let's aggressively change Navy buttons that have hover states 
    // to Orange, as Navy is typically for secondary/neutral or headers.
    // E.g., `bg-[#25343F] hover:bg-[#1a2530] text-white`
    content = content.replace(/bg-\[#25343F\] hover:bg-\[#1a2530\] text-white/g, 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]');
    content = content.replace(/bg-\[#25343F\] text-white hover:bg-\[#1a2530\]/g, 'bg-[#FF9B51] text-[#25343F] hover:bg-[#ff8c38]');

    // Also catch some variants:
    // bg-slate-900 (if any remain)
    content = content.replace(/bg-slate-900 hover:bg-slate-800 text-white/g, 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]');
    
    // In Dashboard, the "todoItems" dotColor might be orange, it's already bg-[#FF9B51]
    
    // Some buttons might be 'bg-[#25343F] text-white' without hover in the same string, let's find buttons containing 'Simpan', 'Tambah', 'Bayar'
    // We will do this manually for files if needed, but let's try a regex for JSX buttons with specific text
    // Actually, `bg-[#25343F] text-white` is very common for the old primary button. Let's replace it globally inside className of buttons.
    // Instead of regex hacking JSX too deeply, let's just replace `bg-[#25343F] text-white` where it's clearly a button.
    
    // Let's replace standard Navy button classes with Orange button classes globally.
    // Because in BisnisUrang, Orange IS the primary action color. Navy is only for the Hero card or inactive stuff.
    content = content.replace(/bg-\[#25343F\] hover:bg-\[#1a2530\]/g, 'bg-[#FF9B51] hover:bg-[#ff8c38]');
    // Now any button that became orange needs dark text instead of white text:
    // (If a button has bg-[#FF9B51], it shouldn't have text-white, it should have text-[#25343F])
    // We'll do a second pass to fix text color on orange background
    
    if (content !== original) {
      // Fix text color for orange buttons
      // If a line has bg-[#FF9B51] and text-white, change text-white to text-[#25343F]
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('bg-[#FF9B51]') && lines[i].includes('text-white')) {
          lines[i] = lines[i].replace(/text-white/g, 'text-[#25343F]');
        }
        if (lines[i].includes('bg-[#FF9B51]') && lines[i].includes('text-[#FFFFFF]')) {
          lines[i] = lines[i].replace(/text-\[#FFFFFF\]/g, 'text-[#25343F]');
        }
      }
      content = lines.join('\n');
      
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Updated accent in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
