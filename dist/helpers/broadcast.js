"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastRoomUsers = exports.broadcastRoomList = void 0;
const enums_1 = require("../utils/enums");
const broadcastRoomList = function (rooms, user) {
    const activeRooms = {};
    Object.entries(rooms).forEach(([roomId, room]) => {
        const isUserInRoom = room.allUsers.some((client) => {
            if (client.userData) {
                return client.userData.id === user.id;
            }
        });
        if (isUserInRoom || activeRooms[roomId]) {
            activeRooms[roomId] = room;
        }
    });
    const payload = JSON.stringify({
        event: enums_1.ChatEvents.updateRoomList,
        rooms: Object.fromEntries(Object.entries(activeRooms).map(([roomId, room]) => [
            roomId,
            Object.assign(Object.assign({}, room), { allUsers: room.allUsers.map(client => ({
                    userData: client.userData,
                })), activeUsers: room.activeUsers.map(client => ({
                    userData: client.userData,
                })) })
        ]))
    });
    const client = Object.values(rooms).flatMap(room => room.allUsers).find((client) => {
        if (client.userData) {
            return client.userData.id === user.id;
        }
    });
    if (client && client.ws.readyState === 1) {
        client.ws.send(payload);
    }
};
exports.broadcastRoomList = broadcastRoomList;
const broadcastRoomUsers = function (rooms, roomId) {
    const room = Object.values(rooms).find((r) => r.id === roomId);
    if (room) {
        room.activeUsers.forEach((client) => {
            if (client && client.ws && client.ws.readyState === 1) {
                const message = {
                    event: enums_1.ChatEvents.updateUserList,
                    roomId: room.id,
                    roomName: room.name,
                    users: room.allUsers.map(user => ({
                        userData: user.userData
                    })),
                    allUsers: rooms.global.allUsers.map(user => ({
                        userData: user.userData
                    })),
                    creator: room.creator,
                };
                client.ws.send(JSON.stringify(message));
            }
            else {
                console.error('Client or Server is invalid:', `${client.ws.readyState}`, client.userData);
            }
        });
    }
    else {
        console.log(`Broadcast - Room with ID ${roomId} not found.`);
    }
};
exports.broadcastRoomUsers = broadcastRoomUsers;
