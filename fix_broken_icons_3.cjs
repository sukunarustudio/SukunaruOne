const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fixes = {
  'NumberedListBulletIcon': 'NumberedListIcon',
  'ReceiptReceiptPercentIcon': 'ReceiptPercentIcon',
  'ArrowTopRightOnStopIcon': 'ArrowTopRightOnSquareIcon',
  'PencilStopIcon': 'PencilSquareIcon',
  'ClipboardDocumentListBulletIcon': 'ClipboardDocumentListIcon',
  'ArrowArrowTrendingDownIcon': 'ArrowTrendingDownIcon',
};

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

    for (const [badIcon, goodIcon] of Object.entries(fixes)) {
      if (content.includes(badIcon)) {
         content = content.split(badIcon).join(goodIcon);
      }
    }
    
    // Fix duplicate CheckCircleIcon in OrdersView
    if (filePath.includes('OrdersView.tsx')) {
        // e.g., import { ..., CheckCircleIcon, CheckCircleIcon, ... }
        // Let's just fix it by regex
        content = content.replace(/CheckCircleIcon,\s*CheckCircleIcon,/g, 'CheckCircleIcon,');
        content = content.replace(/CheckCircleIcon,\s*CheckCircleIcon/g, 'CheckCircleIcon');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed double icons in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
