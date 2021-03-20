<script>
    var apodURL = ""
    var explanation = ""
  
    var key = "YstqtcBfGeXxB0hDruEe7qKbqaJg9dvo4Hdjer84"
    var photoArr = []
    var currentPhoto = "https://picsum.photos/seed/picsum/200/300"
    var currentPhotoIndex = 0
    var sol = 0
  
    start()
  
    async function start() {
      //await getLatest()
      await getMastcam()
    }
  
  
    //Check for a new downlink every hour
    setInterval(() => {
      getMastcam()
    }, 3600 * 1000)

    setInterval(() => {
      currentPhotoIndex ++
      if(currentPhotoIndex > photoArr.length - 1) currentPhotoIndex = 0
      currentPhoto = photoArr[currentPhotoIndex]
    }, 5000)

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
        photoArr = await getLatest(date)
        d.setDate(d.getDate() - 1)
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
        if(month.length < 2)
          month = '0' + month;
        if(day.length < 2)
          day = '0' + day;
        date = [year, month, day].join('-')
        console.log(date)
      }
      explanation = "Views from the surface of Mars, Sol " + sol
    }
  
    async function getLatest(date) { //Date: year yyyy-mm-dd
      return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.open("GET", `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?api_key=${key}&earth_date=${date}&camera=MCZ_RIGHT`)
        xhr.send()
  
        xhr.onload = function() {
          if(xhr.status != 200) alert(`Error ${xhr.status}: ${xhr.statusText}`)
          else {
              let content = JSON.parse(xhr.response)
              let photos = content.photos
              if(content.photos.length > 0) {
                sol = content.photos[0].sol
              }
              
              photoArr = []
              for(let i in photos) {
                photoArr.push(photos[i].img_src)
              }
              console.log(photoArr)
              resolve(photoArr)
          }
        }
      }) 
    }
  </script>
  
  <main>
    <img src={currentPhoto}>
    <p>{explanation}</p>
  </main>
  
  <style>
    main {
      position: fixed;
      bottom: 250px;
      width: 100%;
    }
    img {
      width: 70%;
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
  </style>