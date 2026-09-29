const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
const allowAll = `
    match /{document=**} {
      allow read: if true;
    }
`;
// Insert right after match /databases/{database}/documents {
rules = rules.replace('match /databases/{database}/documents {', 'match /databases/{database}/documents {' + allowAll);
fs.writeFileSync('firestore.rules.test', rules);
