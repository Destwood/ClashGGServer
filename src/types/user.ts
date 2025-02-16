import { WebSocket } from 'ws';

export interface IUser {
    id: string;
    username?: string;
}

export interface IClient {
    ws: WebSocket;
    userData: IUser;
}
