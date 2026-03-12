import { Route, Routes } from 'react-router-dom';
import Welcome from '../Welcome/Welcome.tsx';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound/NotFound.tsx';
import { Lobby } from '../Lobby/Lobby.tsx';
import Game from "../Game/Game.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:code" element={<Game />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}