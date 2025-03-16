<script>
	export let name;
	import Datetime from "./components/datetime.svelte"
	import Weather from "./components/weather.svelte"
	import Gif from "./components/gif.svelte"
	import Message from "./components/message.svelte"
	import BTC from "./components/btc.svelte"
	import APOD from "./components/apod.svelte"
	import PERCY_LATEST from "./components/percy_latest.svelte"
	import Image from "./components/image.svelte"
	import ForSarah from "./components/for_sarah.svelte"
	import SarahMessage from "./components/sarah_message.svelte"
	import PercyLatest from "./components/percy_latest.svelte";
	import F1constructors from "./components/f1constructors.svelte"
  	import F1image from "./components/f1image.svelte";
	import WeatherRadar from "./components/WeatherRadar.svelte";
</script>

<main>
	<Datetime></Datetime>
	<Weather></Weather>
	<WeatherRadar></WeatherRadar>
	<ForSarah></ForSarah>
	<!-- <F1constructors></F1constructors> -->
	<SarahMessage></SarahMessage>
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