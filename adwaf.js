// import { IEvent } from "./src/types/message";
// import { ChatEvents } from "./src/utils/enums/events";
// import WS, { WebSocket } from 'ws';  // Імпортуємо WebSocket тип із бібліотеки ws
//
// import { MessageServices } from './src/services/message.service';
// import { RoomServices } from './src/services/room.service';
// import { UserServices } from './src/services/user.service';
// import { broadcastRoomList, broadcastRoomUsers } from './src/helpers/broadcast';
// import {IRoom} from "./src/types/room";
//
// const port = 8001;
// const wss = new WS.Server({ port }, () => {
//     console.log(`Server started on ws://localhost:${port}`);
// });
//
// // Global rooms and users management
// const rooms: Record<string, IRoom> = {
//     global: {
//         id: 'global',
//         name: 'global',
//         activeUsers: [], // Active users in the room
//         allUsers: [], // All users who have ever joined the room
//         messages: [], // Messages exchanged in the room
//         type: 'public' // Public or private
//     }
// };
// const users = {}; // To track users
//
// wss.on('connection', (ws: WebSocket) => {
//     console.log('New client connected');
//
//     // When a message is received from the client
//     ws.on('message', (message: string) => {
//         const parsedMessage: IEvent = JSON.parse(message);
//         handleEvent(parsedMessage, ws);
//     });
//
//     // Handle client disconnect
//     ws.on('close', () => {
//         UserServices.disconnect(ws);
//     });
// });
//
// // Event handling based on the ChatEvents enum
// function handleEvent(message: IEvent, ws: WebSocket) {
//     console.log('\n\n\n')
//     console.log(message.event)
//     switch (message.event) {
//         case ChatEvents.joinRoom:
//             UserServices.joinRoom(rooms, message, ws);
//             break;
//
//         case ChatEvents.message:
//             MessageServices.message(rooms, message);
//             break;
//
//         case ChatEvents.createPrivateRoom:
//             RoomServices.createRoom(rooms, message, ws);
//             break;
//
//         case ChatEvents.addUserToPrivateRoom:
//             UserServices.addUserToRoom(rooms, message, ws);
//             break;
//
//         case ChatEvents.removeUserFromPrivateRoom:
//             UserServices.removeUserFromRoom(rooms, message, ws);
//             break;
//
//         case ChatEvents.deletePrivateRoom:
//             RoomServices.deleteRoom(rooms, message, ws);
//             break;
//
//         case ChatEvents.disconnect:
//             UserServices.disconnect(ws);
//             break;
//
//         default:
//             console.log(`Unknown event: ${message.event}`);
//     }
//     console.log('76, RoomsList:', Object.keys(rooms))
// }
