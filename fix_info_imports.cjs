const fs = require('fs');
const files = [
  'src/components/Sidebar.tsx',
  'src/components/Toast.tsx',
  'src/views/DashboardView.tsx',
  'src/views/MenuView.tsx',
  'src/views/ProductsView.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s*\{([^}]+)\}\s*from\s*['"]@heroicons\/react\/24\/outline['"]/g, (match, p1) => {
    let replaced = p1.replace(/\bInfo\b/g, 'InformationCircleIcon');
    return `import {${replaced}} from '@heroicons/react/24/outline'`;
  });
  // also check JSX usages where Info was used
  content = content.replace(/<Info(\s|\/|>)/g, '<InformationCircleIcon$1');
  content = content.replace(/icon:\s*Info\b/g, 'icon: InformationCircleIcon');
  fs.writeFileSync(f, content, 'utf8');
  console.log(`Fixed imports in ${f}`);
});
