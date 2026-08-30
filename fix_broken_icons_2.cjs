const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fixes = {
  'ListOrderedIcon': 'NumberedListIcon',
  'ExternalLinkIcon': 'ArrowTopRightOnSquareIcon',
  'LockIcon': 'LockClosedIcon',
  'DatabaseIcon': 'CircleStackIcon',
  'HardDriveIcon': 'ServerIcon',
  'MonitorIcon': 'ComputerDesktopIcon',
  'Code2Icon': 'CodeBracketIcon',
  'SaveIcon': 'DocumentCheckIcon',
  'InstagramIcon': 'CameraIcon',
  'DollarSignIcon': 'CurrencyDollarIcon',
  'TrendingDownIcon': 'ArrowTrendingDownIcon',
  'HelpCircleIcon': 'QuestionMarkCircleIcon',
  'PieChartIconIcon': 'ChartPieIcon',
  'PieChartIcon': 'ChartPieIcon',
  'PercentIcon': 'ReceiptPercentIcon',
  'TrendingDownIcon': 'ArrowTrendingDownIcon',
  'PaperclipIcon': 'PaperClipIcon',
  'ListIcon': 'ListBulletIcon',
  'CheckSquareIcon': 'CheckCircleIcon',
  'SquareIcon': 'StopIcon',
  'SlidersHorizontalIcon': 'AdjustmentsHorizontalIcon',
  'ArrowUpDownIcon': 'ArrowsUpDownIcon',
  'MessageCircleIcon': 'ChatBubbleOvalLeftIcon',
  'FileUpIcon': 'DocumentArrowUpIcon',
  'CoffeeIcon': 'BeakerIcon',
  'Building2Icon': 'BuildingOfficeIcon'
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
    
    // some might have ended up as GoodIconIcon
    content = content.split('IconIcon').join('Icon');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Fixed icons in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
