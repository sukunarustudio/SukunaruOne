// Standarisasi warna SKNR di DashboardView.tsx
// Navy=#25343F, Orange=#FF9B51, Mist=#EAEFEF, Blue-gray=#BFC9D1

const fs = require('fs');
let c = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

// Saldo card: ubah bg-[#121622] ke navy #25343F, dan emerald/rose indicator ke orange/slate
c = c.replace(/bg-\[#121622\]/g, 'bg-[#25343F]');
c = c.replace(/border-slate-800(?!\w)/g, 'border-[#25343F]/60');
c = c.replace(/hover:border-slate-600/g, 'hover:border-[#BFC9D1]');
c = c.replace(/bg-slate-800/g, 'bg-[#25343F]/80');

// "dari kemarin" indicator: emerald → orange, rose → slate
c = c.replace(/text-emerald-400/g, "text-[#FF9B51]");
c = c.replace(/text-rose-400/g, "text-[#BFC9D1]");

// KPI section: emerald arrow icon → navy
c = c.replace(/text-emerald-600/g, 'text-[#25343F]');
c = c.replace(/text-emerald-500(?!\w)/g, 'text-[#25343F]');

// Todo section: dot colors (blue-500, amber-500, emerald-500, rose-500) → orange or navy
c = c.replace(/dotColor: 'bg-blue-500'/g, "dotColor: 'bg-[#FF9B51]'");
c = c.replace(/dotColor: 'bg-amber-500'/g, "dotColor: 'bg-[#FF9B51]'");
c = c.replace(/dotColor: 'bg-emerald-500'/g, "dotColor: 'bg-[#25343F]'");
c = c.replace(/dotColor: 'bg-rose-500'/g, "dotColor: 'bg-[#FF9B51]'");

// Todo section: bgSoft backgrounds → mist
c = c.replace(/bgSoft: 'bg-slate-50 border-slate-200\/80'/g, "bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60'");

// Todo count badge bg → navy
c = c.replace(/bg-slate-900 text-white text-\[9px\] font-black flex items-center justify-center'\)/g, 
  "bg-[#25343F] text-white text-[9px] font-black flex items-center justify-center')");

// Semua aman state: emerald → navy
c = c.replace(/text-emerald-700/g, 'text-[#25343F]');
c = c.replace(/text-emerald-400(?!\w)/g, 'text-[#25343F]');

// Bahan baku: amber badge menipis → orange
c = c.replace(/bg-amber-100 text-amber-700/g, 'bg-[#FF9B51]/15 text-[#c45e00]');
c = c.replace(/bg-amber-100 text-amber-800/g, 'bg-[#FF9B51]/15 text-[#c45e00]');
c = c.replace(/text-amber-500/g, 'text-[#FF9B51]');
c = c.replace(/text-amber-600(?!\w)/g, 'text-[#FF9B51]');
c = c.replace(/hover:bg-amber-50/g, 'hover:bg-[#FF9B51]/5');

// Borders → blue-gray  
c = c.replace(/border-slate-200(?!\w)/g, 'border-[#BFC9D1]');
c = c.replace(/border-slate-100(?!\w)/g, 'border-[#BFC9D1]/50');

// Section card bg → white, subtle improvements
c = c.replace(/bg-slate-50(?!\w)/g, 'bg-[#EAEFEF]/50');

// Header sticky bg
c = c.replace(/bg-\[#f8f9fa\]/g, 'bg-[#EAEFEF]');

// Hover states
c = c.replace(/hover:bg-slate-50(?!\w)/g, 'hover:bg-[#EAEFEF]/60');
c = c.replace(/active:bg-slate-100/g, 'active:bg-[#EAEFEF]');
c = c.replace(/hover:bg-slate-200/g, 'hover:bg-[#BFC9D1]/50');

// KPI period filter
c = c.replace(/bg-slate-100\/90/g, 'bg-[#EAEFEF]');
c = c.replace(/text-slate-400 hover:text-slate-700/g, 'text-[#25343F]/50 hover:text-[#25343F]');

fs.writeFileSync('src/views/DashboardView.tsx', c);
console.log('DashboardView.tsx updated ✓');
