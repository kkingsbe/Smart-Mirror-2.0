<script>
    import YouTube from 'svelte-youtube'
    const options = {
        height: '450',
        width: '900',
        playerVars: {
            autoplay: 1
        }
    }
</script>

<main>
    <YouTube videoId="Ky5l9ZxsG9M" {options}/>
</main>

<style>
main {
    position: fixed;
    bottom: 300px;
    width: 100%;
}
</style>