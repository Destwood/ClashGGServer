"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
var ChatEvents;
(function (ChatEvents) {
    ChatEvents["joinRoom"] = "joinRoom";
    ChatEvents["message"] = "message";
    ChatEvents["history"] = "history";
    ChatEvents["createPrivateRoom"] = "createPrivateRoom";
    ChatEvents["addUserToPrivateRoom"] = "addUserToPrivateRoom";
    ChatEvents["updateUserList"] = "updateUserList";
    ChatEvents["updateRoomList"] = "updateRoomList";
    ChatEvents["removeUserFromPrivateRoom"] = "removeUserFromPrivateRoom";
    ChatEvents["deletePrivateRoom"] = "deletePrivateRoom";
    ChatEvents["disconnect"] = "disconnect";
    ChatEvents["error"] = "error";
})(ChatEvents || (exports.ChatEvents = ChatEvents = {}));
