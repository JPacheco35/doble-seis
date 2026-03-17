// the main app component which defines the routing

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
        <Route path="/" element={<Welcome />} />            {/*welcome/login page*/}
        <Route path="/welcome" element={<Welcome />} />     {/*welcome/login page*/}
        <Route path="/lobby" element={<Lobby />} />         {/*lobby page*/}
        <Route path="/game/:code" element={<Game />} />     {/*game page*/}
        <Route path="*" element={<NotFound />} />           {/*not found page*/}
      </Routes>
    </BrowserRouter>
  );
}