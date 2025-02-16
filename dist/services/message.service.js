"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageServices = void 0;
const enums_1 = require("../utils/enums");
class MessageServices {
    static message(rooms, messageObj) {
        const { roomId, message, user } = messageObj;
        const roomData = Object.values(rooms).find((room) => room.id === roomId);
        if (roomData) {
            const messageData = {
                event: enums_1.ChatEvents.message,
                roomId: roomData.id,
                user,
                message,
                id: Date.now(),
                date: new Date().toISOString()
            };
            console.log('Message to send:', messageData);
            console.log('Room data:', roomData);
            roomData.messages.push(messageData);
            // Send message to all active users in the room
            roomData.activeUsers.forEach((client) => {
                if (client.ws.readyState === 1) {
                    client.ws.send(JSON.stringify(messageData));
                }
            });
        }
        else {
            console.log(`SendMsg - Room with ID ${roomId} not found.`, messageObj);
        }
    }
}
exports.MessageServices = MessageServices;
