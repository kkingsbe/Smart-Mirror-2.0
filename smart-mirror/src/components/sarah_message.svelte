<script>
    var message = ""
    var refreshInterval = 15000

    async function getMessage() {
      const response = await fetch("https://yz38okcnw1.execute-api.us-east-1.amazonaws.com/sarah-message")
      const data = await response.json()
      message = data
    }

    setInterval(getMessage, refreshInterval)
    getMessage()
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