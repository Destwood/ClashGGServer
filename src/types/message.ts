import {IUser} from "./user";
import {ChatEvents} from "../utils/enums";

export interface IChatMessage {
    user: IUser;
    message: string;
    timestamp: string;
    room?: string;
    roomId: string;
    user2: IUser;
}

export interface IEvent {
    event: ChatEvents;
    room?: string;
    roomId: string;
    user: IUser;
    user2?: IUser;
    message: string;
    id: number;
    date: string;
}
