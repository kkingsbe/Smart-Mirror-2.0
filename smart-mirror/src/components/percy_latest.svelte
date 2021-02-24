<script>
    var apodURL = ""
    var explanation = ""
  
    var key = "YstqtcBfGeXxB0hDruEe7qKbqaJg9dvo4Hdjer84"
  
    start()
  
    async function start() {
      await getAPOD()
    }
  
  
    //Check for the new Astronomy Picture of the Day every hour
    setInterval(() => {
      getAPOD()
    }, 3600 * 1000)
  
    async function getAPOD() {
      return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", `https://mars.nasa.gov/mars2020/multimedia/raw-images/#raw-images`)
        xhr.send()
  
        xhr.onload = function() {
          if(xhr.status != 200) alert(`Error ${xhr.status}: ${xhr.statusText}`)
          else {
              console.log(xhr.response)
              let el = document.createElement('html')
              el.innerHTML = xhr.response
              console.log(el)
              resolve()
          }
        }
      }) 
    }
  </script>
  
  <main>
    <img src={apodURL}>
    <p>{explanation}</p>
  </main>
  
  <style>
    main {
      position: fixed;
      bottom: 250px;
      width: 100%;
    }
    img {
      width: 50%;
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
  </style>