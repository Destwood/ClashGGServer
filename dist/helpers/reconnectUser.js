"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconnectUsers = void 0;
const reconnectUsers = (rooms) => {
    Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId];
        if (room) {
            room.activeUsers = room.activeUsers.filter(client => client.ws.readyState !== 3);
            room.allUsers = room.allUsers.filter(client => client.ws.readyState !== 3);
        }
    });
};
exports.reconnectUsers = reconnectUsers;
