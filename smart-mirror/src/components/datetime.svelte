<script>
    var hour;
    var minute;
    var date = new Date()
    var dateText;
    setInterval(() => {
        date = new Date()
        dateText = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`
        hour = date.getHours()
        minute = date.getMinutes()
    }, 100)
</script>

<main>
    <div class="time">
        <h1 id="hour">{hour}</h1>
        <h1 id="minute">{minute}</h1>
    </div>
    <div class="date">
        <!--p>August 20th, 2020</p-->
        <p>{dateText}</p>
    </div>
</main>

<style>
    main {
        text-align: left;
        position: fixed;
        left: 0;
        top: 0;
    }
    .time {
        font-size: 3em;
    }
    .time h1 {
        margin: 0;
    }
    .date {
        font-size: 2em;
    }
</style>