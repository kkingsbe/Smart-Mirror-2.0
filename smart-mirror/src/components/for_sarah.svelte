<script>
    //version = aws-sdk-2.985.0.min.js
    var picture_names = ["IMG-0339.jpg", "IMG-0374.JPG", "IMG-0392.jpg", "IMG-0398.JPG", "IMG-0400.JPG", "IMG-9269.JPG"]
    var bucket = "https://smart-mirror-pictures.s3.amazonaws.com/"
    var i = 0
    var sarah_picture = bucket + picture_names[i]
    var pictureDelay = 10000

    setInterval(() => {
        if(i>picture_names.length-1) i = 0
        sarah_picture = bucket + picture_names[i]
        i++
    }, pictureDelay);
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
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
</style>