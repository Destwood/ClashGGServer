import {IChatMessage, IRoom, IUser, IClient, IRoomsList, IEvent} from "../types";
import { RoomServices } from './room.service';
import { WebSocket } from 'ws';
import {broadcastRoomList, broadcastRoomUsers, reconnectUsers} from "../helpers";
import {ChatEvents, RoomType} from "../utils/enums";
import {initRoomData} from "../utils/constants";

export class UserServices {
    static joinRoom(rooms: IRoomsList, message: IEvent, ws: WebSocket): void {
        const { user, user2, roomId } = message;

        reconnectUsers(rooms);

        broadcastRoomList(rooms, user);

        let roomData = roomId === RoomType.global
            ? rooms.global
            : Object.values(rooms).find((r: IRoom) => {console.log(r.id,  roomId); return r.id === roomId;});

        Object.values(rooms).forEach((r: IRoom) => {
            r.activeUsers = r.activeUsers.filter((client: IClient) => client.ws !== ws);
        });

        if (!roomData) {
            console.log('trying to create room, roomData:', roomData);
            console.log('message event:', message);
            console.log('keys of rooms', Object.values(rooms));
            roomData = RoomServices.createRoom(rooms ,message, ws);
            if(!roomData) {console.log('24 user.service, failed to create room'); return;}
        }

        const userExistsInGlobal = rooms.global.allUsers.some((client: IClient) => client.userData.id === user.id);
        if (!userExistsInGlobal) {
            rooms.global.allUsers.push({ ws, userData: user });
            rooms.global.activeUsers.push({ ws, userData: user });
            broadcastRoomList(rooms, user);
            Object.values(rooms).forEach((r: IRoom) => {
                if (r.type === 'direct') {
                    broadcastRoomUsers(rooms, r.id);
                }
            });
        }

        if (!roomData.activeUsers.some((client: IClient) => client.ws === ws)) {
            roomData.activeUsers.push({ userData: user, ws });
        }

        // Send message history

        ws.send(JSON.stringify({
            event: ChatEvents.history,
            roomId: roomData.id,
            roomName: roomData.name,
            messages: roomData.messages,
            type: roomData.type,
        }));
        broadcastRoomList(rooms, user);
        broadcastRoomUsers(rooms, roomData.id);
    }

    static addUserToRoom(rooms: IRoomsList, message: IEvent, ws: WebSocket): void {
        const { room: roomId, user } = message;
        if (!user || !roomId) {
            console.error(`Invalid data 59, user.service, \n user: ${user} \nroomId: ${roomId}`);
            return;
        }

        if (rooms[roomId]) {
            const userExistsInAllUsers = rooms[roomId].allUsers.some((client: IClient) => client.userData.id === user.id);

            // Prevent adding the same user again
            if (!userExistsInAllUsers) {
                const currentUser = rooms.global.allUsers.find((client: IClient) => client.userData.id === user.id);
                console.log('If we will add user', user);
                if (!currentUser) {
                    console.log('Cannot add user who is not logged in');
                    return;
                }
                rooms[roomId].allUsers.push({ ws, userData: currentUser.userData });
                broadcastRoomList(rooms, { id: user.id });
                console.log(`User with ID ${user.id} added to room: ${roomId}`);
            }
            else {
                console.log(`User with ID ${user.id} already in a room`);
                const messageData = {
                    event: ChatEvents.error,
                    errorMsg: `User already in a room`,
                };
                ws.send(JSON.stringify(messageData));
            }
        }
        else {
            console.error(`AddUserToRoom - Room with ID ${roomId} does not exist.`);
        }
    }

    static removeUserFromRoom(rooms: IRoomsList, message: IEvent, ws: WebSocket): void {
        const { roomId, user } = message;
        console.log(message);

        if (rooms[roomId]) {
            console.log(`215 Removing user ${user.username} from ${roomId}`);
            rooms[roomId].allUsers = rooms[roomId].allUsers.filter((client: IClient) => client.userData.id !== user.id);
            rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter((client: IClient) => client.userData.id !== user.id);
            console.log(`${user.username} removed from room: ${roomId}`);

            if (rooms[roomId].creator && rooms[roomId].creator.id === user.id) {
                const newCreator = rooms[roomId].allUsers[0]?.userData;
                if (newCreator) {
                    rooms[roomId].creator = newCreator;
                    console.log(`New creator for room ${roomId} is ${newCreator.id}`);
                    rooms[roomId].activeUsers.forEach((client: IClient) => {
                        if (client && client.ws && client.ws.readyState === 1) {
                            broadcastRoomList(rooms, client.userData);
                        }
                    });
                }
                else {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} deleted because it has no users.`);
                }
            }
        }
        broadcastRoomList(rooms, user);
        broadcastRoomUsers(rooms, roomId);
    }

    static disconnect(rooms: Record<string, IRoom>, ws: WebSocket): void {
        console.log('disconnect event')
        Object.keys(rooms).forEach(roomId => {
            if (rooms[roomId] && rooms[roomId].activeUsers) {
                rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter(client => client.ws !== ws);
                console.log('rooms after user leaving: ', rooms[roomId].activeUsers);
                if (rooms[roomId].activeUsers.length === 0 && roomId !== RoomType.global) {
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
