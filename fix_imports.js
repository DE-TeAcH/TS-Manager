const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('Frontend/pages/api');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix config import
    if (content.includes("from '../../config")) {
        content = content.replace(/from '\.\.\/\.\.\/config/g, "from '../config");
        changed = true;
    }

    // Fix utils import
    if (content.includes("from '../../utils")) {
        content = content.replace(/from '\.\.\/\.\.\/utils/g, "from '../utils");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed imports in ${file}`);
    }
});
