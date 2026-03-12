// state.js
// DEBUG: PLACEHOLDER LOBBIES
const lobbies = {
    'TEST': {
        code: 'TEST',
        name: 'Test Lobby 1',
        host: 'system',
        hostname: 'System',
        status: 'waiting',
        players: [
            { playerId:"aaa-123", username:"Alice", team: 1 },
            { playerId:"bbb-123", username:"Bob", team: 2 },
            { playerId:"ccc-123", username:"Charlie", team: 1 },
            { playerId:"ddd-123", username:"David", team: 2 },
        ],
    },
    'DEV2': {
        code: 'DEV2',
        name: 'Test Lobby 2',
        host: 'system',
        hostname: 'System',
        status: 'waiting',
        players: [
            { playerId:"eee-123", username:"Ethan", team: 1 },
            { playerId:"fff-123", username:"Fatima", team: 2 },
            { playerId:"ggg-123", username:"George", team: 1 },
        ],
    },
    'DEV3': {
        code: 'DEV3',
        name: 'Test Lobby 3',
        hostname: 'System',
        host: 'system',
        status: 'waiting',
        players: [
            { playerId:"hhh-123", username:"Hailey", team: 1 },
            { playerId:"iii-123", username:"Ian", team: 2 },
        ],
    },
    'DEV4': {
        code: 'DEV4',
        name: 'Test Lobby 4',
        hostname: 'System',
        host: 'system',
        status: 'waiting',
        players: [
            { playerId:"jjj-123", username:"Jim", team: 1 },
        ],
    },
};
const games = {};
module.exports = { lobbies, games };