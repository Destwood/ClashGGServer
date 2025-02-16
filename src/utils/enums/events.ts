export enum ChatEvents {
    joinRoom = 'joinRoom',
    message = 'message',
    history = 'history',
    createPrivateRoom = 'createPrivateRoom',
    addUserToPrivateRoom = 'addUserToPrivateRoom',
    updateUserList = 'updateUserList',
    updateRoomList = 'updateRoomList',
    removeUserFromPrivateRoom = 'removeUserFromPrivateRoom',
    deletePrivateRoom = 'deletePrivateRoom',
    disconnect = 'disconnect',
    error = 'error',
}
