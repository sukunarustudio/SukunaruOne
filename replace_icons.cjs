const fs = require('fs');
const path = require('path');

const map = {
  Loader2: 'Spinner',
  AlertCircle: 'DangerCircle',
  Clock: 'ClockCircle',
  ListOrdered: 'ListNumber',
  Layers: 'Box',
  AlertTriangle: 'DangerCircle',
  ShoppingCart: 'Cart',
  Receipt: 'FileText',
  FileSpreadsheet: 'FileText',
  MessageSquare: 'Message',
  Calculator: 'Grid', // Fallback
  Boxes: 'Box',
  Wallet: 'CreditCard',
  ReceiptText: 'FileText',
  BarChart3: 'ChartBar',
  Settings: 'Cog',
  CheckCircle2: 'CheckCircle',
  Maximize2: 'Maximize',
  Minimize2: 'Minimize',
  Cpu: 'Box', // Fallback
  Code2: 'Code',
  Phone: 'Telephone', // I'll verify if telephone exists, or just use Chat
  DollarSign: 'Dollar',
  Trash2: 'Trash',
  ClipboardList: 'Clipboard',
  RefreshCw: 'Refresh',
  HelpCircle: 'QuestionCircle',
  PieChart: 'ChartPie',
  Percent: 'Percentage',
  RotateCcw: 'Refresh',
  LayoutGrid: 'Grid',
  SlidersHorizontal: 'List', // fallback
  MoreVertical: 'Menu', // fallback or MoreVertical if exists
  MessageCircle: 'Chat',
  FileUp: 'File', // fallback
  QrCode: 'Grid', // fallback
  Building2: 'BuildingOne',
  Printer: 'Printer',
  Download: 'Download',
  Check: 'Check',
  Calendar: 'Calendar',
  CheckCircle: 'CheckCircle',
  Tag: 'Tag',
  Sparkles: 'Sparkles',
  Search: 'Search',
  User: 'User',
  Package: 'Package',
  ArrowRight: 'ArrowRight',
  LayoutDashboard: 'Grid',
  Store: 'Store',
  UserCircle: 'UserCircle',
  Image: 'Image',
  Users: 'Users',
  TrendingUp: 'TrendingUp',
  Archive: 'Archive',
  Info: 'InfoCircle',
  BookOpen: 'BookOpen',
  Heart: 'Heart',
  PanelLeftClose: 'PanelLeftClose',
  PanelLeftOpen: 'PanelLeftOpen',
  Menu: 'Menu',
  Database: 'Database',
  ShieldCheck: 'ShieldCheck',
  HardDrive: 'HardDrive',
  Monitor: 'Monitor',
  ArrowLeft: 'ArrowLeft',
  Mail: 'Mail',
  Instagram: 'Instagram',
  ExternalLink: 'ExternalLink',
  MapPin: 'MapPin',
  Plus: 'Plus',
  ShoppingBag: 'ShoppingBag',
  Edit: 'Edit',
  ChevronRight: 'ChevronRight',
  ArrowUpRight: 'ArrowUpRight',
  ArrowDownRight: 'ArrowDownRight',
  TrendingDown: 'TrendingDown',
  CreditCard: 'CreditCard',
  Filter: 'Filter',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  Save: 'Save',
  ArrowDownLeft: 'ArrowDownLeft',
  Eye: 'Eye',
  Minus: 'Minus',
  Upload: 'Upload',
  ChevronLeft: 'ChevronLeft',
  Paperclip: 'Paperclip',
  List: 'List',
  CheckSquare: 'CheckSquare',
  Square: 'Square',
  ArrowUpDown: 'ArrowUpDown',
  Camera: 'Camera',
  Coffee: 'Coffee',
};

// Also we should check if they actually exist in mynaui
const mynaui = require('@mynaui/icons-react');
const mynauiKeys = Object.keys(mynaui);

for (const [key, val] of Object.entries(map)) {
    if (!mynauiKeys.includes(val)) {
        // Fallback to a known existing icon if val does not exist
        map[key] = 'Star'; // Default fallback
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Check if it has lucide-react import
    if (!content.includes('lucide-react')) return;

    // 1. Find the lucide-react import
    const match = content.match(/import\s+\{([\s\S]*?)\}\s+from\s+['"]lucide-react['"];?/);
    if (!match) return;

    // 2. Parse the imported icons
    const importStr = match[1];
    const items = importStr.split(',').map(s => s.trim()).filter(Boolean);
    
    let newImports = new Set();
    let replacements = [];

    items.forEach(item => {
        let original = item;
        let local = item;
        if (item.includes(' as ')) {
            const parts = item.split(/\s+as\s+/);
            original = parts[0].trim();
            local = parts[1].trim();
        }

        const mapped = map[original] || original;
        
        // If there's no mapping or we fallback to the same name
        if (mapped === local) {
            newImports.add(mapped);
        } else {
            // We need to rename in the file or use 'as'
            // Using 'as' is safer: `Mapped as Local`
            if (mapped !== local) {
                 newImports.add(`${mapped} as ${local}`);
            } else {
                 newImports.add(mapped);
            }
        }
    });

    const newImportStatement = `import { ${Array.from(newImports).join(', ')} } from '@mynaui/icons-react';`;
    content = content.replace(match[0], newImportStatement);

    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
});

console.log('Done!');
