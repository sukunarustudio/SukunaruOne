const fs = require('fs');

function processFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  let orig = c;
  c = c.replace(/className="([^"]*?)">\{order\.orderNumber\}/g, (match, classes) => {
    if (!classes.includes('font-mono')) return `className="${classes} font-mono">{order.orderNumber}`;
    return match;
  });
  // sometimes there's whitespace or #
  c = c.replace(/className="([^"]*?)">\s*(?:#)?\{order\.orderNumber\}/g, (match, classes) => {
    if (!classes.includes('font-mono')) return `className="${classes} font-mono">{order.orderNumber}`;
    return match;
  });
  
  if (c !== orig) {
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed', filePath);
  }
}

processFile('src/views/OrdersView.tsx');
processFile('src/views/CustomersView.tsx');
processFile('src/components/BatchPrintOrdersModal.tsx');
