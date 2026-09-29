const fs = require('fs');
const path = 'src/pages/MarketplacePage.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `const PAYMENT_METHODS = [
  { id:"vodacom",  label:"Vodacom M-Pesa" },
  { id:"airtel",   label:"Airtel Money" },
  { id:"yas",      label:"Yas Money" },
  { id:"tigo",     label:"Tigo Pesa" },
  { id:"bank",     label:"Bank Transfer" },
  { id:"lipa",     label:"Lipa Namba" },
  { id:"cash",     label:"Cash on Delivery" },
];`;

const endOfModal = `  );
}

// ── Product Card ────────────────────────────────────`;

const startIdx = content.indexOf(targetStr);
const endIdx = content.indexOf(endOfModal);

if (startIdx !== -1 && endIdx !== -1) {
  const code = fs.readFileSync('replace_order_form.js', 'utf8');
  const replacementMatch = code.match(/const replacement = `([\s\S]+?)`;\n\nconst newContent/);
  if (replacementMatch && replacementMatch[1]) {
    const replacement = replacementMatch[1];
    const newContent = content.substring(0, startIdx) + replacement + '\n\n// ── Product Card ────────────────────────────────────' + content.substring(endIdx + endOfModal.length);
    fs.writeFileSync(path, newContent);
    console.log('Successfully replaced OrderFormModal');
  } else {
    console.log('regex extract failed');
  }
} else {
  console.log('Failed to find boundaries');
}
