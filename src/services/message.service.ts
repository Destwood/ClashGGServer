import { IEvent } from "../types";
import { IRoom } from "../types";
import { IClient } from "../types";
import { ChatEvents } from "../utils/enums";

export class MessageServices {
    static message(rooms: Record<string, IRoom>, messageObj: IEvent): void {
        const { roomId, message, user } = messageObj;
        const roomData = Object.values(rooms).find((room: IRoom) => room.id === roomId);

        if (roomData) {
            const messageData: IEvent = {
                event: ChatEvents.message,
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
            roomData.activeUsers.forEach((client: IClient) => {
                if (client.ws.readyState === 1) {
                    client.ws.send(JSON.stringify(messageData));
                }
            });
        } else {
            console.log(`SendMsg - Room with ID ${roomId} not found.`, messageObj);
        }
    }
}
