// ═══ Auth 상태 관리 — Svelte 5 runes 기반 ═══
// 컴포넌트 어디서든 $auth.user 같은 식으로 접근

import {
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	type User
} from 'firebase/auth';
import { ALLOWED_EMAIL, getFirebase } from '../firebase';

type AuthState = {
	user: User | null;
	loading: boolean;
	denied: boolean; // 허용된 이메일 아닐 때
};

function createAuthStore() {
	const state = $state<AuthState>({
		user: null,
		loading: true,
		denied: false
	});

	let initialized = false;
	function init() {
		if (initialized) return;
		if (typeof window === 'undefined') return;
		initialized = true;

		const { auth } = getFirebase();
		onAuthStateChanged(auth, (u) => {
			if (u && u.email !== ALLOWED_EMAIL) {
				state.denied = true;
				state.user = null;
				signOut(auth);
			} else {
				state.user = u;
				state.denied = false;
			}
			state.loading = false;
		});
	}

	async function login() {
		const { auth } = getFirebase();
		const provider = new GoogleAuthProvider();
		await signInWithPopup(auth, provider);
	}

	async function logout() {
		const { auth } = getFirebase();
		await signOut(auth);
	}

	return {
		get user() { return state.user; },
		get loading() { return state.loading; },
		get denied() { return state.denied; },
		init,
		login,
		logout
	};
}

export const auth = createAuthStore();
