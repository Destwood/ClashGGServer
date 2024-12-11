const ws = require('ws');

const port = 5000;
const wss = new ws.Server({ port }, () => {
    console.log(`Server started on ${port}`);
});

const rooms = {
    room1: [],
    room2: [],
};

wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (msg) => {
        const message = JSON.parse(msg);

        switch (message.event) {
            case 'joinRoom':
                currentRoom = message.room;
                ws.room = currentRoom;
                ws.send(JSON.stringify({ event: 'history', data: rooms[currentRoom] }));
                break;

            case 'message':
                if (currentRoom) {
                    rooms[currentRoom].push(message);
                    broadcastMessage(message, currentRoom);
                }
                break;
        }
    });
});

function broadcastMessage(message, room) {
    wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && client.room === room) {
            client.send(JSON.stringify(message));
        }
    });
}
