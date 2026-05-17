// ═══ Firebase 초기화 — 기존 main 사이트와 동일한 프로젝트 사용 ═══
// 데이터 마이그레이션 0: Firestore/Auth/Storage 그대로

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: 'AIzaSyCdVHmS40id2qOMm6sYdHp9I4loW22lgaQ',
	authDomain: 'the-atelier-99b8c.firebaseapp.com',
	projectId: 'the-atelier-99b8c',
	storageBucket: 'the-atelier-99b8c.firebasestorage.app',
	messagingSenderId: '820580020945',
	appId: '1:820580020945:web:d8d8d284e9e21e83eccbf0'
};

// SSR 안전 — 클라이언트에서만 init
let app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;
let _storage: FirebaseStorage;

export function getFirebase() {
	if (typeof window === 'undefined') {
		throw new Error('Firebase는 클라이언트에서만 사용 가능');
	}
	if (!getApps().length) {
		app = initializeApp(firebaseConfig);
		_auth = getAuth(app);
		_db = getFirestore(app);
		_storage = getStorage(app);
	}
	return { app, auth: _auth, db: _db, storage: _storage };
}

export const ALLOWED_EMAIL = 'nury6942@gmail.com';
