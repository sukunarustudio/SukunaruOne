const fs = require('fs');
let c = fs.readFileSync('src/views/OrdersView.tsx', 'utf8');
c = c.replace(/CheckCircleIcon, CheckCircleIcon/g, 'CheckCircleIcon');
fs.writeFileSync('src/views/OrdersView.tsx', c);
console.log('Fixed OrdersView.tsx');
