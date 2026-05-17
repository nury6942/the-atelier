<script lang="ts">
	import { ledger, type Tx } from '$lib/stores/ledger.svelte';
	import { todayKey } from '$lib/utils/greeting';

	let {
		open = $bindable(false),
		tx = $bindable<Tx | null>(null),
		onSaved
	}: {
		open?: boolean;
		tx?: Tx | null;
		onSaved?: () => void;
	} = $props();

	let date = $state('');
	let major = $state('');
	let minor = $state('');
	let amount = $state('');
	let payment = $state('');
	let detail = $state('');
	let note = $state('');
	let saving = $state(false);
	let error = $state('');

	const categories = $derived(ledger.getCategories());
	const paymentMethods = $derived(ledger.getPaymentMethods());
	const minorOpts = $derived(major ? categories[major] || [] : []);

	const isEdit = $derived(!!tx?.id);

	$effect(() => {
		if (!open) return;
		if (tx) {
			date = tx.date || todayKey();
			major = tx.대분류 || '';
			minor = tx.소분류 || '';
			amount = tx.금액 ? tx.금액.toLocaleString('ko-KR') : '';
			payment = tx.결제수단 || '';
			detail = tx.세부사항 || '';
			note = tx.비고 || '';
		} else {
			date = todayKey();
			major = '';
			minor = '';
			amount = '';
			payment = '';
			detail = '';
			note = '';
		}
		error = '';
	});

	function formatAmount(e: Event) {
		const target = e.target as HTMLInputElement;
		const raw = target.value.replace(/[^0-9]/g, '');
		amount = raw ? parseInt(raw).toLocaleString('ko-KR') : '';
	}

	async function save() {
		const amt = parseInt(amount.replace(/,/g, '')) || 0;
		if (!date) {
			error = '날짜를 입력하세요';
			return;
		}
		if (!major) {
			error = '대분류를 선택하세요';
			return;
		}
		if (amt <= 0) {
			error = '금액을 입력하세요';
			return;
		}

		saving = true;
		error = '';
		try {
			const newTx: Tx = {
				id: tx?.id || '',
				date,
				대분류: major,
				소분류: minor,
				금액: amt,
				결제수단: payment,
				세부사항: detail,
				비고: note
			};
			await ledger.saveTx(newTx);
			open = false;
			onSaved?.();
		} catch (e: any) {
			error = e?.message || '저장 실패';
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!tx?.id) return;
		if (!confirm('이 거래를 삭제할까요? 되돌릴 수 없어요.')) return;
		saving = true;
		try {
			await ledger.deleteTx(tx.id);
			open = false;
			onSaved?.();
		} catch (e: any) {
			error = e?.message || '삭제 실패';
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		onclick={() => (open = false)}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<div
			class="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<!-- 헤더 -->
			<div class="p-5 border-b border-slate-100 flex items-center justify-between">
				<h3 class="text-lg font-bold headline">
					{isEdit ? '거래 편집' : '거래 추가'}
				</h3>
				<button
					onclick={() => (open = false)}
					class="text-slate-400 hover:text-slate-700"
					aria-label="닫기"
				>
					✕
				</button>
			</div>

			<!-- 본문 -->
			<div class="p-5 space-y-3">
				<!-- 날짜 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">날짜 *</label>
					<input
						type="date"
						bind:value={date}
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
					/>
				</div>

				<!-- 대분류 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">대분류 *</label>
					<select
						bind:value={major}
						onchange={() => (minor = '')}
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
					>
						<option value="">선택</option>
						{#each Object.keys(categories) as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>

				<!-- 소분류 -->
				{#if major && minorOpts.length > 0}
					<div>
						<label class="block text-xs font-bold text-slate-600 mb-1.5">소분류</label>
						<select
							bind:value={minor}
							class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
						>
							<option value="">선택</option>
							{#each minorOpts as sub}
								<option value={sub}>{sub}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- 금액 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">금액 (원) *</label>
					<input
						type="text"
						inputmode="numeric"
						bind:value={amount}
						oninput={formatAmount}
						placeholder="0"
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-right outline-none focus:ring-2 focus:ring-violet-400"
					/>
				</div>

				<!-- 결제수단 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">결제수단</label>
					<select
						bind:value={payment}
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
					>
						<option value="">선택</option>
						{#each paymentMethods as pm}
							<option value={pm}>{pm}</option>
						{/each}
					</select>
				</div>

				<!-- 세부사항 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">세부사항</label>
					<input
						type="text"
						bind:value={detail}
						placeholder="예: 점심, 카페, 영화관"
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
					/>
				</div>

				<!-- 비고 -->
				<div>
					<label class="block text-xs font-bold text-slate-600 mb-1.5">비고</label>
					<input
						type="text"
						bind:value={note}
						placeholder="추가 메모"
						class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
					/>
				</div>

				{#if error}
					<div class="bg-rose-50 text-rose-700 rounded-xl p-3 text-xs">
						⚠️ {error}
					</div>
				{/if}
			</div>

			<!-- 푸터 -->
			<div class="p-5 border-t border-slate-100 flex items-center gap-2">
				{#if isEdit}
					<button
						onclick={remove}
						disabled={saving}
						class="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
					>
						🗑 삭제
					</button>
				{/if}
				<div class="flex-1"></div>
				<button
					onclick={() => (open = false)}
					disabled={saving}
					class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
				>
					취소
				</button>
				<button
					onclick={save}
					disabled={saving}
					class="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
				>
					{saving ? '저장 중...' : '저장'}
				</button>
			</div>
		</div>
	</div>
{/if}
