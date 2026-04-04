// import React, { createContext, useState, ReactNode } from 'react'
//
// interface SinglePlayerContextType {
//     game: any; // we will type this properly in a moment
//     isInGame: boolean;
//     startGame: () => void;
//     endGame: () => void;
// }
//
// export const SinglePlayerContext = createContext<SinglePlayerContextType | null>(null);
//
// export function SinglePlayerProvider({ children }: { children: ReactNode }) {
//     const [game, setGame] = useState(null);
//
//     const startGame = () => {
//         // TODO: Initialize a new game here
//         const newGame = {
//             board: [],
//             hand: [],
//             players: [],
//             //...more later
//         };
//         setGame(newGame);
//         // TODO: save the game state to local storage
//     };
//
//     const endGame = () => {
//         // clear from memory and localStorage
//         setGame(null);
//         // TODO: clear from localStorage
//     };
//
//     return (
//         <SinglePlayerContext.Provider value={{
//             game,
//             isInGame: game !== null,
//             startGame,
//             endGame,
//         }}>
//             {children}
//         </SinglePlayerContext.Provider>
//     )
// }
