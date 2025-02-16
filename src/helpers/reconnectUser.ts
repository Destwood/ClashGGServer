import {IClient, IRoom} from "../types";
import { WebSocket } from 'ws';

export const reconnectUsers = (rooms: Record<string, IRoom>) => {
    Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId];
        if (room) {
            room.activeUsers = room.activeUsers.filter(client => client.ws.readyState !== 3);
            room.allUsers = room.allUsers.filter(client => client.ws.readyState !== 3);
        }
    });
};
