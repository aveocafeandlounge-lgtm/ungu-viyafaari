#!/usr/bin/env node
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path.');
  process.exit(1);
}

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(saJson),
});

const db = admin.firestore();
const outDir = path.resolve(process.cwd(), 'exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const collections = process.argv.slice(2).length ? process.argv.slice(2) : [
  'products','purchases','recipes','batches','sales','shops','collections','money','reports','visitors','users'
];

async function exportCollection(col) {
  try {
    const snap = await db.collection(col).get();
    const data = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    const outPath = path.join(outDir, `${col}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`Exported ${data.length} docs from ${col} -> ${outPath}`);
  } catch (err) {
    console.error(`Error exporting ${col}:`, err.message || err);
  }
}

(async () => {
  for (const col of collections) {
    await exportCollection(col);
  }
  console.log('Export complete.');
})();
