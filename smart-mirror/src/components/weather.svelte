<script>
    //Update every 3 mins
    var key = "0317ffd1456543c49ceb250d10eeb740"
    var svgName = ""
    setInterval(() => {
        fetch(`https://cors-anywhere.herokuapp.com/https://api.weatherbit.io/v2.0/current?city=Raleigh,NC&key=${key}`)
            .then(response => {
                console.log(response)
                return JSON.parse(response)
            })
            .then(data => {
                console.log(data)
            })
    }, 5000)
</script>

<main>
    <img src="svg/wi-barometer.svg">
</main>

<style>
    main {
        position: fixed;
        right: 0;
        top: 0;
    }
    img {
        filter: invert(100%);
        width: 250px;
        height: auto;
    }
</style>