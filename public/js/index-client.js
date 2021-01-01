// I NEED TO AVOID CALLBACK HELL
// ALSO USE THE BUILT-IN FORM FUNCTIONS INSTEAD OF USING JQUERY TO GET THE FORM VALUES

$(document).ready(function () {
  $("#create-room-btn").on("click", () => {
    $("#create-room-btn").after("<p>Loading...</p>");
    $("#create-room-btn").toggle();
    let name = $("#game-name").val();
    axios.post('/api/create-game', {
      name: name
    }).then(response => {
      console.log(response.data.code);
      window.location.replace(`/game/${response.data.code}`)
    }).catch(error => {
      console.error("There was an error making the request." + error);
    })
  });

  $("#join-room-btn").on("click", () => {
    let name = $("#game-name").val();
    let code = $("#game-code").val().toUpperCase();

    // get the game info to ensure that the room exists and is open
    axios.get(`/api/games/${code}`).then(response => {
      if (response.data != null && response.data.state == 0) {
        // add the new player's SID to the database
        axios.put(`/api/join-game/${code}`, {
          name: name
        }).then(putResponse => {
          console.log(putResponse);
          // redirect to game lobby
          window.location.replace(`/game/${response.data.code}`);
        }).catch(error => {
          console.error("There was an error making the request." + error);
        });
      }
    }).catch(error => {
      console.error("Could not get the game ID" + error);
    });
  })

});