<script>
    //Update every 3 mins
    var svgName = ""
    var temp
    var low
    var high
    var weatherCat
    var weatherText
    function getWeather() {
        var key = "508e30d810aea35edea2114e557bca90"
        let xhr = new XMLHttpRequest()
        xhr.open("GET", `https://api.openweathermap.org/data/2.5/weather?zip=32114&APPID=${key}`)
        xhr.send()

        xhr.onload = function() {
            if(xhr.status != 200) alert(`Error ${xhr.status}: ${xhr.statusText}`)
            else {
                let data = JSON.parse(xhr.response)
                console.log(data)
                low = data.main.temp_min
                high = data.main.temp_max
                temp = data.main.temp
                weatherCat = data.weather[0].main
                weatherText = data.weather[0].description
            }
        }
    }

    getWeather()
    setInterval(() => {
        getWeather()
    }, 180000)
</script>

<main>
    <p>{weatherText}</p>
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
        width: 150px;
        height: auto;
    }
    p {
        margin: 0;
        margin-right: 20px;
        font-weight: 100;
        font-size: 3em;
    }
</style>