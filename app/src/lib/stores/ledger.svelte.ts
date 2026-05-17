// Daily Ledger 데이터 스토어 — Svelte 5 runes
// Firebase appSettings/ledgerData 단일 문서에서 모든 가계부 데이터 관리

import { fbReadDoc } from '../firestore';
import { todayKey } from '../utils/greeting';

export type Tx = {
	id: string;
	date: string;
	대분류: string;
	소분류?: string;
	금액: number;
	결제수단?: string;
	세부사항?: string;
	비고?: string;
	excludeFromGoal?: boolean;
};

export type LedgerSettings = {
	year?: number;
	paymentMethods?: string[];
	disabledPayments?: string[];
};

export type LedgerData = {
	settings?: LedgerSettings;
	categories?: Record<string, string[]>;
	budgets?: Record<string, { default?: number; overrides?: Record<string, number> }>;
	transactions?: Tx[];
	recurring?: any[];
	assets?: Record<string, any>;
	checklist?: Array<{ text: string; done: boolean }>;
};

function createLedgerStore() {
	const state = $state<{
		data: LedgerData;
		loading: boolean;
		error: string;
		year: number;
		month: number; // 1-12
	}>({
		data: {},
		loading: true,
		error: '',
		year: new Date().getFullYear(),
		month: new Date().getMonth() + 1
	});

	async function load() {
		state.loading = true;
		state.error = '';
		try {
			const data = await fbReadDoc<LedgerData>('appSettings/ledgerData');
			state.data = data || {};
		} catch (e: any) {
			state.error = e?.message || '로드 실패';
		} finally {
			state.loading = false;
		}
	}

	function setMonth(year: number, month: number) {
		state.year = year;
		state.month = month;
	}

	function getMonthKey() {
		return `${state.year}-${String(state.month).padStart(2, '0')}`;
	}

	function getMonthTx() {
		const key = getMonthKey();
		return (state.data.transactions || []).filter(
			(t) => t.date && t.date.substring(0, 7) === key
		);
	}

	function isExpense(t: Tx): boolean {
		return t.대분류 !== '수입' && t.대분류 !== '저축';
	}

	function getMonthStats() {
		const txs = getMonthTx();
		let income = 0;
		let expense = 0;
		let saving = 0;
		for (const t of txs) {
			const amt = t.금액 || 0;
			if (t.대분류 === '수입') income += amt;
			else if (t.대분류 === '저축') saving += amt;
			else expense += amt;
		}
		return { income, expense, saving, net: income - expense - saving, txCount: txs.length };
	}

	return {
		get data() { return state.data; },
		get loading() { return state.loading; },
		get error() { return state.error; },
		get year() { return state.year; },
		get month() { return state.month; },
		get monthKey() { return getMonthKey(); },
		load,
		setMonth,
		getMonthTx,
		isExpense,
		getMonthStats
	};
}

export const ledger = createLedgerStore();
