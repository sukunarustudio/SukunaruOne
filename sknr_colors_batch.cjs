// ===================================================================
// SKNR Design System - Batch Color Standardization
// Palette: Navy=#25343F, Orange=#FF9B51, Mist=#EAEFEF, Blue-gray=#BFC9D1
// ===================================================================
const fs = require('fs');
const path = require('path');

// Files to process (all tsx + ts except utils.ts which was already done)
const FILES = [
  'src/views/DashboardView.tsx',
  'src/views/OrdersView.tsx',
  'src/views/PosView.tsx',
  'src/views/ProductsView.tsx',
  'src/views/InventoryView.tsx',
  'src/views/FinanceView.tsx',
  'src/views/CustomersView.tsx',
  'src/views/InvoicesView.tsx',
  'src/views/ReportsView.tsx',
  'src/views/HppCalculatorView.tsx',
  'src/views/ExpensesView.tsx',
  'src/views/SettingsView.tsx',
  'src/views/GuideView.tsx',
  'src/views/SupportView.tsx',
  'src/views/ContactView.tsx',
  'src/views/AppInfoView.tsx',
  'src/views/BusinessProfileView.tsx',
  'src/views/ProfileView.tsx',
  'src/views/MenuView.tsx',
  'src/components/Sidebar.tsx',
  'src/components/Toast.tsx',
  'src/components/ConfirmDialog.tsx',
  'src/components/BatchPrintOrdersModal.tsx',
  'src/components/PrintInvoiceModal.tsx',
  'src/components/PrintReceiptModal.tsx',
];

