const WebSocket = require('ws');

const port = 5000;
const wss = new WebSocket.Server({ port }, () => {
    console.log(`Server started on ws://localhost:${port}`);
});

// Rooms management and user management
const rooms = []; // To manage rooms
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
// console.log(message)
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
            handleDeleteRoom(message.room, ws);
            break;

        case 'disconnect':
            handleDisconnect(ws);
            break;

        default:
            console.log(`Unknown event: ${message.event}`);
    }
    broadcastRoomList()
}

function handleJoinRoom(msg, ws) {
    const { room, user } = msg;


    if (!rooms[room]) {
        console.log('creating room', !!msg.user2)
        if(msg.user2) {
            rooms[room] = {
                users: [],
                messages: [],
                type: 'direct'
            };
        } else {
            rooms[room] = {
                users: [],
                messages: [],
                type: 'privateRoom'
            };
        }
    }

    // Перевіряємо, чи користувач вже є у списку
    const userExists = rooms[room].users.some(client => client.user.id === user.id);

    if (!userExists) {
        rooms[room].users.push({ ws, user });
    }

    // Надсилаємо історію повідомлень клієнту
    ws.send(JSON.stringify({
        event: 'history',
        room,
        messages: rooms[room].messages,
        type: rooms[room].type,
    }));

    // Оновлюємо список користувачів для всіх у кімнаті

}

function handleSendMessage(messageObj, ws) {
    const { room, message, user } = messageObj;
    if (rooms[room]) {
        // Додаємо повідомлення до історії цієї кімнати
        const messageData = {
            event: 'message',
            room,
            user,
            message,
            id: Date.now(),
            date: new Date().toISOString()
        };
        rooms[room].messages.push(messageData); // Додаємо повідомлення в історію

        // Відправляємо повідомлення всім користувачам у кімнаті
        rooms[room].users.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                console.log('sending response')
                client.ws.send(JSON.stringify(messageData));
            }
        });
    }
}

function handleCreatePrivateRoom(message, ws) {
    const {room: roomName, userData: user} = message;

    // Якщо кімнати з таким ім'ям ще не існує, створюємо її
    if (!rooms[roomName]) {
        rooms[roomName] = {
            users: [{ ws, user }],
            creator: user,
            messages: []
        };
        console.log(`Private room ${roomName} created by ${user.username}.`);

        // Відправляємо підтвердження створення кімнати
        // ws.send(JSON.stringify({ event: 'createPrivateRoom', room: roomName }));

        // Оновлюємо список кімнат
    } else {
        // Якщо кімната вже існує, відправляємо помилку
        ws.send(JSON.stringify({ event: 'error', message: 'Room already exists' }));
    }
}

function handleAddUserToPrivateRoom(message, ws) {
    const {roomName, userId} = message;
    if (rooms[roomName]) {
        // Перевіряємо, чи користувач ще не є в кімнаті
        const userExists = rooms[roomName].users.some(client => client.user.id === userId);
        if (!userExists) {
            // Додаємо нового користувача за його ID
            const user = { id: userId }; // Можна отримати дані користувача, якщо потрібно

            // Додаємо користувача до кімнати
            rooms[roomName].users.push({ ws, user });

            console.log(`User with ID ${userId} added to private room: ${roomName}`);

            // Оновлюємо список користувачів у кімнаті

            // Надсилаємо всім користувачам кімнати повідомлення про додавання нового користувача
            rooms[roomName].users.forEach((client) => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({ event: 'addUserToPrivateRoom', room: roomName, userId }));
                }
            });
        }
    }
}

function handleRemoveUserFromPrivateRoom(message, ws) {

    const {roomName, user} = message;
    if (rooms[roomName]) {
        rooms[roomName].users = rooms[roomName].users.filter(client => client.user.id !==  user.id);
        console.log(`${user.username} removed from private room: ${roomName}`);
        console.log(rooms[roomName].users);
    }
}

function handleDeleteRoom(roomName, ws) {
    delete rooms[roomName];
}

function handleDisconnect(ws) {
    // Find the user and remove them from the users object
    Object.keys(users).forEach((userId) => {
        if (users[userId].ws === ws) {
            delete users[userId];
            console.log(`User disconnected: ${userId}`);
        }
    });

    // Iterate over each room and remove the WebSocket connection from each room
    Object.keys(rooms).forEach((roomName) => {
        rooms[roomName].users = rooms[roomName].users.filter(client => client.ws !== ws);

        // If the room has no more users, you may want to remove the room itself
        if (rooms[roomName].users.length === 0 && roomName !== "global") {
            delete rooms[roomName];
            console.log(`Room ${roomName} removed as no users are present.`);
        }
    });

    // Close the WebSocket connection
    ws.close();
    console.log('Connection closed.');
}

function broadcastRoomList() {

    const roomList = Object.keys(rooms).map(roomName => ({
        name: roomName,
        ...rooms[roomName], // додаємо всі властивості кімнати
    }));

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ event: 'updateRoomList', rooms: roomList }));
        }
    });
}




