<script>
    var price = 0
    async function getPrice() {
        return new Promise((resolve, reject) => {
            fetch("https://cors-anywhere.herokuapp.com/https://api.coindesk.com/v1/bpi/currentprice.json")
                .then(res => {
                    return res.json()
                })
                .then(json => {
                    let price = parseInt(json.bpi.USD.rate.replace(",",""))
                    console.log(price)
                    resolve(price)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    async function main() {
        price = await getPrice()
    }

    main()

    setInterval(main, 60000)
</script>

<main>
    <p>BTC: ${price.toLocaleString()}</p>
</main>

<style>
    main {
        position: fixed;
        left: 0;
        top: 0;
        margin-top: 375px;
        margin-left: 15px;
    }
    p {
        font-size: 3em;
    }
</style>