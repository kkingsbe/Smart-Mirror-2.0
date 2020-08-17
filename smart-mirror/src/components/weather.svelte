<script>
    //Update every 3 mins
    var svgName = ""
    var temp
    var low
    var high
    var weatherCat
    var weatherText
    var iconUrl

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
                low = Math.ceil(data.main.temp_min * 9/5 - 459.67)
                high = Math.ceil(data.main.temp_max * 9/5 - 459.67)
                temp = Math.ceil(data.main.temp * 9/5 - 459.67)
                weatherCat = data.weather[0].main
                weatherText = titleCase(data.weather[0].description)
                iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`
            }
        }
    }

    getWeather()
    setInterval(() => {
        getWeather()
    }, 180000)

    function titleCase(str) {
        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            // You do not need to check if i is larger than splitStr length, as your for does that for you
            // Assign it back to the array
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        // Directly return the joined string
        return splitStr.join(' '); 
    }
</script>

<main>
    <p>{weatherText}</p>
    <img src={iconUrl}>
    <p>Currently: {temp}°F</p>
    <div class="tempMinMax">
        <p>Low: {low}°</p>
        <p>High: {high}°</p>
    </div>
</main>

<style>
    main {
        position: fixed;
        right: 0;
        top: 0;
        margin-top: 35px;
    }
    img {
        width: 250px;
        height: auto;
    }
    p {
        margin: 0;
        margin-right: 40px;
        font-weight: 100;
        font-size: 3em;
    }
    .tempMinMax {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }
    .tempMinMax p{
        font-size: 2em;
    }
</style>