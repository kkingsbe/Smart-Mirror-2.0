<script>
  var greetingText = "";
  var date = new Date()
  setInterval(() => {
    date = new Date()
    let hour = date.getHours()
    console.log(hour)

    if(hour >= 5 && hour < 12) {
      greetingText = "Good Morning :)"
    } else if(hour >=12 && hour < 18) {
      greetingText = "Good Afternoon :)"
    } else if(hour >= 18 || hour < 5) {
      greetingText = "Good Night :)"
    }
  }, 1000)
  
</script>

<main>
  <p>{greetingText}</p>
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