const fs = require('fs');
let c = fs.readFileSync('src/views/OrdersView.tsx', 'utf8');

// Replace the first occurrence of CheckCircleIcon,
c = c.replace('CheckCircleIcon, ', '');

fs.writeFileSync('src/views/OrdersView.tsx', c);
console.log('Fixed OrdersView.tsx properly');
