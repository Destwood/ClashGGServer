import {IClient, IRoom, IRoomsList, IUser} from "../types";
import {ChatEvents} from "../utils/enums";

export const broadcastRoomList = function (rooms: IRoomsList, user: IUser): void {
    const activeRooms: IRoomsList = {};

    Object.entries(rooms).forEach(([roomId, room]) => {
        const isUserInRoom = room.allUsers.some((client: IClient) => {
            if(client.userData) {
                return client.userData.id === user.id;
            }
        });
        if (isUserInRoom || activeRooms[roomId]) {
            activeRooms[roomId] = room;
        }
    });

    const payload = JSON.stringify({
        event: ChatEvents.updateRoomList,
        rooms: Object.fromEntries(
            Object.entries(activeRooms).map(([roomId, room]) => [
                roomId,
                {
                    ...room,
                    allUsers: room.allUsers.map(client => ({
                        userData: client.userData,
                    })),
                    activeUsers: room.activeUsers.map(client => ({
                        userData: client.userData,
                    })),
                }
            ])
        )
    });

    const client = Object.values(rooms).flatMap(room => room.allUsers).find((client: IClient) => {
        if (client.userData) {
            return client.userData.id === user.id;
        }
    });

    if (client && client.ws.readyState === 1) {
        client.ws.send(payload);
    }
};

export const broadcastRoomUsers = function (rooms: IRoomsList, roomId: string): void {
    const room = Object.values(rooms).find((r: IRoom) => r.id === roomId);

    if (room) {
        room.activeUsers.forEach((client: IClient) => {
            if (client && client.ws && client.ws.readyState === 1) {
                const message = {
                    event: ChatEvents.updateUserList,
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
            } else {
                console.error('Client or Server is invalid:' , `${client.ws.readyState}`, client.userData);
            }
        });
    } else {
        console.log(`Broadcast - Room with ID ${roomId} not found.`);
    }
};
