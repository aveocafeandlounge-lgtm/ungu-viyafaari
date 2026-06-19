#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as adminNS from 'firebase-admin';
const admin = adminNS.default || adminNS;
import fs from 'fs';

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1];
}

const fromUid = getArg('--fromUid');
const toUid = getArg('--toUid');
const fromEmail = getArg('--fromEmail');
const toEmail = getArg('--toEmail');
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');

if (!fromUid && !fromEmail) {
  console.error('Provide --fromUid <UID> or --fromEmail <email>');
  process.exit(1);
}
if (!toUid && !toEmail) {
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

const from = await resolveUid({ uid: fromUid, email: fromEmail });
const to = await resolveUid({ uid: toUid, email: toEmail });

if (!from || !to) {
  console.error('Could not resolve UIDs from provided inputs.');
  process.exit(1);
}

console.log(`Migrating owner from ${from} -> ${to}`);
if (dryRun) console.log('Running in dry-run mode: no documents will be updated.');

const collections = [
  'products','purchases','recipes','batches','sales','shops','collections','money','reports','visitors'
];

for (const col of collections) {
    try {
      const snap = await db.collection(col).where('owner', '==', from).get();
      console.log(`Collection ${col}: found ${snap.size} documents to migrate`);
      let i = 0;
      for (const doc of snap.docs) {
        if (!dryRun) {
          await doc.ref.update({ owner: to });
        }
        i++;
        if (i % 200 === 0) console.log(`  processed ${i} docs in ${col}`);
      }
      console.log(`  processed ${i} docs in ${col}`);
    } catch (err) {
      console.error(`Error migrating collection ${col}:`, err.message || err);
    }
}

console.log('Migration complete.');
