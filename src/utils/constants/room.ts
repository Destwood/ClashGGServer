import { v4 as uuid } from 'uuid';
import {IRoom} from "../../types";
import {RoomType} from "../enums";

export const initRoomData: IRoom = {
    id: uuid(),
    name: '',
    activeUsers: [],
    allUsers: [],
    messages: [],
    type: RoomType.privateRoom,
};