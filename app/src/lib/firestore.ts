// ═══ Firestore 헬퍼 — 기존 main의 fbRead/fbAdd 패턴 단순화 ═══
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	type DocumentData
} from 'firebase/firestore';
import { getFirebase } from './firebase';

export async function fbReadDoc<T = DocumentData>(path: string): Promise<T | null> {
	const { db } = getFirebase();
	const ref = doc(db, path);
	const snap = await getDoc(ref);
	return snap.exists() ? (snap.data() as T) : null;
}

export async function fbReadCollection<T = DocumentData>(
	path: string
): Promise<(T & { id: string })[]> {
	const { db } = getFirebase();
	const ref = collection(db, path);
	const snap = await getDocs(ref);
	return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

// 문서 전체 덮어쓰기 (없으면 생성)
export async function fbSetDoc<T extends DocumentData>(path: string, data: T): Promise<void> {
	const { db } = getFirebase();
	const ref = doc(db, path);
	await setDoc(ref, data);
}

// 문서 부분 업데이트 (merge: true)
export async function fbMergeDoc(path: string, data: Partial<DocumentData>): Promise<void> {
	const { db } = getFirebase();
	const ref = doc(db, path);
	await setDoc(ref, data, { merge: true });
}

// 컬렉션에 새 문서 추가
export async function fbAddDoc<T extends DocumentData>(
	collectionPath: string,
	data: T
): Promise<string> {
	const { db } = getFirebase();
	const ref = collection(db, collectionPath);
	const docRef = await addDoc(ref, data);
	return docRef.id;
}

// 문서 업데이트 (필드만 변경)
export async function fbUpdateDoc(path: string, data: Partial<DocumentData>): Promise<void> {
	const { db } = getFirebase();
	const ref = doc(db, path);
	await updateDoc(ref, data);
}

// 문서 삭제
export async function fbDeleteDoc(path: string): Promise<void> {
	const { db } = getFirebase();
	const ref = doc(db, path);
	await deleteDoc(ref);
}
