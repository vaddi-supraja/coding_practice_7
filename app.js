const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDBPlayerObjToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsToResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => {
      convertDBPlayerObjToResponse(eachPlayer);
    })
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * 
    FROM player_details
    WHERE
    player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDBPlayerObjToResponse(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE player_details
    SET 
    player_name:'${playerName}'
    WHERE player_id = ${playerId};`;
  await database.run(updatePlayer);
  response.send("Player Details Updated");
});

//API4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * 
    FROM match_details
    WHERE match_id = ${matchId};`;
  const matchDetails = await database.get(getMatchQuery);
  response.send(convertMatchDetailsToResponse(matchDetails));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT * 
    FROM match_details inner join on 
    match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const matchPlayers = await database.all(getPlayerMatches);
  response.send(
    matchPlayers.map((eachMap) => {
      convertMatchDetailsToResponse(eachMap);
    })
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchForPlayer = `
    SELECT * 
    FROM player_match_score inner join on 
    player_details on player_details.player_id = player_match_Score.player_id
    WHERE player_match_score.match_id = ${matchId};`;
  const playerRelatedMatches = await database.all(getMatchForPlayer);
  response.send(
    playerRelatedMatches.map((each) => {
      convertDBPlayerObjToResponse(each);
    })
  );
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
