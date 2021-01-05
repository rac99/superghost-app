const cookies = require("../helpers/cookies"); // own helper
const db = require("../helpers/db");

// iterates through all the active games and check to see if they should be closed
setTimeout(() => {
  // TODO
}, 1000 * 60);

// returns whether the client connected to the socket is the admin of the game room
function verifyAdmin(socket, code) {
  let SID = cookies.getSession(socket).SID;
  let adminId = db.getGameByCode(code).admin_id;
  return SID == adminId;
}

// from the database, get a list of player names for the game
async function getPlayerNames(player_info) {
  try {
    let names = [];
    // console.log(player_info)
    for (player in player_info) {
      names.push(player_info[player].name);
    }
    console.log("names: " + names);
    return names;
  } catch (error) {
    console.error("Could not get game info. " + error)
  }
}

module.exports = {
  verifyAdmin: verifyAdmin,
  getPlayerNames: getPlayerNames
}