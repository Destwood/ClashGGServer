import {IClient, IEvent, IRoom, IRoomsList} from "../types";
import {v4 as uuid} from 'uuid';
import {broadcastRoomList} from "../helpers";
import {WebSocket} from 'ws';
import {RoomType} from "../utils/enums";

export class RoomServices {

    static createRoom(rooms: IRoomsList, message: IEvent, ws: WebSocket) {
        const { room, user, user2, roomId } = message;
        const id: string = user2 ? roomId : uuid();
        let roomData: IRoom;

        if (user2) {
            roomData = {
                id: id,
                activeUsers: [{ ws, userData: user }],
                allUsers: [{ ws, userData: user }, { ws, userData: user2 }],
                messages: [],
                type: RoomType.direct
            };
        } else {
            if(!room) {console.log('before return craete room: ', message); return;}
            roomData = {
                id: id,
                name: room,
                activeUsers: [{ ws, userData: user }],
                allUsers: [{ ws, userData: user }],
                creator: user,
                messages: [],
                type: RoomType.privateRoom
            };
        }

        rooms[id] = roomData;
        console.log(`Room "${room}" created with ID: ${rooms[id].id}`);
        broadcastRoomList(rooms, user);
        return roomData;
    }

    static deleteRoom(rooms: IRoomsList, message: IEvent) {
        const { roomId } = message;
        console.log(`deleting room ${roomId}`);
        if(!roomId) return;
        const allClients = rooms[roomId].allUsers;
        if (rooms[roomId]) {
            delete rooms[roomId];
        }
        allClients.forEach((user: IClient) => {
            if(user.userData) {
                broadcastRoomList(rooms, user.userData);
            }
        });
    }
}
