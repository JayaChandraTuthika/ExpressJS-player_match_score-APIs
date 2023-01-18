const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server Running at http://localhost:3005/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1: GET ALL THE PLAYERS IN THE PLAYER TABLE
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
            SELECT 
                player_id as playerId,
                player_name as playerName
            FROM player_details
            ORDER BY player_id;`;
  const dbResponse = await db.all(getPlayersQuery);
  response.send(dbResponse);
});

//API 2: GET PLAYER DETAILS BY PLAYER ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `
            SELECT player_id as playerId,
                player_name as playerName
            FROM player_details
            WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerDetailsQuery);
  response.send(dbResponse);
});

//API 3: UPDATE PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
            UPDATE player_details
            SET 
                player_name = '${playerName}'
            WHERE player_id = ${playerId};`;
  const dbResponse = await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4: GET MATCH DETAILS BY ID
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
            SELECT match_id as matchId,match,year
             FROM match_details
            WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchDetailsQuery);
  response.send(dbResponse);
});

//API 5: GET MATCHES PLAYED BY PLAYER
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchByPlayerQuery = `
            SELECT  
                match_details.match_id as matchId,
                match,year
            FROM player_match_score join match_details 
                    on match_details.match_id = player_match_score.match_id
            WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(getMatchByPlayerQuery);
  response.send(dbResponse);
});

//API 6: LIST OF PLAYERS IN MATCH
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersInMatchQuery = `
            SELECT 
                player_details.player_id as playerId,
                player_details.player_name as playerName
                FROM player_match_score join player_details
                    on player_match_score.player_id = player_details.player_id
                WHERE match_id = ${matchId};
                `;
  const dbResponse = await db.all(getPlayersInMatchQuery);
  response.send(dbResponse);
});

//API 7: STATISTICS OF PLAYERS
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
            SELECT 
                player_details.player_id as playerId,
                player_details.player_name as playerName,
                SUM(score) as totalScore,
                SUM(fours) as totalFours,
                SUM(sixes) as totalSixes
            FROM player_details LEFT JOIN player_match_score
                 ON player_details.player_id = player_match_score.player_id
            GROUP BY player_details.player_id
            HAVING player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(getStatisticsQuery);
  response.send(dbResponse);
});

module.exports = app;
