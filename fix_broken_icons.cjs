const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fixes = {
  'WrenchIcon': 'WrenchScrewdriverIcon',
  'ListOrderedIcon': 'NumberedListIcon',
  'ListNumberIcon': 'NumberedListIcon',
  'ExternalLinkIcon': 'ArrowTopRightOnSquareIcon',
  'LockIcon': 'LockClosedIcon',
  'DatabaseIcon': 'CircleStackIcon',
  'HardDriveIcon': 'ServerIcon',
  'MonitorIcon': 'ComputerDesktopIcon',
  'Code2Icon': 'CodeBracketIcon',
  'CodeIcon': 'CodeBracketIcon',
  'SaveIcon': 'DocumentCheckIcon',
  'InstagramIcon': 'CameraIcon',
  'DollarSignIcon': 'CurrencyDollarIcon',
  'DollarIcon': 'CurrencyDollarIcon',
  'TrendingDownIcon': 'ArrowTrendingDownIcon',
  'HelpCircleIcon': 'QuestionMarkCircleIcon',
  'QuestionCircleIcon': 'QuestionMarkCircleIcon',
  'PercentIcon': 'ReceiptPercentIcon',
  'PercentageIcon': 'ReceiptPercentIcon',
  'PaperclipIcon': 'PaperClipIcon',
  'ListIcon': 'ListBulletIcon',
  'CheckSquareIcon': 'CheckCircleIcon',
  'SquareIcon': 'StopIcon',
  'SlidersHorizontalIcon': 'AdjustmentsHorizontalIcon',
  'ArrowUpDownIcon': 'ArrowsUpDownIcon',
  'MessageCircleIcon': 'ChatBubbleOvalLeftIcon',
  'ChatIcon': 'ChatBubbleOvalLeftIcon',
  'FileUpIcon': 'DocumentArrowUpIcon',
  'FileIcon': 'DocumentIcon',
  'CoffeeIcon': 'BeakerIcon',
  'Building2Icon': 'BuildingOfficeIcon',
  'BuildingOneIcon': 'BuildingOfficeIcon',
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
         content = content.replace(new RegExp(`\\b${badIcon}\\b`, 'g'), goodIcon);
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed icons in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
