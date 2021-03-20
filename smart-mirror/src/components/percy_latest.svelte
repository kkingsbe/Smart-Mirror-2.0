<script>
    var apodURL = ""
    var explanation = ""
  
    //var key = "YstqtcBfGeXxB0hDruEe7qKbqaJg9dvo4Hdjer84"
    var key = "DEMO_KEY"
    var photoArr = []
  
    start()
  
    async function start() {
      //await getLatest()
      await getMastcam()
    }
  
  
    //Check for the new Astronomy Picture of the Day every hour
    setInterval(() => {
      getLatest()
    }, 3600 * 1000)

    async function getMastcam() {
      var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
      if(month.length < 2)
        month = '0' + month;
      if(day.length < 2)
        day = '0' + day;
      let date = [year, month, day].join('-')
      console.log(date)
      
      while (photoArr.length == 0) {
        await getLatest(date)
        d.setDate(d.getDate() - 1)
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
        if(month.length < 2)
          month = '0' + month;
        if(day.length < 2)
          day = '0' + day;
        let date = [year, month, day].join('-')
        console.log(date)
      }
    }
  
    async function getLatest(date) { //Date: year yyyy-mm-dd
      return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?api_key=${key}&earth_date=2021-03-18&camera=MCZ_RIGHT&camera=MCZ_LEFT`)
        xhr.send()
  
        xhr.onload = function() {
          if(xhr.status != 200) alert(`Error ${xhr.status}: ${xhr.statusText}`)
          else {
              let content = JSON.parse(xhr.response)
              let photos = content.photos
              
              photoArr = []
              for(let i in photos) {
                photoArr.push(photos[i].img_src)
              }
              console.log(photoArr)
          }
        }
      }) 
    }
  </script>
  
  <main>
    <img src={photoArr[0]}>
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