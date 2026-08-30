const fs = require('fs');

let c = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

const startStr = '      {/* ── AKSI CEPAT (8 Fitur dalam Grid 4 Kolom x 2 Baris) ───────────── */}';
const endStr = '      {/* ── PERLU DIKERJAKAN ────────────────────────────────────────────────── */}';

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      {/* ── AKSI CEPAT (8 Fitur dalam Grid 4 Kolom x 2 Baris) ───────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs py-4 px-2 sm:p-5">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2 sm:gap-6">
          {[
            // Baris 1: Operasional Utama
            {
              icon: <ShoppingCart className="w-5 h-5" />,
              label: 'Pesanan',
              badge: stats.activeOrdersCount > 0 ? stats.activeOrdersCount : undefined,
              color: 'text-indigo-700',
              bg: 'bg-indigo-50',
              onClick: () => goTo('orders', 'filter:SEMUA:table'),
            },
            {
              icon: <Users className="w-5 h-5" />,
              label: 'Pelanggan',
              color: 'text-blue-700',
              bg: 'bg-blue-50',
              onClick: () => goTo('customers'),
            },
            {
              icon: <Package className="w-5 h-5" />,
              label: 'Produk saya',
              color: 'text-slate-800',
              bg: 'bg-slate-100',
              onClick: () => goTo('products'),
            },
            {
              icon: <Calculator className="w-5 h-5" />,
              label: 'Hitung HPP',
              color: 'text-violet-700',
              bg: 'bg-violet-50',
              onClick: () => goTo('hpp'),
            },

            // Baris 2: Logistik, Keuangan, Laporan & Pengaturan
            {
              icon: <Boxes className="w-5 h-5" />,
              label: 'Bahan Baku',
              badge: stats.lowStockItemsCount > 0 ? stats.lowStockItemsCount : undefined,
              color: 'text-amber-700',
              bg: 'bg-amber-50',
              onClick: () => goTo('inventory'),
            },
            {
              icon: <Wallet className="w-5 h-5" />,
              label: 'Arus Kas',
              color: 'text-emerald-700',
              bg: 'bg-emerald-50',
              onClick: () => goTo('finance'),
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              label: 'Laporan',
              color: 'text-indigo-800',
              bg: 'bg-indigo-50',
              onClick: () => goTo('sales-report'),
            },
            {
              icon: <Settings className="w-5 h-5" />,
              label: 'Pengaturan',
              color: 'text-slate-700',
              bg: 'bg-slate-100',
              onClick: () => goTo('settings'),
            },
          ].map(action => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center justify-start gap-2 hover:opacity-80 active:scale-95 transition-all cursor-pointer group relative"
            >
              <div className={\`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl \${action.bg} \${action.color} flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 relative\`}>
                {action.icon}
                {action.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 border-2 border-white text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {action.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 text-center leading-tight max-w-[70px]">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

`;
  c = c.slice(0, startIndex) + replacement + c.slice(endIndex);
  fs.writeFileSync('src/views/DashboardView.tsx', c);
  console.log('Replaced successfully.');
} else {
  console.log('Could not find markers.');
}
