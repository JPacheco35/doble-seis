# Doble-Seis — Project Planning Document

## Overview
A web-based 2v2 dominoes game supporting both singleplayer and multiplayer modes. Built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time communication.

---

## Game Rules

### Setup
- 4 players, 2 teams of 2 (partners sit across from each other)
- 28 dominoes total, 7 dealt to each player per round
- Deck is shuffled before each round

### Round Start
- **Round 1 of the game:** The player holding the double-six opens
- **All subsequent rounds:** The next player clockwise from the previous round's opener

### Gameplay
- Players take turns placing dominoes on the board chain
- A domino can only be placed if one of its values matches an open end of the chain
- If a player has no valid move, they knock (pass their turn)

### Turn System
- **30 seconds** per turn maximum
- If the timer expires with no move made, the server automatically selects the first valid move
- If no valid move exists, the turn is automatically skipped (knock)

---

## Scoring System

### Goal
First team to reach **20 points** wins the game.

### Knock Points
Awarded to the **opposing team** of the knocker.
- **1st knock of the entire game:** 2 points
- **All subsequent knocks:** 1 point each

### Lock System
A lock occurs when players are blocked from making a move.

| Lock Type | Trigger | Points | Effect |
|---|---|---|---|
| **Soft Lock** | All 3 other players are blocked, but the locker is not | 2 points to locker's team | Play continues |
| **Hard Lock** | All 4 players are blocked | 2 points to locker's team | Round ends immediately |

### Tally System
- A **round ends** when a player places all their dominoes (dominoes), or a Hard Lock occurs
- The **tally** is the combined pip sum of all unplayed dominoes across all hands
- The winning team of the round is awarded the tally, converted to points as follows:

| Tally Range | Points Awarded |
|---|---|
| 1–5 | 0 points (round down) |
| 6–14 | 1 point |
| 15–24 | 1–2 points |
| ...| ... |
| Every 10 tally points | 1 point |
| Remainder ≤ 5 | Round down |
| Remainder ≥ 6 | Round up |

**Examples:**
- Tally of 45 → 4 points (45 ÷ 10 = 4.5, remainder 5 → round down)
- Tally of 46 → 5 points (46 ÷ 10 = 4.6, remainder 6 → round up)

### Hard Lock Tiebreaker (for tally award)
When a Hard Lock ends the round:
1. Team with the **lowest individual pip count** in hand wins the tally
2. If teams are tied → the **2nd lowest individual holder** wins the tally for their team
3. If still tied → **no tally is awarded**

---

## Game Modes

### Singleplayer
- Player + 1 bot vs 2 bots (always 2v2)
- Bot behavior: selects first valid move (can be upgraded to strategic AI later)
- No matchmaking needed — game starts immediately

### Multiplayer
- 4 human players, 2v2
- **Matchmaking: Room Code only (private lobbies)**
    - Player 1 creates a room → receives a unique 4-character room code
    - Players 2–4 enter the code to join
    - Host starts the game once all 4 players have joined and readied up

---

## Technical Stack

| Layer | Technology         |
|---|--------------------|
| Frontend | React (Vite)       |
| UI Components | Mantine UI         |
| Real-time | Socket.IO          |
| Backend | Node.js + Express  |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt       |

---

## Build Phases

### Phase 1 — Game Board UI (fake data)
- Visual layout: table, 4 player positions, domino chain, hands
- Domino tile components
- No logic, just rendering

### Phase 2 — Lobby System
- Create room / join by code
- Waiting room with ready-up
- Socket.IO room management# Doble Seis — Project Planning Document

## Overview
A web-based 2v2 dominoes game supporting both singleplayer and multiplayer modes. Built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time communication.

---

## Game Rules

### Setup
- 4 players, 2 teams of 2 (partners sit across from each other)
- 28 dominoes total, 7 dealt to each player per round
- Deck is shuffled before each round

### Round Start
- **Round 1 of the game:** The player holding the double-six opens
- **All subsequent rounds:** The next player clockwise from the previous round's opener

### Gameplay
- Players take turns placing dominoes on the board chain
- A domino can only be placed if one of its values matches an open end of the chain
- If a player has no valid move, they knock (pass their turn)

