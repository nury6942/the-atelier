// ═══ Firestore 헬퍼 — 기존 main의 fbRead/fbAdd 패턴 단순화 ═══
import {
	collection,
	doc,
	getDoc,
	getDocs,
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
