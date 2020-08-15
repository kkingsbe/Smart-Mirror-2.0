<script>
	export let name;
	import Datetime from "./components/datetime.svelte"
	import Weather from "./components/weather.svelte"
	import Message from "./components/message.svelte"
</script>

<main>
	<Datetime></Datetime>
	<Weather></Weather>
	<Message></Message>
</main>

<style>
	main {
		text-align: center;
		padding: 10px;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>