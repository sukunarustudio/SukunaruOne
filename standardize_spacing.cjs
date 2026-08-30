const fs = require('fs');
const path = require('path');

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

const files = walk('./src/views');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace outer container space-y-4, space-y-5, space-y-6 with space-y-3.5
    // Typical patterns: className="... space-y-4 ..." or `space-y-6`
    
    // For specific views main div:
    content = content.replace(/className="([^"]*)space-y-4([^"]*max-w-[^"]*)"/g, 'className="$1space-y-3.5$2"');
    content = content.replace(/className="([^"]*)space-y-5([^"]*max-w-[^"]*)"/g, 'className="$1space-y-3.5$2"');
    content = content.replace(/className="([^"]*)space-y-6([^"]*max-w-[^"]*)"/g, 'className="$1space-y-3.5$2"');

    // Also replace inner layout space-y-4 with space-y-3.5 to make it tighter
    content = content.replace(/space-y-4/g, 'space-y-3.5');
    content = content.replace(/space-y-5/g, 'space-y-3.5');
    content = content.replace(/space-y-6/g, 'space-y-4'); // 6 is too big, reduce to 4
    
    // For grids: gap-4 -> gap-3.5
    content = content.replace(/gap-4/g, 'gap-3.5');
    content = content.replace(/gap-5/g, 'gap-3.5');
    content = content.replace(/gap-6/g, 'gap-4');

    // For padding inside cards, sometimes it's p-4 or p-5. Dashboard uses p-3 sm:p-4 or p-4.
    // Dashboard: bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4
    // Wait, replacing padding globally might break buttons. Let's just do gap and space-y.

    fs.writeFileSync(f, content);
    console.log(`Updated spacing in ${f}`);
});

console.log('Done!');
