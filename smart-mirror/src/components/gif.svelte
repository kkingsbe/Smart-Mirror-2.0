<script>
  var gifUrl = ""
  let currentGif = 0
  var gifs = []

  var key = "FfNb2v3UdXMKkBCRo0qI9svvQxqCpmfb"

  start()

  async function start() {
    await fetchGifs()
    nextGif()
  }


  //Get a new set of gifs every 24h
  setInterval(() => {
    fetchGifs()
  }, 86400000)

  //Set a new gif every 1min
  setInterval(() => {
    nextGif()
  }, 60000)

  async function fetchGifs() {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open("GET", `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=144`)
      xhr.send()

      xhr.onload = function() {
        if(xhr.status != 200) alert(`Error ${xhr.status}: ${xhr.statusText}`)
        else {
            let data = JSON.parse(xhr.response)
            console.log(data)
            gifs = data.data
            resolve()
        }
      }
    }) 
  }

  function nextGif() {
    currentGif == 143 ? currentGif = 0 : currentGif ++
    gifUrl = gifs[currentGif].images.original.url
  }
</script>

<main>
  <img src={gifUrl}>
  <!--img src="https://media.giphy.com/media/l4pTfBQTLOecArqSs/giphy.gif"-->
</main>

<style>
  main {
    position: fixed;
    bottom: 300px;
    width: 100%;
  }
  img {
    width: 50%;
  }
</style>