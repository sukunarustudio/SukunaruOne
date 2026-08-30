const fs = require('fs');

let c = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

const startStr = '      {/* ── SALDO KAS UTAMA ─────────────────────────────────────────────────── */}';
const endStr = '      {/* ── KEUANGAN ───────────────────────────────────────────────────────── */}';

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      {/* ── SALDO KAS UTAMA ─────────────────────────────────────────────────── */}
      <div 
        onClick={() => goTo('finance')}
        className="bg-[#121622] rounded-xl p-4 sm:p-5 text-white shadow-xs border border-slate-800 flex flex-col cursor-pointer hover:border-slate-600 transition-all group active:scale-[0.99]"
      >
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          Saldo Kas Bisnis
        </div>
        <div className="text-[28px] sm:text-3xl font-black text-white font-mono tracking-tight mt-1">
          {formatRupiah(stats.totalCashBalance ?? (stats.todayRevenue - stats.todayExpense))}
        </div>
        
        {(() => {
          const todayNet = stats.todayRevenue - stats.todayExpense;
          if (todayNet === 0) return null;
          const isPositive = todayNet >= 0;
          return (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px]">
              <span className={\`font-bold font-mono \${isPositive ? 'text-emerald-400' : 'text-rose-400'}\`}>
                {isPositive ? '↑' : '↓'} {formatRupiah(Math.abs(todayNet))}
              </span>
              <span className="text-slate-400">dari kemarin</span>
            </div>
          );
        })()}

        <div className="h-px bg-slate-800 my-4 w-full" />

        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
          <span className="text-white">Arus Kas</span>
          <span className="text-slate-300 group-hover:text-white flex items-center transition-colors">
            Buka <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>
      </div>

`;
  c = c.slice(0, startIndex) + replacement + c.slice(endIndex);
  fs.writeFileSync('src/views/DashboardView.tsx', c);
  console.log('Replaced successfully.');
} else {
  console.log('Could not find markers.');
}
