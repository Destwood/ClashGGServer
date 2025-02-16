"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const room_service_1 = require("./room.service");
const helpers_1 = require("../helpers");
const enums_1 = require("../utils/enums");
class UserServices {
    static joinRoom(rooms, message, ws) {
        const { user, user2, roomId } = message;
        (0, helpers_1.reconnectUsers)(rooms);
        (0, helpers_1.broadcastRoomList)(rooms, user);
        let roomData = roomId === enums_1.RoomType.global
            ? rooms.global
            : Object.values(rooms).find((r) => { console.log(r.id, roomId); return r.id === roomId; });
        Object.values(rooms).forEach((r) => {
            r.activeUsers = r.activeUsers.filter((client) => client.ws !== ws);
        });
        if (!roomData) {
            console.log('trying to create room, roomData:', roomData);
            console.log('message event:', message);
            console.log('keys of rooms', Object.values(rooms));
            roomData = room_service_1.RoomServices.createRoom(rooms, message, ws);
            if (!roomData) {
                console.log('24 user.service, failed to create room');
                return;
            }
        }
        const userExistsInGlobal = rooms.global.allUsers.some((client) => client.userData.id === user.id);
        if (!userExistsInGlobal) {
            rooms.global.allUsers.push({ ws, userData: user });
            rooms.global.activeUsers.push({ ws, userData: user });
            (0, helpers_1.broadcastRoomList)(rooms, user);
            Object.values(rooms).forEach((r) => {
                if (r.type === 'direct') {
                    (0, helpers_1.broadcastRoomUsers)(rooms, r.id);
                }
            });
        }
        if (!roomData.activeUsers.some((client) => client.ws === ws)) {
            roomData.activeUsers.push({ userData: user, ws });
        }
        // Send message history
        ws.send(JSON.stringify({
            event: enums_1.ChatEvents.history,
            roomId: roomData.id,
            roomName: roomData.name,
            messages: roomData.messages,
            type: roomData.type,
        }));
        (0, helpers_1.broadcastRoomList)(rooms, user);
        (0, helpers_1.broadcastRoomUsers)(rooms, roomData.id);
    }
    static addUserToRoom(rooms, message, ws) {
        const { room: roomId, user } = message;
        if (!user || !roomId) {
            console.error(`Invalid data 59, user.service, \n user: ${user} \nroomId: ${roomId}`);
            return;
        }
        if (rooms[roomId]) {
            const userExistsInAllUsers = rooms[roomId].allUsers.some((client) => client.userData.id === user.id);
            // Prevent adding the same user again
            if (!userExistsInAllUsers) {
                const currentUser = rooms.global.allUsers.find((client) => client.userData.id === user.id);
                console.log('If we will add user', user);
                if (!currentUser) {
                    console.log('Cannot add user who is not logged in');
                    return;
                }
                rooms[roomId].allUsers.push({ ws, userData: currentUser.userData });
                (0, helpers_1.broadcastRoomList)(rooms, { id: user.id });
                console.log(`User with ID ${user.id} added to room: ${roomId}`);
            }
            else {
                console.log(`User with ID ${user.id} already in a room`);
                const messageData = {
                    event: enums_1.ChatEvents.error,
                    errorMsg: `User already in a room`,
                };
                ws.send(JSON.stringify(messageData));
            }
        }
        else {
            console.error(`AddUserToRoom - Room with ID ${roomId} does not exist.`);
        }
    }
    static removeUserFromRoom(rooms, message, ws) {
        var _a;
        const { roomId, user } = message;
        console.log(message);
        if (rooms[roomId]) {
            console.log(`215 Removing user ${user.username} from ${roomId}`);
            rooms[roomId].allUsers = rooms[roomId].allUsers.filter((client) => client.userData.id !== user.id);
            rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter((client) => client.userData.id !== user.id);
            console.log(`${user.username} removed from room: ${roomId}`);
            if (rooms[roomId].creator && rooms[roomId].creator.id === user.id) {
                const newCreator = (_a = rooms[roomId].allUsers[0]) === null || _a === void 0 ? void 0 : _a.userData;
                if (newCreator) {
                    rooms[roomId].creator = newCreator;
                    console.log(`New creator for room ${roomId} is ${newCreator.id}`);
                    rooms[roomId].activeUsers.forEach((client) => {
                        if (client && client.ws && client.ws.readyState === 1) {
                            (0, helpers_1.broadcastRoomList)(rooms, client.userData);
                        }
                    });
                }
                else {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} deleted because it has no users.`);
                }
            }
        }
        (0, helpers_1.broadcastRoomList)(rooms, user);
        (0, helpers_1.broadcastRoomUsers)(rooms, roomId);
    }
    static disconnect(rooms, ws) {
        console.log('disconnect event');
        Object.keys(rooms).forEach(roomId => {
            if (rooms[roomId] && rooms[roomId].activeUsers) {
                rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter(client => client.ws !== ws);
                console.log('rooms after user leaving: ', rooms[roomId].activeUsers);
                if (rooms[roomId].activeUsers.length === 0 && roomId !== enums_1.RoomType.global) {
                    delete rooms[roomId];
                    console.log(`249 Room ${roomId} removed as no users are present.`);
                }
            }
            else {
                console.log(`252 Room ${roomId} or its activeUsers list is undefined.`);
            }
        });
        if (ws.readyState === 1) {
            ws.close();
        }
        console.log('259 Connection closed.');
    }
}
exports.UserServices = UserServices;
