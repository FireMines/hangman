import React from 'react';

// A simple representation of the hangman's stages. You can replace these with more sophisticated graphics or SVG drawings.
const stages = [
  `
    +---+
    |   |
        |
        |
        |
        |
  =========`,
  `
    +---+
    |   |
    O   |
        |
        |
        |
  =========`,
  `
    +---+
    |   |
    O   |
    |   |
        |
        |
  =========`,
  `
    +---+
    |   |
    O   |
   /|   |
        |
        |
  =========`,
  `
    +---+
    |   |
    O   |
   /|\\  |
        |
        |
  =========`,
  `
    +---+
    |   |
    O   |
   /|\\  |
   /    |
        |
  =========`,
  `
    +---+
    |   |
    O   |
   /|\\  |
   / \\  |
        |
  =========`
];

function HangmanDrawing({ wrongGuesses }) {
  return (
    <pre className="hangmanDrawing">
      {stages[wrongGuesses]}
    </pre>
  );
}

export default HangmanDrawing;
