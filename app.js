const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

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

const player_DbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const match_DbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API-1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await database.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      player_DbObjectToResponseObject(eachPlayer)
    )
  );
});

//API-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * 
    FROM player_details
      WHERE
    player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(player_DbObjectToResponseObject(player));
});

//API-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
     player_details
    SET 
     player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API-4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT
      *
    FROM 
      match_details
    WHERE 
      match_id = ${matchId};`;
  const matchDetails = await database.get(matchDetailsQuery);
  response.send(match_DbObjectToResponseObject(matchDetails));
});

//API-5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
     SELECT
      *
    FROM player_match_score
    NATURAL_JOIN match_details
    WHERE 
    player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => match_DbObjectToResponseObject(eachMatch))
  );
});

//API-6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT 
	    *
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      player_DbObjectToResponseObject(eachPlayer)
    )
  );
});

//API-7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT 
     player_id AS playerId,
     player_name AS playerName,
     SUM(score) AS totalScore,
     SUM(fours)  AS totalFours,
     SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details

    WHERE player_id = ${playerId};`;

  const playerMatchDetails = await database.get(getMatchPlayersQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
