class GameController {
    constructor(io) {
      this.io = io;
      this.games = {}; // Games indexed by socket ID of the host
      console.log('GameController initialized');
    }
  
    addPlayer(socket, name) {
      // Attempt to retrieve an existing game if one exists
      const existingGameKey = Object.keys(this.games)[0];
      const game = existingGameKey ? this.games[existingGameKey] : null;
  
      // If the game exists, check if this player is already in the game
      if (game && game.players.some(player => player.socketId === socket.id)) {
          console.log(`${name} is already in the game.`);
          return; // Exit the function to avoid adding the player again
      }
    
      // If no game exists, create a new game with the first player as the host
      if (!game) {
          const gameID = socket.id;
          this.games[socket.id] = {
              host: socket.id,
              players: [{ socketId: socket.id, name, isHost: true }],
              word: [],
              guesses: [],
              wrongGuesses: 0,
              currentPlayerIndex: -1, // Initialize with -1 indicating no current player yet
              state: 'waitingForWord', // New game state indicating waiting for the host to set the word
          };
          console.log(`${name} is now the host`);
          socket.emit('youAreHost', { gameID });
      } else {
          // Add the player to an existing game (for simplicity, we're assuming only one game)
          game.players.push({ socketId: socket.id, name, isHost: false });
          this.io.to(game.host).emit('playerJoined', name);
          console.log(`${name} joined the game`);
  
          // If this is the first non-host player joining, set them as the current player
          if (game.players.length === 2) { // The host plus the new player
              game.currentPlayerIndex = 1; // The new player is the second item in the array
              this.io.to(game.players[game.currentPlayerIndex].socketId).emit('yourTurn');
          }
      }
  }
  
    
    setWord(socket, word) {
        console.log(`Setting word: ${word} by host ${socket.id}`);
        const game = this.findGameByPlayerSocketId(socket.id);
        if (game && socket.id === game.host) {
            game.word = word.toUpperCase().split('');
            game.guesses = Array(word.length).fill('_');
            // Once the word is set, notify all players the game is ready to start
            this.io.to(game.host).emit('wordSet', game.guesses);
            console.log(`Word set successfully for game hosted by ${socket.id}`);
        } else {
            console.log(`Failed to set word for game hosted by ${socket.id}`);
        }
    }
      
    guessLetter(socket, letter) {
      console.log(`Player ${socket.id} guessed letter: ${letter}`);
      const game = this.findGameByPlayerSocketId(socket.id);
      if (!game || game.word.length === 0) {
          console.log('No game found or word not set');
          return; // No game found or word not set
      }
  
      // Check if the player is the host
        if (socket.id === game.host) {
          console.log('The host cannot guess.');
          socket.emit('hostCannotGuess');
          return; // Prevent the host from guessing
      }

      const { players, currentPlayerIndex } = game;
      if (socket.id !== players[currentPlayerIndex].socketId) {
          console.log(`It's not ${socket.id}'s turn`);
          socket.emit('notYourTurn');
          return;
      }
  
      letter = letter.toUpperCase();
      let found = false;
      game.word.forEach((char, index) => {
          if (char === letter) {
              game.guesses[index] = letter;
              found = true;
          }
      });
  
      if (!found) {
          // Incorrect guess
          game.wrongGuesses += 1;
          console.log(`Wrong guess by ${socket.id}. Wrong guesses: ${game.wrongGuesses}`);
      } else {
          console.log(`Correct guess by ${socket.id}. Current word state: ${game.guesses.join(' ')}`);
      }
  
      if (!game.guesses.includes('_')) {
          // Word has been completely guessed
          console.log(`Game over. Winner: ${players[currentPlayerIndex].name}`);
          game.players.forEach(player => {
              this.io.to(player.socketId).emit('gameOver', {
                  winner: players[currentPlayerIndex].name,
                  word: game.word.join('')
              });
          });
          delete this.games[game.host]; // Consider resetting rather than deleting for a new game
          return;
      } else if (game.wrongGuesses >= 6) {
          // Handle game over due to too many wrong guesses
          console.log('Game over. No winner.');
          game.players.forEach(player => {
              this.io.to(player.socketId).emit('gameOver', {
                  winner: 'None',
                  word: game.word.join('')
              });
          });
          delete this.games[game.host]; // Consider resetting rather than deleting for a new game
          return;
      }
  
      this.nextPlayer(game);
      this.broadcastGameState(game);
  }
  
    nextPlayer(game) {
      do {
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
      } while (game.players[game.currentPlayerIndex].socketId === game.host); // Skip the host
      console.log(`Next player's turn: ${game.players[game.currentPlayerIndex].name}`);
      if (game.wrongGuesses >= 6) {
        // Max wrong guesses reached, game over
        this.io.to(game.host).emit('gameOver', { winner: 'None', word: game.word.join('') });
        console.log('Game over. No winner.');
        delete this.games[game.host];
      }
    }
  
    removePlayer(socket) {
      console.log(`Removing player: ${socket.id}`);
      const game = this.findGameByPlayerSocketId(socket.id);
      if (!game) return;
  
      game.players = game.players.filter(player => player.socketId !== socket.id);
      if (game.players.length === 0) {
        console.log('All players have left. Deleting game.');
        delete this.games[game.host];
      } else if (socket.id === game.host) {
        game.host = game.players[0].socketId;
        game.players[0].isHost = true;
        console.log(`New host assigned: ${game.players[0].name}`);
        this.io.to(game.host).emit('youAreHost');
      }
  
      this.broadcastGameState(game);
    }
  
    broadcastGameState(game) {
      const gameState = {
        players: game.players.map(player => player.name),
        guesses: game.guesses,
        wrongGuesses: game.wrongGuesses,
        currentPlayer: game.players[game.currentPlayerIndex].name,
      };
      console.log(`Broadcasting game state: ${JSON.stringify(gameState)}\n\n`);
      game.players.forEach(player => {
        this.io.to(player.socketId).emit('gameStateUpdate', gameState);
      });
    }
  
    findGameByPlayerSocketId(socketId) {
      return Object.values(this.games).find(game => game.players.some(player => player.socketId === socketId));
    }
  }
  
  module.exports = GameController;
  