// ── Color replacement rules (order matters — specific first) ──────────────
const REPLACEMENTS = [
  // === BACKGROUND COLORS ===
  // Indigo → Navy
  [/\bbg-indigo-900\b/g,   'bg-[#1a2530]'],
  [/\bbg-indigo-800\b/g,   'bg-[#25343F]'],
  [/\bbg-indigo-700\b/g,   'bg-[#25343F]'],
  [/\bbg-indigo-600\b/g,   'bg-[#25343F]'],
  [/\bbg-indigo-500\b/g,   'bg-[#25343F]'],
  [/\bbg-indigo-100\b/g,   'bg-[#EAEFEF]'],
  [/\bbg-indigo-50\b/g,    'bg-[#EAEFEF]'],

  // Violet/Purple → Navy
  [/\bbg-violet-700\b/g,   'bg-[#25343F]'],
  [/\bbg-violet-600\b/g,   'bg-[#25343F]'],
  [/\bbg-violet-500\b/g,   'bg-[#25343F]'],
  [/\bbg-violet-100\b/g,   'bg-[#EAEFEF]'],
  [/\bbg-violet-50\b/g,    'bg-[#EAEFEF]'],
  [/\bbg-purple-700\b/g,   'bg-[#25343F]'],
  [/\bbg-purple-600\b/g,   'bg-[#25343F]'],
  [/\bbg-purple-100\b/g,   'bg-[#EAEFEF]'],
  [/\bbg-purple-50\b/g,    'bg-[#EAEFEF]'],

  // Blue → Mist/Navy (dark blues → navy, light blues → mist)
  [/\bbg-blue-900\b/g,     'bg-[#25343F]'],
  [/\bbg-blue-800\b/g,     'bg-[#25343F]'],
  [/\bbg-blue-700\b/g,     'bg-[#25343F]'],
  [/\bbg-blue-600\b/g,     'bg-[#25343F]'],
  [/\bbg-blue-500\b/g,     'bg-[#25343F]'],
  [/\bbg-blue-100\b/g,     'bg-[#EAEFEF]'],
  [/\bbg-blue-50\b/g,      'bg-[#EAEFEF]'],

  // Emerald/Green → Navy (success/positive → navy muted)
  [/\bbg-emerald-700\b/g,  'bg-[#25343F]'],
  [/\bbg-emerald-600\b/g,  'bg-[#25343F]'],
  [/\bbg-emerald-500\b/g,  'bg-[#25343F]'],
  [/\bbg-emerald-200\b/g,  'bg-[#EAEFEF]'],
  [/\bbg-emerald-100\b/g,  'bg-[#EAEFEF]'],
  [/\bbg-emerald-50\b/g,   'bg-[#EAEFEF]'],

  // Rose/Red → Orange (error/danger as attention state)
  [/\bbg-rose-700\b/g,     'bg-[#25343F]'],
  [/\bbg-rose-600\b/g,     'bg-[#FF9B51]'],
  [/\bbg-rose-500\b/g,     'bg-[#FF9B51]'],
  [/\bbg-rose-200\b/g,     'bg-[#FF9B51]/20'],
  [/\bbg-rose-100\b/g,     'bg-[#FF9B51]/15'],
  [/\bbg-rose-50\b/g,      'bg-[#FF9B51]/8'],

  // Amber → Orange (warning → sknr orange)
  [/\bbg-amber-700\b/g,    'bg-[#FF9B51]'],
  [/\bbg-amber-600\b/g,    'bg-[#FF9B51]'],
  [/\bbg-amber-500\b/g,    'bg-[#FF9B51]'],
  [/\bbg-amber-200\b/g,    'bg-[#FF9B51]/20'],
  [/\bbg-amber-100\b/g,    'bg-[#FF9B51]/15'],
  [/\bbg-amber-50\b/g,     'bg-[#FF9B51]/8'],

  // Cyan → Mist
  [/\bbg-cyan-700\b/g,     'bg-[#25343F]'],
  [/\bbg-cyan-500\b/g,     'bg-[#25343F]'],
  [/\bbg-cyan-100\b/g,     'bg-[#EAEFEF]'],
  [/\bbg-cyan-50\b/g,      'bg-[#EAEFEF]'],

  // === TEXT COLORS ===
  [/\btext-indigo-900\b/g, 'text-[#25343F]'],
  [/\btext-indigo-800\b/g, 'text-[#25343F]'],
  [/\btext-indigo-700\b/g, 'text-[#25343F]'],
  [/\btext-indigo-600\b/g, 'text-[#25343F]'],
  [/\btext-indigo-500\b/g, 'text-[#25343F]'],
  [/\btext-indigo-400\b/g, 'text-[#BFC9D1]'],

  [/\btext-violet-900\b/g, 'text-[#25343F]'],
  [/\btext-violet-800\b/g, 'text-[#25343F]'],
  [/\btext-violet-700\b/g, 'text-[#25343F]'],
  [/\btext-violet-600\b/g, 'text-[#25343F]'],
  [/\btext-violet-500\b/g, 'text-[#25343F]'],

  [/\btext-purple-800\b/g, 'text-[#25343F]'],
  [/\btext-purple-700\b/g, 'text-[#25343F]'],
  [/\btext-purple-600\b/g, 'text-[#25343F]'],
  [/\btext-purple-500\b/g, 'text-[#25343F]'],

  [/\btext-blue-900\b/g,   'text-[#25343F]'],
  [/\btext-blue-800\b/g,   'text-[#25343F]'],
  [/\btext-blue-700\b/g,   'text-[#25343F]'],
  [/\btext-blue-600\b/g,   'text-[#25343F]'],
  [/\btext-blue-500\b/g,   'text-[#25343F]'],
  [/\btext-blue-400\b/g,   'text-[#BFC9D1]'],

  [/\btext-emerald-900\b/g,'text-[#25343F]'],
  [/\btext-emerald-800\b/g,'text-[#25343F]'],
  [/\btext-emerald-700\b/g,'text-[#25343F]'],
  [/\btext-emerald-600\b/g,'text-[#25343F]'],
  [/\btext-emerald-500\b/g,'text-[#25343F]'],
  [/\btext-emerald-400\b/g,'text-[#FF9B51]'],

  [/\btext-rose-900\b/g,   'text-[#c45e00]'],
  [/\btext-rose-800\b/g,   'text-[#c45e00]'],
  [/\btext-rose-700\b/g,   'text-[#c45e00]'],
  [/\btext-rose-600\b/g,   'text-[#c45e00]'],
  [/\btext-rose-500\b/g,   'text-[#c45e00]'],
  [/\btext-rose-400\b/g,   'text-[#FF9B51]'],

  [/\btext-amber-900\b/g,  'text-[#c45e00]'],
  [/\btext-amber-800\b/g,  'text-[#c45e00]'],
  [/\btext-amber-700\b/g,  'text-[#c45e00]'],
  [/\btext-amber-600\b/g,  'text-[#FF9B51]'],
  [/\btext-amber-500\b/g,  'text-[#FF9B51]'],
  [/\btext-amber-400\b/g,  'text-[#FF9B51]'],

  [/\btext-cyan-700\b/g,   'text-[#25343F]'],
  [/\btext-cyan-600\b/g,   'text-[#25343F]'],
  [/\btext-cyan-500\b/g,   'text-[#25343F]'],

  // === BORDER COLORS ===
  [/\bborder-indigo-\d+\b/g, 'border-[#BFC9D1]'],
  [/\bborder-violet-\d+\b/g, 'border-[#BFC9D1]'],
  [/\bborder-purple-\d+\b/g, 'border-[#BFC9D1]'],
  [/\bborder-blue-\d+\b/g,   'border-[#BFC9D1]'],
  [/\bborder-emerald-\d+\b/g,'border-[#BFC9D1]'],
  [/\bborder-rose-\d+\b/g,   'border-[#FF9B51]/40'],
  [/\bborder-amber-\d+\b/g,  'border-[#FF9B51]/40'],
  [/\bborder-cyan-\d+\b/g,   'border-[#BFC9D1]'],

  // === RING COLORS (focus states) ===
  [/\bring-indigo-\d+\b/g,   'ring-[#25343F]'],
  [/\bring-violet-\d+\b/g,   'ring-[#25343F]'],
  [/\bring-blue-\d+\b/g,     'ring-[#25343F]'],
  [/\bring-emerald-\d+\b/g,  'ring-[#25343F]'],
  [/\bring-rose-\d+\b/g,     'ring-[#FF9B51]'],
  [/\bring-amber-\d+\b/g,    'ring-[#FF9B51]'],

  // === HOVER/ACTIVE VARIANTS (with bg-) ===
  [/\bhover:bg-indigo-\d+\b/g,   'hover:bg-[#25343F]'],
  [/\bhover:bg-violet-\d+\b/g,   'hover:bg-[#25343F]'],
  [/\bhover:bg-blue-\d+\b/g,     'hover:bg-[#EAEFEF]'],
  [/\bhover:bg-emerald-\d+\b/g,  'hover:bg-[#EAEFEF]'],
  [/\bhover:bg-rose-\d+\b/g,     'hover:bg-[#FF9B51]/10'],
  [/\bhover:bg-amber-\d+\b/g,    'hover:bg-[#FF9B51]/10'],

  [/\bhover:text-indigo-\d+\b/g, 'hover:text-[#25343F]'],
  [/\bhover:text-violet-\d+\b/g, 'hover:text-[#25343F]'],
  [/\bhover:text-blue-\d+\b/g,   'hover:text-[#25343F]'],
  [/\bhover:text-emerald-\d+\b/g,'hover:text-[#25343F]'],
  [/\bhover:text-rose-\d+\b/g,   'hover:text-[#c45e00]'],
  [/\bhover:text-amber-\d+\b/g,  'hover:text-[#c45e00]'],

  // === GRADIENT FROM/TO (replace gradients with flat navy) ===
  [/\bfrom-emerald-\d+\b/g, 'from-[#25343F]'],
  [/\bto-emerald-\d+\b/g,   'to-[#25343F]'],
  [/\bfrom-indigo-\d+\b/g,  'from-[#25343F]'],
  [/\bto-indigo-\d+\b/g,    'to-[#25343F]'],
  [/\bfrom-rose-\d+\b/g,    'from-[#FF9B51]'],
  [/\bto-rose-\d+\b/g,      'to-[#FF9B51]'],
  [/\bfrom-amber-\d+\b/g,   'from-[#FF9B51]'],
  [/\bto-amber-\d+\b/g,     'to-[#FF9B51]'],

  // === DIVIDE COLORS ===
  [/\bdivide-indigo-\d+\b/g,   'divide-[#BFC9D1]/50'],
  [/\bdivide-emerald-\d+\b/g,  'divide-[#BFC9D1]/50'],
];

let totalChanges = 0;

FILES.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  REPLACEMENTS.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    // Count rough number of changes
    const changes = (content.match(/\[#25343F\]|\[#FF9B51\]|\[#EAEFEF\]|\[#BFC9D1\]/g) || []).length;
    const prevChanges = (original.match(/\[#25343F\]|\[#FF9B51\]|\[#EAEFEF\]|\[#BFC9D1\]/g) || []).length;
    const delta = changes - prevChanges;
    totalChanges += delta;
    console.log(`✓ ${path.basename(filePath)} (+${delta} SKNR tokens)`);
  } else {
    console.log(`  ${path.basename(filePath)} (no changes)`);
  }
});

console.log(`\nDone! Total ~${totalChanges} SKNR color tokens applied.`);
