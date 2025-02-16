"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRoomData = void 0;
const uuid_1 = require("uuid");
const enums_1 = require("../enums");
exports.initRoomData = {
    id: (0, uuid_1.v4)(),
    name: '',
    activeUsers: [],
    allUsers: [],
    messages: [],
    type: enums_1.RoomType.privateRoom,
};
