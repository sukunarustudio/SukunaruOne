// Kompactkan header di semua sub-halaman menu Profil
const fs = require('fs');

const FILES = [
  'src/views/BusinessProfileView.tsx',
  'src/views/ContactView.tsx',
  'src/views/GuideView.tsx',
  'src/views/SupportView.tsx',
  'src/views/SettingsView.tsx',
  'src/views/AppInfoView.tsx',
];

FILES.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;

  // 1. Perkecil padding header card: p-4 → p-3
  c = c.replace(
    /className="flex items-center justify-between gap-3 bg-white border border-(?:slate-200\/80|\[#BFC9D1\]) rounded-2xl p-4([^"]*?)"/g,
    'className="flex items-center justify-between gap-3 bg-white border border-[#BFC9D1] rounded-xl p-3$1"'
  );

  // 2. Tombol back lebih kecil: p-2 → p-1.5
  c = c.replace(
    /className="p-2 rounded-xl bg-\[#EAEFEF\]/g,
    'className="p-1.5 rounded-lg bg-[#EAEFEF]'
  );
  // legacy pattern
  c = c.replace(
    /className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"/g,
    'className="p-1.5 rounded-lg bg-[#EAEFEF] hover:bg-[#BFC9D1]/60 text-[#25343F] transition-colors cursor-pointer active:scale-95"'
  );

  // 3. Ikon ArrowLeft: w-5 h-5 → w-4 h-4
  c = c.replace(/<ArrowLeft className="w-5 h-5" \/>/g, '<ArrowLeft className="w-4 h-4" />');

  // 4. Judul header: text-sm sm:text-base → text-xs sm:text-sm (lebih compact)
  c = c.replace(
    /className="text-sm sm:text-base font-black text-slate-900 leading-tight"/g,
    'className="text-xs sm:text-sm font-black text-[#25343F] leading-tight"'
  );
  // SettingsView variant
  c = c.replace(
    /className="text-sm sm:text-base font-black text-\[#25343F\] leading-tight"/g,
    'className="text-xs sm:text-sm font-black text-[#25343F] leading-tight"'
  );

  // 5. Subjudul: text-xs → text-[10px], truncate agar tidak wrap
  c = c.replace(
    /className="text-xs text-slate-500 font-medium mt-0.5"/g,
    'className="text-[10px] text-slate-400 font-medium mt-0.5 truncate"'
  );

  // 6. Ikon kanan: w-10 h-10 rounded-2xl → w-8 h-8 rounded-xl
  c = c.replace(
    /className="w-10 h-10 rounded-2xl bg-\[#EAEFEF\] text-\[#25343F\] border border-\[#BFC9D1\] flex items-center justify-center shrink-0"/g,
    'className="w-8 h-8 rounded-xl bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1] flex items-center justify-center shrink-0"'
  );
  // legacy (bigger icon box in BusinessProfileView)
  c = c.replace(
    /className="w-10 h-10 rounded-2xl bg-\[#EAEFEF\] text-\[#25343F\] border border-(?:slate-200\/80|\[#BFC9D1\]) flex items-center justify-center shrink-0"/g,
    'className="w-8 h-8 rounded-xl bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1] flex items-center justify-center shrink-0"'
  );

  // 7. Icon di dalam box: w-5 h-5 → w-4 h-4 (yang di ikon header kanan)
  // (hanya untuk box icon, bukan semua ikon di halaman)

  if (c !== orig) {
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('✓', filePath);
  } else {
    console.log(' ', filePath, '(no match)');
  }
});
console.log('Done!');
