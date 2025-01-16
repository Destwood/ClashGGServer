const Index = require('ws');
const { v4: uuidv4 } = require('uuid');

const port = 5000;
const wss = new Index.Server({ port }, () => {
    console.log(`Server started on ws://localhost:${port}`);
});

// Global rooms and users management
const rooms = {
    global: {
        id: 'global',
        name: 'global',
        activeUsers: [], // Active users in the room
        allUsers: [], // All users who have ever joined the room
        messages: [], // Messages exchanged in the room
        type: 'public' // Public or private
    }
};
const users = {}; // To track users

wss.on('connection', (ws) => {
    console.log('New client connected');

    // When a message is received from the client
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        handleEvent(parsedMessage, ws);
    });

    // Handle client disconnect
    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

// Event handling based on the ChatEvents enum
function handleEvent(message, ws) {
    console.log('\n\n\n')
    console.log(message.event)
    switch (message.event) {
        case 'joinRoom':
            handleJoinRoom(message, ws);
            break;

        case 'message':
            handleSendMessage(message, ws);
            break;

        case 'createPrivateRoom':
            handleCreatePrivateRoom(message, ws);
            break;

        case 'addUserToPrivateRoom':
            handleAddUserToPrivateRoom(message, ws);
            break;

        case 'removeUserFromPrivateRoom':
            handleRemoveUserFromPrivateRoom(message, ws);
            break;

        case 'deletePrivateRoom':
            handleDeleteRoom(message, ws);
            break;

        case 'disconnect':
            handleDisconnect(ws);
            break;

        default:
            console.log(`Unknown event: ${message.event}`);
    }
    console.log('73', Object.keys(rooms))
}

function handleJoinRoom(msg, ws) {
    const { room, user, user2, roomId } = msg;

    broadcastRoomList(user)
    let roomData = room === 'global'
        ? rooms.global
        : Object.values(rooms).find(r => r.id === room);

    Object.values(rooms).forEach(r => {
        r.activeUsers = r.activeUsers.filter(client => client.ws !== ws);
    });

    if(!roomData) {
        roomData = handleCreatePrivateRoom(msg, ws);
    }

    const userExistsInGlobal = rooms.global.allUsers.some(client => client.userData.id === user.id);

    if (!userExistsInGlobal) {
        rooms.global.allUsers.push({ ws, userData: user });
        rooms.global.activeUsers.push({ ws, userData: user });
        broadcastRoomList(user);

        Object.values(rooms).forEach(r => {
            if (r.type === 'direct') {
                broadcastRoomUsers(r.id);
            }
        });
    }

    if (!roomData.activeUsers.some(client => client.ws === ws)) {
        roomData.activeUsers.push({ userData: user, ws });
    }

    // Надсилаємо історію повідомлень
    ws.send(JSON.stringify({
        event: 'history',
        roomId: roomData.id,
        roomName: roomData.name,
        messages: roomData.messages,
        type: roomData.type,
    }));

    broadcastRoomUsers(roomData.id);
}


function handleCreatePrivateRoom(message, ws) {
    const { room, user, user2, roomId } = message;
    const id = roomId || uuidv4();
    let roomData;

    if (user2) {
        roomData = {
            id: room,
            name: room,
            activeUsers: [{ user, ws}],
            allUsers: [{ userData: user }, { userData: user2 }],
            messages: [],
            type: 'direct'
        };
    } else {
        roomData = {
            id: id,
            name: room,
            activeUsers: [{ ws, userData: user }],
            allUsers: [{ ws, userData: user }],
            creator: user,
            messages: [],
            type: 'privateRoom'
        };
    }

    rooms[id] = roomData;
    console.log(`Room "${room}" created with ID: ${rooms[id].id}`);
    console.log('this room: ', rooms[id])
    broadcastRoomList(user);
    return roomData;
}

function handleSendMessage(messageObj, ws) {
    const { roomId, message, user } = messageObj;
    const roomData = Object.values(rooms).find(r => r.id === roomId);

    if (roomData) {
        const messageData = {
            event: 'message',
            roomId: roomData.id,
            user,
            message,
            id: Date.now(),
            date: new Date().toISOString()
        };

        console.log('message to send, ', messageData)
        console.log('room data, ', roomData)
        roomData.messages.push(messageData);

        // Надсилаємо повідомлення всім активним користувачам у кімнаті
        roomData.activeUsers.forEach(client => {
            if (client.ws.readyState === Index.OPEN) {
                client.ws.send(JSON.stringify(messageData));
            }
        });
    } else {
        console.log(`SendMsg - Room with ID ${roomId} not found.`, messageObj);
    }
}

