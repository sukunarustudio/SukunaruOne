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

    // We will aggressively replace bg-[#25343F] with bg-[#FF9B51] in common CTA button classes
    
    // Replace: bg-[#25343F] hover:bg-black disabled:opacity-50 text-white
    content = content.replace(/bg-\[#25343F\] hover:bg-black/g, 'bg-[#FF9B51] hover:bg-[#ff8c38]');
    content = content.replace(/bg-\[#25343F\] hover:bg-\[#1a2530\]/g, 'bg-[#FF9B51] hover:bg-[#ff8c38]');
    content = content.replace(/bg-\[#25343F\] active:bg-\[#1a2530\]/g, 'bg-[#FF9B51] active:bg-[#ff8c38]');
    
    // Fix the text color for the newly transformed orange buttons
    // We can't do this easily with regex without potentially breaking other things, but let's try:
    // If a button line has bg-[#FF9B51] and text-white, change to text-[#25343F]
    
    // Also, there are top header buttons: h-9 px-3.5 bg-[#25343F] hover:bg-[#1a2530] text-white
    // Let's replace 'bg-[#25343F] hover:bg-[#1a2530] text-white' -> 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]'
    
    // A broader regex to find `className="... bg-[#25343F] ... text-white ..."` inside a button.
    // Instead of parsing HTML, let's just do line by line replacements
    const lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // If it looks like a primary button class (has bg-[#25343F] and text-white or text-zinc-100)
      if (line.includes('bg-[#25343F]') && (line.includes('text-white') || line.includes('text-[#FFFFFF]'))) {
         // Is it a main CTA? Usually they have hover states or large padding (py-2, px-4, w-full, dll)
         if (line.includes('hover:bg') || line.includes('w-full') || line.includes('h-9 px-3.5') || line.includes('px-4 py-2') || line.includes('px-5 py-2.5') || line.includes('px-3 py-1.5')) {
            line = line.replace(/bg-\[#25343F\]/g, 'bg-[#FF9B51]');
            line = line.replace(/text-white/g, 'text-[#25343F]');
            line = line.replace(/text-\[#FFFFFF\]/g, 'text-[#25343F]');
            line = line.replace(/hover:bg-black/g, 'hover:bg-[#ff8c38]');
            line = line.replace(/hover:bg-\[#1a2530\]/g, 'hover:bg-[#ff8c38]');
         }
      }
      
      // Active states in pagination or tabs
      if (line.includes('bg-[#25343F] text-white') && (line.includes('active') || line.includes('tab'))) {
          line = line.replace(/bg-\[#25343F\]/g, 'bg-[#FF9B51]');
          line = line.replace(/text-white/g, 'text-[#25343F]');
      }

      if (line !== lines[i]) {
         lines[i] = line;
         changed = true;
      }
    }
    
    if (changed) {
      content = lines.join('\n');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Updated CTAs in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished advanced CTA replacement. Modified ${modifiedCount} files.`);
