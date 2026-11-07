#!/usr/bin/env node
// market.json → Firestore postypeMarket/latest (머리) + latest_0..n (JSON 문자열 조각)
//   node scripts/postype-market/publish.mjs ~/postype-market-data/2026-11-07
// 인증: 아이맥 gcloud ADC, firebase-admin 은 ai-worker 것을 빌림 (taste·public-data 와 같음)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const admin = require(path.join(here, '..', 'ai-worker', 'node_modules', 'firebase-admin'));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'the-atelier-99b8c' });
const db = admin.firestore();

const DIR = process.argv[2].replace(/^~/, os.homedir());
const text = fs.readFileSync(path.join(DIR, 'market.json'), 'utf8');
const meta = JSON.parse(text).meta;
const CHUNK = 250000; // 한글은 글자당 3바이트 → 문서 1MB 한도 아래로
const parts = [];
for (let i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));

const col = db.collection('postypeMarket');
const old = await col.doc('latest').get();
const oldParts = old.exists ? old.data().parts || 0 : 0;
for (let i = 0; i < parts.length; i++) await col.doc('latest_' + i).set({ json: parts[i], i });
await col.doc('latest').set({ parts: parts.length, bytes: Buffer.byteLength(text), from: meta.from, to: meta.to, posts: meta.posts, collectedAt: meta.collectedAt, analyzedAt: meta.analyzedAt, publishedAt: admin.firestore.FieldValue.serverTimestamp() });
for (let i = parts.length; i < oldParts; i++) await col.doc('latest_' + i).delete();
console.log(`올림: postypeMarket/latest + ${parts.length}조각 (${(Buffer.byteLength(text) / 1024).toFixed(0)}KB)`);
process.exit(0);
