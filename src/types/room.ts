import {IClient, IUser} from "./user";
import {RoomType} from "../utils/enums";

export interface IRoom {
    id: string;
    name?: string;
    activeUsers: IClient[];
    allUsers: IClient[];
    messages: any[];
    type: RoomType;
    creator?: IUser;
}

export type IRoomsList = Record<string, IRoom>;