### Turn System
- **30 seconds** per turn maximum
- If the timer expires with no move made, the server automatically selects the first valid move
- If no valid move exists, the turn is automatically skipped (knock)

---

## Scoring System

### Goal
First team to reach **20 points** wins the game.

### Knock Points
Awarded to the **opposing team** of the knocker.
- **1st knock of the entire game:** 2 points
- **All subsequent knocks:** 1 point each

### Lock System
A lock occurs when players are blocked from making a move.

| Lock Type | Trigger | Points | Effect |
|---|---|---|---|
| **Soft Lock** | All 3 other players are blocked, but the locker is not | 2 points to locker's team | Play continues |
| **Hard Lock** | All 4 players are blocked | 2 points to locker's team | Round ends immediately |

### Tally System
- A **round ends** when a player places all their dominoes (dominoes), or a Hard Lock occurs
- The **tally** is the combined pip sum of all unplayed dominoes across all hands
- The winning team of the round is awarded the tally, converted to points as follows:

| Tally Range | Points Awarded |
|---|---|
| 1–5 | 0 points (round down) |
| 6–14 | 1 point |
| 15–24 | 1–2 points |
| ...| ... |
| Every 10 tally points | 1 point |
| Remainder ≤ 5 | Round down |
| Remainder ≥ 6 | Round up |

**Examples:**
- Tally of 45 → 4 points (45 ÷ 10 = 4.5, remainder 5 → round down)
- Tally of 46 → 5 points (46 ÷ 10 = 4.6, remainder 6 → round up)

### Hard Lock Tiebreaker (for tally award)
When a Hard Lock ends the round:
1. Team with the **lowest individual pip count** in hand wins the tally
2. If teams are tied → the **2nd lowest individual holder** wins the tally for their team
3. If still tied → **no tally is awarded**

---

## Game Modes

### Singleplayer
- Player + 1 bot vs 2 bots (always 2v2)
- Bot behavior: selects first valid move (can be upgraded to strategic AI later)
- No matchmaking needed — game starts immediately

### Multiplayer
- 4 human players, 2v2
- **Matchmaking: Room Code only (private lobbies)**
    - Player 1 creates a room → receives a unique 4-character room code
    - Players 2–4 enter the code to join
    - Host starts the game once all 4 players have joined and readied up

---

## Technical Stack

| Layer | Technology         |
|---|--------------------|
| Frontend | React (Vite)       |
| UI Components | Mantine UI         |
| Real-time | Socket.IO          |
| Backend | Node.js + Express  |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt       |

---

## Build Phases

### Phase 1 — Game Board UI (fake data)
- Visual layout: table, 4 player positions, domino chain, hands
- Domino tile components
- No logic, just rendering

### Phase 2 — Lobby System
- Create room / join by code
- Waiting room with ready-up
- Socket.IO room management

### Phase 3 — Auth
- Register / Login
- JWT session
- Username tied to socket connection

### Phase 4 — Game Logic
- Deck generation, shuffle, deal
- Turn system with 30-second timer
- Board chain validation
- Knock, lock, tally, and scoring logic
- Win condition detection

### Phase 5 — Singleplayer / Bots
- Bot logic (valid move selection)
- Singleplayer game start flow

### Phase 6 — Polish
- Animations (Framer Motion)
- Sound effects
- Disconnection handling + rejoin
- Game history saved to MongoDB
- Leaderboard / player stats

---

## Nice-to-Have Features (Future)
- Public matchmaking queue
- Strategic bot AI (beyond random valid moves)
- Spectator mode
- Replay system
- Mobile responsive layout

### Phase 3 — Auth
- Register / Login
- JWT session
- Username tied to socket connection

### Phase 4 — Game Logic
- Deck generation, shuffle, deal
- Turn system with 30-second timer
- Board chain validation
- Knock, lock, tally, and scoring logic
- Win condition detection

### Phase 5 — Singleplayer / Bots
- Bot logic (valid move selection)
- Singleplayer game start flow

### Phase 6 — Polish
- Animations (Framer Motion)
- Sound effects
- Disconnection handling + rejoin
- Game history saved to MongoDB
- Leaderboard / player stats

---

## Nice-to-Have Features (Future)
- Public matchmaking queue
- Strategic bot AI (beyond random valid moves)
- Spectator mode
- Replay system
- Mobile responsive layout