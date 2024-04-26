import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Assuming your server is running on localhost:4000
// ENDRE DENNE IPEN OM BYTTET IP ADDRESSE
export const socket = io.connect('http://10.22.57.202:4000'); 

function LoginPage() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const joinGame = () => {
    socket.emit('joinGame', name);
    navigate('/game', { state: { name } });
  };

  return (
    <div className="loginPage">
      <h2>Enter Your Name to Join the Game</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && joinGame()}
      />
      <button onClick={joinGame}>Join</button>
    </div>
  );
}

export default LoginPage;
