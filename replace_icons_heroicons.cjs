const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const iconMap = {
  'LayoutDashboard': 'Squares2X2Icon',
  'Store': 'BuildingStorefrontIcon',
  'ShoppingCart': 'ShoppingCartIcon',
  'Cart': 'ShoppingCartIcon',
  'Users': 'UsersIcon',
  'UserCircle': 'UserCircleIcon',
  'Package': 'CubeIcon',
  'Calculator': 'CalculatorIcon',
  'Boxes': 'Square3Stack3DIcon',
  'Box': 'Square3Stack3DIcon',
  'Wallet': 'WalletIcon',
  'CreditCard': 'CreditCardIcon',
  'ReceiptText': 'ReceiptPercentIcon',
  'FileSpreadsheet': 'DocumentTextIcon',
  'FileText': 'DocumentTextIcon',
  'Receipt': 'DocumentTextIcon',
  'TrendingUp': 'ArrowTrendingUpIcon',
  'BarChart3': 'ChartBarIcon',
  'ChartBar': 'ChartBarIcon',
  'Archive': 'ArchiveBoxIcon',
  'Settings': 'Cog6ToothIcon',
  'Cog': 'Cog6ToothIcon',
  'Info': 'InformationCircleIcon',
  'InfoCircle': 'InformationCircleIcon',
  'BookOpen': 'BookOpenIcon',
  'MessageSquare': 'ChatBubbleLeftEllipsisIcon',
  'Message': 'ChatBubbleLeftEllipsisIcon',
  'Heart': 'HeartIcon',
  'PanelLeftClose': 'ChevronDoubleLeftIcon',
  'PanelLeftOpen': 'Bars3Icon',
  'X': 'XMarkIcon',
  'Search': 'MagnifyingGlassIcon',
  'Maximize2': 'ArrowsPointingOutIcon',
  'Maximize': 'ArrowsPointingOutIcon',
  'Minimize2': 'ArrowsPointingInIcon',
  'Minimize': 'ArrowsPointingInIcon',
  'CheckCircle2': 'CheckCircleIcon',
  'CheckCircle': 'CheckCircleIcon',
  'AlertTriangle': 'ExclamationTriangleIcon',
  'DangerCircle': 'ExclamationTriangleIcon',
  'Clock': 'ClockIcon',
  'ClockCircle': 'ClockIcon',
  'Plus': 'PlusIcon',
  'Minus': 'MinusIcon',
  'ArrowUpRight': 'ArrowUpRightIcon',
  'ArrowDownRight': 'ArrowDownRightIcon',
  'ClipboardList': 'ClipboardDocumentListIcon',
  'Clipboard': 'ClipboardDocumentListIcon',
  'Printer': 'PrinterIcon',
  'RefreshCw': 'ArrowPathIcon',
  'Refresh': 'ArrowPathIcon',
  'ArrowLeft': 'ArrowLeftIcon',
  'ChevronRight': 'ChevronRightIcon',
  'ChevronDown': 'ChevronDownIcon',
  'ChevronUp': 'ChevronUpIcon',
  'MoreHorizontal': 'EllipsisHorizontalIcon',
  'MoreVertical': 'EllipsisVerticalIcon',
  'Download': 'ArrowDownTrayIcon',
  'Upload': 'ArrowUpTrayIcon',
  'Trash': 'TrashIcon',
  'Edit': 'PencilSquareIcon',
  'Copy': 'DocumentDuplicateIcon',
  'LogOut': 'ArrowRightOnRectangleIcon',
  'Image': 'PhotoIcon',
  'Smartphone': 'DevicePhoneMobileIcon',
  'Menu': 'Bars3Icon',
  'Check': 'CheckIcon',
  'Phone': 'PhoneIcon',
  'Camera': 'CameraIcon',
  'BrandWhatsapp': 'ChatBubbleLeftIcon',
  'Link': 'LinkIcon',
  'Share': 'ShareIcon',
  'Eye': 'EyeIcon',
  'EyeOff': 'EyeSlashIcon',
  'Grid': 'Squares2X2Icon', // fallback
  'Filter': 'FunnelIcon',
  'Calendar': 'CalendarIcon',
  'ChevronLeft': 'ChevronLeftIcon',
  'MapPin': 'MapPinIcon',
  'Mail': 'EnvelopeIcon',
  'Loader2': 'ArrowPathIcon', // Heroicons doesn't have a specific loader, arrow path spins fine
  'TriangleAlert': 'ExclamationTriangleIcon',
  'Bell': 'BellIcon'
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

    // Check if it imports from mynaui
    if (content.includes('@mynaui/icons-react') || content.includes('lucide-react')) {
      // Find the import statement
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:@mynaui\/icons-react|lucide-react)['"];?/g;
      
      let match;
      while ((match = importRegex.exec(original)) !== null) {
        const importBlock = match[0];
        const innerIcons = match[1].split(',').map(s => s.trim()).filter(s => s);
        
        let newHeroImports = new Set();
        let replacements = [];

        innerIcons.forEach(iconDef => {
          let originalName = iconDef;
          let aliasName = iconDef;
          
          if (iconDef.includes(' as ')) {
            const parts = iconDef.split(' as ');
            originalName = parts[0].trim();
            aliasName = parts[1].trim();
          }

          let heroIcon = iconMap[aliasName] || iconMap[originalName];
          if (!heroIcon) {
             console.log(`WARNING: No mapping for ${originalName} (alias: ${aliasName}) in ${path.basename(filePath)}`);
             heroIcon = aliasName + 'Icon'; // guess
          }
          newHeroImports.add(heroIcon);
          
          if (aliasName !== heroIcon) {
            replacements.push({ from: new RegExp(`<${aliasName}\\b`, 'g'), to: `<${heroIcon}` });
            replacements.push({ from: new RegExp(`\\b${aliasName}\\b`, 'g'), to: `${heroIcon}` }); // for dynamic like `const Icon = ...`
          }
        });
        
        if (newHeroImports.size > 0) {
          const newImportStr = `import { ${Array.from(newHeroImports).join(', ')} } from '@heroicons/react/24/outline';`;
          content = content.replace(importBlock, newImportStr);
          
          replacements.forEach(r => {
             content = content.replace(r.from, r.to);
          });
        }
      }
    }

    if (content !== original) {
       // Also fix some specific stroke issues because heroicons stroke width can't be easily changed via stroke-[2.2]
       // Heroicons defaults to stroke-2. We can just leave tailwind stroke classes, they might work, or strip them.
       content = content.replace(/stroke-\[2\.2\]/g, 'stroke-2');
       content = content.replace(/stroke-\[1\.8\]/g, '');
       content = content.replace(/animate-spin/g, 'animate-spin'); // ArrowPathIcon with animate-spin looks like a loader
       
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Replaced icons in ${path.basename(filePath)}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
