import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import GamePage from './components/GamePage';
import './index.css'; 
import * as Sentry from "@sentry/react";


function App() {
  return (
    <Router>
      <div className="app">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
      </div>
    </Router>
  );
}

export default Sentry.withProfiler(App);
