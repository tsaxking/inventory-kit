<script lang="ts">
	interface Props {
		value?: string;
		placeholder: string;
		onInput?: (value: string) => void;
		onChange?: (value: string) => void;
		name: string;
		floatingLabel?: boolean;
		label?: string;
		buttonColor?:
			| 'primary'
			| 'secondary'
			| 'success'
			| 'danger'
			| 'warning'
			| 'info'
			| 'light'
			| 'dark'
			| 'link';
	}

	let {
		value = $bindable(),
		placeholder,
		onInput,
		onChange,
		name,
		floatingLabel,
		label,
		buttonColor
	}: Props = $props();

	let type: 'text' | 'password' = $state('password');

	const toggle = () => {
		type = type === 'text' ? 'password' : 'text';
		input.focus();
	};

	let input: HTMLInputElement;
</script>

{#snippet password()}
	<input
		bind:this={input}
		{type}
		{placeholder}
		bind:value
		{name}
		class="form-control"
		oninput={(e) => onInput?.(e.currentTarget.value)}
		onchange={(e) => onChange?.(e.currentTarget.value)}
	/>
{/snippet}

<div class="input-group mb-3">
	{#if label}
		{#if floatingLabel}
			<div class="form-floating">
				{@render password()}
				<label for={name}>
					{label}
				</label>
			</div>
		{:else}
			{@render password()}
			<label for={name}>
				{label}
			</label>
		{/if}
	{:else}
		{@render password()}
	{/if}
	<button onclick={toggle} type="button" class="btn btn-{buttonColor ?? 'secondary'}">
		<i class="material-icons cursor-pointer mx-auto">
			{type === 'text' ? 'visibility' : 'visibility_off'}
		</i>
	</button>
</div>
