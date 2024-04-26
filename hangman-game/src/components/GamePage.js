import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HangmanDrawing from './HangmanDrawing';
import {socket} from './LoginPage';

function handleClick (letter){
  console.log('The link was clicked with letter: .' + letter);
  socket.emit('guessLetter', letter);
};

function GamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name } = location.state;
  const [gameState, setGameState] = useState({
    players: [],
    guesses: [],
    wrongGuesses: 0,
    currentPlayer: '',
    message: ''
  });

  useEffect(() => {
    socket.on('connection', () => {
      console.log('Connected to server222222');
    });
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Join the game
    socket.emit('joinGame', name);

    // Listen for game state updates. Virker ikke, er asynkront
    socket.on('gameStateUpdate', (newGameState) => {
      setGameState((prevState) => ({
        ...prevState, // Spread existing state to maintain other values
        players: [...newGameState.players], // Spread new players into a new array
        guesses: [...newGameState.guesses], // Example of updating guesses
        wrongGuesses: newGameState.wrongGuesses,
        currentPlayer: newGameState.currentPlayer
      }));
    });

    socket.on('playerJoined', (newPlayer) => {
      setGameState((prevState) => ({
        ...prevState, // Spread the existing state
        players: [...prevState.players, newPlayer], // Add new player to the array immutably
      }));
    });

    // Listen for the host message
    socket.on('youAreHost', (gameID) => {
      const word = prompt(`You are the host ${gameID}. Please enter a word for the game:`);
      console.log(gameID);
      if (word) {
        socket.emit('setWord', word);
      }
    });

    socket.on('hostCannotGuess', () => {
      alert('As the host, you cannot guess letters.');
  });

    socket.on('gameOver', ({ winner, word }) => {
      const message = winner === 'None' ? `Game over. No winner. The word was ${word}.` : `Game over. The winner is ${winner}. The word was ${word}.`;
      setGameState(currentGameState => ({
          ...currentGameState,
          message // Update the message to show game over message
      }));
    });

    // Cleanup on component unmount
    return () => {
      socket.off('gameStateUpdate');
      socket.off('playerJoined')
      socket.off('youAreHost');
      socket.off('hostCannotGuess');
      socket.off('gameOver');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [name]); // Ensure this effect runs only once upon component mount



  // Function to navigate back to home
  const navigateHome = () => {
    navigate('/'); 
  };
  return (
    <div className="gamePage">
      <div className="players">
        <strong>Players:</strong> {gameState.players.join(', ')}
      </div>
      <div className="currentPlayer">
        <strong>Current Player:</strong> {gameState.currentPlayer}
      </div>
      <div className="wrongGuesses">
        <strong>Wrong Guesses:</strong> {gameState.wrongGuesses} of 6
      </div>
      <HangmanDrawing wrongGuesses={gameState.wrongGuesses} />
      <div className="wordToGuess">
        {gameState.guesses.join(' ')}
      </div>
      <div className="letterButtons">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map((letter) => (
          <button key={letter} onClick={() => handleClick(letter)}>
            {letter}
          </button>
        ))}
      </div>
      {gameState.message && <p className="message">{gameState.message}</p>}
      <button onClick={navigateHome}>Back to Home</button>
    </div>
  );
}

export default GamePage;
