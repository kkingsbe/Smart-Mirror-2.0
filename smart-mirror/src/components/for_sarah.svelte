<script>
    var pictures = []
    var pictureDelay = 10000
    var sarah_picture
    var i = 0

    async function getPictures() {
        try {
            const response = await fetch('https://smart-mirror-admin.vercel.app/api/images/public/list');
            const data = await response.json();
            
            if (data.success) {
                pictures = data.urls.map(url => ({url}));
            } else {
                throw new Error('Failed to fetch images');
            }
        } catch (err) {
            console.error("Error fetching pictures:", err);
        }
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
        transform: rotate(0deg);
        image-orientation: none;
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
</style>