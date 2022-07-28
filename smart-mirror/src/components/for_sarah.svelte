<script>
    //version = aws-sdk-2.985.0.min.js
    
    var pictures = []
    var pictureDelay = 10000
    var sarah_picture
    var i = 0

    async function getPictures() {
        await fetch("https://6qc2nozhc5vswl4vv4tqhlrklm0mvhuc.lambda-url.us-east-1.on.aws/?id=1")
        .then(res => res.json())
        .then(data => pictures = data)
    }

    async function init() {
        await getPictures()
        sarah_picture = pictures[i].url
        setInterval(getPictures, 10000)
    }

    setInterval(() => {
        if(i > pictures.length-1) i = 0
        sarah_picture = pictures[i].url
        i++
    }, pictureDelay);

    init()
</script>

<main>
    <img src={sarah_picture}>
</main>

<style>
    main {
      position: fixed;
      bottom: 250px;
      width: 100%;
    }
    img {
        max-width: 70vw;
        max-height: 50vh;
        image-orientation: from-image;
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
</style>