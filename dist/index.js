"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const enums_1 = require("./utils/enums");
const services_1 = require("./services");
const port = 8001;
const wss = new ws_1.WebSocketServer({ port }, () => {
    console.log(`Server started on ws://localhost:${port}`);
});
const rooms = {
    global: {
        id: 'global',
        name: 'global',
        activeUsers: [],
        allUsers: [],
        messages: [],
        type: enums_1.RoomType.global
    }
};
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        handleEvent(parsedMessage, ws);
    });
});
function handleEvent(message, ws) {
    console.log('\n\n\n');
    console.log(message.event);
    switch (message.event) {
        case enums_1.ChatEvents.joinRoom:
            services_1.UserServices.joinRoom(rooms, message, ws);
            break;
        case enums_1.ChatEvents.message:
            services_1.MessageServices.message(rooms, message);
            break;
        case enums_1.ChatEvents.createPrivateRoom:
            services_1.RoomServices.createRoom(rooms, message, ws);
            break;
        case enums_1.ChatEvents.addUserToPrivateRoom:
            services_1.UserServices.addUserToRoom(rooms, message, ws);
            break;
        case enums_1.ChatEvents.removeUserFromPrivateRoom:
            services_1.UserServices.removeUserFromRoom(rooms, message, ws);
            break;
        case enums_1.ChatEvents.deletePrivateRoom:
            services_1.RoomServices.deleteRoom(rooms, message, ws);
            break;
        case enums_1.ChatEvents.disconnect:
            services_1.UserServices.disconnect(rooms, ws);
            break;
        default:
            console.log(`Unknown event: ${message.event}`);
    }
    console.log('76, RoomsList:');
    Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId];
        console.log(`Room: ${room.name} | Users: ${room.activeUsers.length}`);
    });
}