function handleAddUserToPrivateRoom(message, ws) {
    const { room: roomId, userId } = message;
    if (!userId) {
        console.error('Invalid user data in аddUserToPrivateRoom:', userId);
        return;
    }

    if (rooms[roomId]) {
        const userExistsInAllUsers = rooms[roomId].allUsers.some(client => client.userData.id === userId);

        // prevent adding same user all over again
        if (!userExistsInAllUsers) {
            const user = rooms.global.allUsers.find(client => client.userData.id === userId);
            console.log('if we will add user', user)
            if(!user) {
                console.log('cant add user that is not logged')
                return;
            }
            rooms[roomId].allUsers.push({ ws, userData: user.userData });
            broadcastRoomList({ id: userId });
            console.log(`User with ID ${userId} added to room: ${roomId}`);
        } else {
            console.log(`User with ID ${userId} already in a room`);

            const messageData = {
                event: 'error',
                errorMsg: `User already in a room`,
            };
            ws.send(JSON.stringify(messageData));
        }

    } else {
        console.error(`AddUserToRoom - Room with ID ${roomId} does not exist.`);
    }
}

function handleRemoveUserFromPrivateRoom(message, ws) {
    const { roomId, user } = message;
    console.log(message)
    if (rooms[roomId]) {
        console.log(`215 removing user ${user.username} from ${roomId}`)
        rooms[roomId].allUsers = rooms[roomId].allUsers.filter(client => client.userData.id !== user.id);
        rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter(client => client.userData.id !== user.id);

        console.log(`${user.username} removed from room: ${roomId}`);

        if (rooms[roomId].creator && rooms[roomId].creator.id === user.id) {
            const newCreator = rooms[roomId].allUsers[0]?.userData;
            if (newCreator) {
                rooms[roomId].creator = newCreator;
                console.log(`New creator for room ${roomId} is ${newCreator.id}`);

                rooms[roomId].activeUsers.forEach(client => {
                    if(client && client.ws && client.ws.readyState === Index.OPEN) {
                        broadcastRoomList(client.userData);
                    }
                })
            } else {
                delete rooms[roomId];
                console.log(`Room ${roomId} deleted because it has no users.`);
            }
        }
    }

    broadcastRoomList(user);
}

function handleDeleteRoom(message, ws) {
    const { room: roomId } = message;
    const allClients = [...rooms[roomId].allUsers];
    if (rooms[roomId]) {
        delete rooms[roomId];
    }
    allClients.forEach(user => {
        broadcastRoomList(user.userData);
    });
}

function handleDisconnect(ws) {
    Object.keys(rooms).forEach(roomId => {
        if (rooms[roomId] && rooms[roomId].activeUsers) {
            rooms[roomId].activeUsers = rooms[roomId].activeUsers.filter(client => client.ws !== ws);
            rooms[roomId].allUsers = rooms[roomId].allUsers.filter(client => client.ws !== ws);

            if (rooms[roomId].activeUsers.length === 0 && roomId !== "global") {
                delete rooms[roomId];
                console.log(`249 Room ${roomId} removed as no users are present.`);
            }
        } else {
            console.log(`252Room ${roomId} or its activeUsers list is undefined.`);
        }
    });

    if (ws.readyState === Index.OPEN) {
        ws.close();
    }
    console.log('259Connection closed.');
}

function broadcastRoomList(user = null) {
    // Створюємо об'єкт, який містить лише кімнати, де є переданий користувач
    const activeRooms = {};

    if (user) {
        Object.entries(rooms).forEach(([roomId, room]) => {
            const isUserInRoom = room.allUsers.some(client => {
                return client.userData.id === user.id;
            });
            if (isUserInRoom) {
                activeRooms[roomId] = room;
            }
        });
    }

    const payload = JSON.stringify({ event: 'updateRoomList', rooms: activeRooms });

    if (user) {
        const client = Object.values(rooms).flatMap(room => room.allUsers)
            .find(client => client.userData.id === user.id);

        if (client && client.ws && client.ws.readyState === Index.OPEN) {
            client.ws.send(payload);
        }
    }
}

function broadcastRoomUsers(roomId) {
    const room = Object.values(rooms).find(r => r.id === roomId); // Знаходимо кімнату за roomId

    if (room) {
        room.activeUsers.forEach(client => {
            if (client && client.ws && client.ws.readyState === Index.OPEN) {
                const message = {
                    event: 'updateUserList',
                    roomId: room.id,
                    roomName: room.name,
                    users: room.allUsers,
                    allUsers: rooms.global.allUsers,
                }
                console.log('before users in room broadcast', room.allUsers)
                console.log(message)
                client.ws.send(JSON.stringify(message));
            } else {
                console.error('Client or Index is invalid:', client);
            }
        });
    } else {
        console.log(`Broadcast - Room with ID ${roomId} not found.`);
    }
}

