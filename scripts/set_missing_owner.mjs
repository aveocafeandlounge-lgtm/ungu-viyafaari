#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1];
}

const toUidArg = getArg('--toUid');
const toEmailArg = getArg('--toEmail');
const apply = process.argv.includes('--apply');

if (!toUidArg && !toEmailArg) {
  console.error('Provide --toUid <UID> or --toEmail <email>');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path.');
  process.exit(1);
}

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
initializeApp({
  credential: cert(saJson),
});

const auth = getAuth();
const db = getFirestore();

async function resolveUid({ uid, email }) {
  if (uid) return uid;
  if (email) {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  }
  return null;
}

(async () => {
  const toUid = await resolveUid({ uid: toUidArg, email: toEmailArg });
  if (!toUid) {
    console.error('Could not resolve target UID.');
    process.exit(1);
  }
  console.log(`Setting missing owner fields to UID ${toUid} (${toEmailArg || toUidArg})`);
  if (!apply) console.log('Dry-run mode (no writes). Use --apply to perform updates.');

  const collections = [
    'products','purchases','recipes','batches','sales','shops','collections','money','reports','visitors','users'
  ];

  for (const col of collections) {
    try {
      const snap = await db.collection(col).get();
      let toUpdate = [];
      for (const doc of snap.docs) {
        const data = doc.data() || {};
        if (data.owner === undefined || data.owner === null || data.owner === '') {
          toUpdate.push(doc.ref);
        }
      }
      console.log(`Collection ${col}: ${toUpdate.length} documents missing owner`);
      let i = 0;
      for (const ref of toUpdate) {
        if (apply) await ref.update({ owner: toUid });
        i++;
        if (i % 200 === 0) console.log(`  processed ${i} docs in ${col}`);
      }
      console.log(`  processed ${i} docs in ${col}`);
    } catch (err) {
      console.error(`Error processing ${col}:`, err.message || err);
    }
  }

  console.log('Done.');
})();
