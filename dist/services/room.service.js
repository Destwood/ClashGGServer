"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomServices = void 0;
const uuid_1 = require("uuid");
const helpers_1 = require("../helpers");
const enums_1 = require("../utils/enums");
class RoomServices {
    static createRoom(rooms, message, ws) {
        const { room, user, user2, roomId } = message;
        const id = user2 ? roomId : (0, uuid_1.v4)();
        let roomData;
        if (user2) {
            roomData = {
                id: id,
                activeUsers: [{ ws, userData: user }],
                allUsers: [{ ws, userData: user }, { ws, userData: user2 }],
                messages: [],
                type: enums_1.RoomType.direct
            };
        }
        else {
            if (!room) {
                console.log('before return craete room: ', message);
                return;
            }
            roomData = {
                id: id,
                name: room,
                activeUsers: [{ ws, userData: user }],
                allUsers: [{ ws, userData: user }],
                creator: user,
                messages: [],
                type: enums_1.RoomType.privateRoom
            };
        }
        rooms[id] = roomData;
        console.log(`Room "${room}" created with ID: ${rooms[id].id}`);
        (0, helpers_1.broadcastRoomList)(rooms, user);
        return roomData;
    }
    static deleteRoom(rooms, message) {
        const { roomId } = message;
        console.log(`deleting room ${roomId}`);
        if (!roomId)
            return;
        const allClients = rooms[roomId].allUsers;
        if (rooms[roomId]) {
            delete rooms[roomId];
        }
        allClients.forEach((user) => {
            if (user.userData) {
                (0, helpers_1.broadcastRoomList)(rooms, user.userData);
            }
        });
    }
}
exports.RoomServices = RoomServices;
