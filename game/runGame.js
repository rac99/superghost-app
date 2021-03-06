const io = require("../app").io;
const db = require("../helpers/db");
const cookies = require("../helpers/cookies");
const helpers = require("./gameHelpers");
// const axios = require('axios');

// functions and listeners pertaining to the game
function runGame() {
  // updates the word in the database
  // fires the 'load word' event to update the current word for all sockets
  async function loadWord(code, letter, position) {
    try {
      response = await db.addLetter(code, letter, position);
      io.to(code).emit("load word", response);
    } catch (error) {
      console.error("Could not update word" + error);
    }
  }

  io.on("connection", function onConnect(socket) {
    /* __________GENERAL GAME SETUP LISTENERS___________ */

    // listener for when client joins a room
    socket.on("join room", async function joinRoom(code) {
      socket.join(code);
      try {
        // update socketId in database
        await db.editSocketId(code, cookies.getSession(socket), socket.id);

        // get the game info
        const {
          state,
          player_info,
          current_word,
          turn_index,
        } = await db.getGameByCode(code);

        // if game has started, update the word
        if (state == 1) {
          socket.emit("load word", current_word);
          if (helpers.isCurrentTurn(socket, player_info, turn_index)) {
            socket.emit("start turn");
          }
        }

        // gets all player names and emit the list
        const names = await helpers.getPlayerNames(player_info);
        io.to(code).emit("load player list", names.sort());

        // Get session ID
        let SID = cookies.getSession(socket);

        // Get username of player sending the message
        const userName = player_info[SID]['name'];

        // Emits welcome message in the chat
        socket.emit('message', {user: "admin", text: `${userName}, welcome to the room ${code}.`});

      } catch (error) {
        console.error("Could not get player names. " + error);
      }
    });

    // Listener for game start
    // emits the 'start game event' to everyone in the room
    socket.on('start game', async (code) => {
      try {
        await db.startGame(code);
        
        const { player_info } = await db.getGameByCode(code);
        const nextSID = await helpers.getNextPlayer(code, player_info);
        
        const socketId = player_info[nextSID].socketId;
  
        io.to(code).emit('start game');
        io.to(socketId).emit('start turn');
      } catch (error) {
        console.log(`Error starting game. ${error}`);
      }
    })

    // Listener for when a player makes a move
    // Emits to next player the "start turn" event
    socket.on("finish turn", async function (code, letter, position) {
      try {
        // get session ID of next player
        const { player_info } = await db.getGameByCode(code);
        const nextSID = await helpers.getNextPlayer(code, player_info);

        // console.log(nextSID);
        // get the socketId of the next player
        const socketId = player_info[nextSID].socketId;

        loadWord(code, letter, position);
        io.to(socketId).emit("start turn");
      } catch (error) {
        console.log("Could not complete player turn. " + error);
      }
    });

    /* _______CHAT LISTENERS____________ */

    // for when we implement chats


    socket.on('sendMessage', async ({code, message}) => {
      // Get session ID
      let SID = cookies.getSession(socket);

      // Get username of player sending the message
      const data = await db.getGameByCode(code);
      console.log(code);
      let userName = data['player_info'][SID]['name'];
      io.to(code).emit('message', {user: userName, text: message});

      //code that was present before chat was implemented 
        //socket.on("chat message", (code, msg) => {
        // io.to(code).emit("chat message", msg);

    });

    // TODO

    /* _______CHALLENGE LISTENERS____________*/

    // Listener for challenger choosing "isWord" challenge
    socket.on("challenge", async function (code, type) {
      // emits to everyone but the sender
      const { player_info, turn_index } = await db.getGameByCode(code);
      const challenger = cookies.getSession(socket);
      const challenged = helpers.getPreviousPlayer(player_info, turn_index);
      socket.to(code).emit("challenge pending", challenger, challenged, type);
    });

    // gets whether was challenge was successful
    socket.on("challenge complete", (code, successful) => {
      // TODO
      /* Frontend handles whether or not the word was a phony or not, and after some delay,
      backend emits to everyone whether the challenge was successful or not 
      Then edits score and starts a new round by emitting "new round" to everyone */
      if (successful) {
        // TODO: add point to previous player
      } else {
        // TODO: add point to sender
      }

      io.to(code).emit("challenge complete", successful);
      setTimeout(() => {
        loadWord(code, "");
      }, 3000);
    });

    // LEGACY LISTENERS __________________

    // when a client adds a letter, update it for everyone
    socket.on("letter before", (word, code) => {
      loadWord(code, word);
    });

    socket.on("letter after", (word, code) => {
      loadWord(code, word);
    });

    // reset the word
    socket.on("reset word", async (code) => {
      await db.resetWord(code);
      io.to(code).emit("load word", "");
    });

    // check word
    socket.on("check word", (code, success) => {
      io.to(code).emit("word checked", success);
    });
  });
}

module.exports = runGame;
