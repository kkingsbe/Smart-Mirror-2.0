<script>
  import F1image from "./f1image.svelte";
  import APOD from "./apod.svelte"

  let constructorData = [
    {
      "team_name": "Red Bull Racing",
      "abbreviation": "RBR",
      "primary_color": "#1E41FF",
      points: 0,
      position: 0
    },
    {
      "team_name": "Mercedes-AMG Petronas",
      "abbreviation": "MER",
      "primary_color": "#00D2BE",
      points: 0,
      position: 0
    },
    {
      "team_name": "Scuderia Ferrari",
      "abbreviation": "FER",
      "primary_color": "#DC0000",
      points: 0,
      position: 0
    },
    {
      "team_name": "McLaren Racing",
      "abbreviation": "MCL",
      "primary_color": "#FF8700",
      points: 0,
      position: 0
    },
    {
      "team_name": "Alpine F1 Team",
      "abbreviation": "ALP",
      "primary_color": "#0090FF",
      points: 0,
      position: 0
    },
    {
      "team_name": "Aston Martin F1 Team",
      "abbreviation": "AMR",
      "primary_color": "#006F62",
      points: 0,
      position: 0
    },
    {
      "team_name": "Sauber F1 Team",
      "abbreviation": "ALF",
      "primary_color": "#900000",
      points: 0,
      position: 0
    },
    {
      "team_name": "Haas F1 Team",
      "abbreviation": "HAA",
      "primary_color": "#B6BABD",
      points: 0,
      position: 0
    },
    {
      "team_name": "Williams F1 Team",
      "abbreviation": "WIL",
      "primary_color": "#005AFF",
      points: 0,
      position: 0
    },
    {
      "team_name": "Visa Cash App RB Formula One Team",
      "abbreviation": "AT",
      "primary_color": "#2B4562",
      points: 0,
      position: 0
    }
  ]

  let mode = "image"

  setInterval(() => {
    if (mode === "table") {
      mode = "image"
    } else {
      mode = "table"
    }
  }, 60000)

  setInterval(() => {
    fetchData()
  }, 3600 * 1000)

  const myHeaders = new Headers();
  myHeaders.append("x-rapidapi-key", "9c70341bb6msh618a1b5f2fd5122p1d9bf1jsn81abf36906e5");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  async function fetchData() {
    const response = await fetch("https://api-formula-1.p.rapidapi.com/rankings/teams?season=2024", requestOptions);
    const data = (await response.json()).response;
    console.log(data);
    console.log(JSON.stringify(data))

    // const data = [{"position":1,"team":{"id":1,"name":"Red Bull Racing","logo":"https://media.api-sports.io/formula-1/teams/1.png"},"points":446,"season":2024},{"position":2,"team":{"id":2,"name":"McLaren Racing","logo":"https://media.api-sports.io/formula-1/teams/2.png"},"points":438,"season":2024},{"position":3,"team":{"id":3,"name":"Scuderia Ferrari\n","logo":"https://media.api-sports.io/formula-1/teams/3.png"},"points":407,"season":2024},{"position":4,"team":{"id":5,"name":"Mercedes-AMG Petronas","logo":"https://media.api-sports.io/formula-1/teams/5.png"},"points":292,"season":2024},{"position":5,"team":{"id":17,"name":"Aston Martin F1 Team","logo":"https://media.api-sports.io/formula-1/teams/17.png"},"points":74,"season":2024},{"position":6,"team":{"id":7,"name":"Visa Cash App RB Formula One Team","logo":"https://media.api-sports.io/formula-1/teams/7.png"},"points":34,"season":2024},{"position":7,"team":{"id":14,"name":"Haas F1 Team","logo":"https://media.api-sports.io/formula-1/teams/14.png"},"points":28,"season":2024},{"position":8,"team":{"id":13,"name":"Alpine F1 Team","logo":"https://media.api-sports.io/formula-1/teams/13.png"},"points":13,"season":2024},{"position":9,"team":{"id":12,"name":"Williams F1 Team","logo":"https://media.api-sports.io/formula-1/teams/12.png"},"points":6,"season":2024},{"position":10,"team":{"id":8,"name":"Sauber F1 Team","logo":"https://media.api-sports.io/formula-1/teams/8.png"},"points":0,"season":2024}]

    data.map((team) => {
      const teamName = team.team.name.trim();
      const constructor = constructorData.find((c) => c.team_name === teamName);
      constructor.points = team.points;
    });

    constructorData = constructorData.sort((a, b) => b.points - a.points);
    constructorData.forEach((constructor, index) => {
      constructor.position = index + 1;
    });
  }

  fetchData()

  /**
    Key:
    46b47db904ecbe09bbb0c12ce935f1d6

    Secret:
    de2b10ddf0461457
  */
</script>

{#if mode === "table"}
  <div class="constructors-main bg-black text-white min-h-screen p-8 font-sans">
    <h1 class="text-5xl font-bold text-center mb-12">
      F1 Constructors Championship
    </h1>
    <div class="constructors-table">
      {#each constructorData.slice(0,4) as constructor}
        <p>{constructor.position}</p>
        <p class="constructor-team-name">{constructor.team_name}</p>
        <p>{constructor.points}</p>
      {/each}
    </div>
  </div>
{:else}
  <APOD></APOD>
{/if}


<style>
  .constructors-main {
    position: fixed;
    bottom: 300px;
    width: 100%;
  }

  .constructors-table {
    display: grid;
    grid-template-columns: min-content auto min-content;
    width: max-content;
    gap: 20px 50px;
    margin-left: auto;
    margin-right: auto;
    font-weight: bold;
    font-size: 2.0rem;
  }

  .constructor-team-name {
    text-align: left;
  }

  .constructors-table-row {
    gap: 10px;
    font-weight: bold;
    font-size: 1.5rem;
  }

  .constructors-table-row p {
    margin: 0px;
  }

  .glow-border {
    box-shadow: 0 0 5px var(--glow-color),
                0 0 10px var(--glow-color),
                0 0 15px var(--glow-color),
                0 0 20px var(--glow-color);
    opacity: 0.8;
    pointer-events: none;
  }

  @keyframes borderPulse {
    0% { opacity: 0.8; }
    50% { opacity: 0.5; }
    100% { opacity: 0.8; }
  }

  .glow-border {
    animation: borderPulse 2s infinite;
  }
</style>