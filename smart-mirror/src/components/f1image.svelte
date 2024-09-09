<script>
    import Flickrimage from "./flickrimage.svelte";
    import { onMount } from "svelte";

    let imageData = {}
    let isLoading = true;
    
    var key = "46b47db904ecbe09bbb0c12ce935f1d6"
    var secret = "de2b10ddf0461457"

    onMount(() => {
        getImage()
        setInterval(() => {
            getImage()
        }, 3600 * 1000)
    })
  
    async function getImage() {
        console.log("Fetching image data");
        isLoading = true;
        try {
            const res = await fetch(`https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${key}&tags=formula1&format=json&nojsoncallback=1`);
            const data = await res.json();

            const randomIndex = Math.floor(Math.random() * data.photos.photo.length);
            imageData = data.photos.photo[randomIndex];
            console.log("Image data fetched:", imageData);
        } catch (error) {
            console.error("Error fetching image:", error);
        } finally {
            isLoading = false;
        }
    }
  </script>
  
  <main>
    {#if isLoading}
      <p>Loading...</p>
    {:else if imageData.farm && imageData.id && imageData.server}
      <Flickrimage farm={imageData.farm} id={imageData.id} secret={imageData.secret} server={imageData.server} />
      <!-- <p>{imageData.title}</p> -->
    {:else}
      <p>No image data available</p>
    {/if}
  </main>
  
  <style>
    main {
      position: fixed;
      bottom: 250px;
      width: 100%;
    }
    p {
        padding: 20px;
        font-size: 30px;
        margin-bottom: 0px;
        padding-bottom: 0px;
    }
  </style>