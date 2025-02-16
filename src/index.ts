import {WebSocket, WebSocketServer} from 'ws';
import { IEvent, IRoomsList} from "./types";
import {ChatEvents, RoomType} from "./utils/enums";
import {MessageServices, RoomServices, UserServices} from "./services";

const port = 8001;
const wss = new WebSocketServer({ port }, () => {
    console.log(`Server started on ws://localhost:${port}`);
});

const rooms: IRoomsList = {
    global: {
        id: 'global',
        name: 'global',
        activeUsers: [],
        allUsers: [],
        messages: [],
        type: RoomType.global
    }
};

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');

    ws.on('message', (message: string) => {
        const parsedMessage: IEvent = JSON.parse(message);
        handleEvent(parsedMessage, ws);
    });
});

function handleEvent(message: IEvent, ws: WebSocket) {
    console.log('\n\n\n')
    console.log(message.event)
    switch (message.event) {
        case ChatEvents.joinRoom:
            UserServices.joinRoom(rooms, message, ws);
            break;

        case ChatEvents.message:
            MessageServices.message(rooms, message);
            break;

        case ChatEvents.createPrivateRoom:
            RoomServices.createRoom(rooms, message, ws);
            break;

        case ChatEvents.addUserToPrivateRoom:
            UserServices.addUserToRoom(rooms, message, ws);
            break;

        case ChatEvents.removeUserFromPrivateRoom:
            UserServices.removeUserFromRoom(rooms, message, ws);
            break;

        case ChatEvents.deletePrivateRoom:
            RoomServices.deleteRoom(rooms, message, ws);
            break;

        case ChatEvents.disconnect:
            UserServices.disconnect(rooms, ws);
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