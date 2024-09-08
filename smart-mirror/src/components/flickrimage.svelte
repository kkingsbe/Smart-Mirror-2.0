<script lang="ts">
    export let farm;
    export let server;
    export let id;
    export let secret;
    export let size = 'l'; // Default size is medium

    $: imageUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}.jpg`;
</script>

{#if imageUrl}
    <img src={imageUrl} alt="Flickr image" />
{:else}
    <p>No image data available</p>
{/if}

<style>
img {
    max-width: 100%;
    height: auto;
}
</style>