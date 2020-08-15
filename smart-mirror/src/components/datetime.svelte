<script>
    var hour;
    var minute;
    var date = new Date()
    var dateText;
    setInterval(() => {
        date = new Date()
        dateText = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`
        hour = date.getHours() < 10 ? "0" + date.getHours().toString() : date.getHours()
        minute = date.getMinutes() < 10 ? "0" + date.getMinutes().toString() : date.getMinutes()
    }, 100)
</script>

<main>
    <div class="time">
        <h1 id="time">{hour}:{minute}</h1>
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
        margin-left: 20px;
        font-weight: 100;
    }
    .date {
        font-size: 2em;
        margin-left: 20px;
        font-weight: 100;
    }
</style>