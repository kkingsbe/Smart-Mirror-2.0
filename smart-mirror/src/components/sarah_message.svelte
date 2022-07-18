<script>
    var message = ""
    var refreshInterval = 15000
    setInterval(() => {
        fetch("https://yz38okcnw1.execute-api.us-east-1.amazonaws.com/sarah-message")
        .then(response => response.json())
        .then(data => {
            message = data
        });
    }, refreshInterval)
</script>

<main>
    <p>{message}</p>
</main>

<style>
  main {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
  p {
    font-weight: 100;
    font-size: 4em;
  }
</style>