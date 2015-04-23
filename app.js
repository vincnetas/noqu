var host = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
var port = process.env.OPENSHIFT_NODEJS_PORT || '3000';

var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(port, host);

app.use(express.static(path.normalize(__dirname) + '/public'));

var queues = {};

function disconnectAll(list) {
    var keys = Object.keys(list);
    for (var i = 0; i < keys.length; i++) {
        list[keys[i]].emit("closeQueue", {});
    }
}

io.on('connection', function (socket) {

    socket.on('connectClient', function (data, callback) {
        var queue = queues[data.queueId];

        var response = {
            connected: queue != null
        };

        if (response.connected) {
            queue.clients[socket.id] = socket;
            socket.queue = queue;
            socket.onDisconnect = function () {
                delete queue.clients[socket.id];
            }
        } else {
            response.errorMessage = "No queue with code " + data.queueId;
        }

        callback(response);
    });

    socket.on('connectQueue', function (data, callback) {
        var queue = queues[data.queueId];
        var response = {
            connected: queue == null
        }

        if (response.connected) {
            queue = {
                id: data.queueId,
                clients: {},
                displays: {},
                socket: socket,
                socketId: socket.id
            }
            queues[data.queueId] = queue;
            socket.queue = queue;
            socket.onDisconnect = function () {
                disconnectAll(queue.clients);
                disconnectAll(queue.displays);
                delete queues[queue.id];
            }
        } else {
            response.errorMessage = "queue with code " + data.queueId + " already connected";
        }

        callback(response);
    });

    socket.on('connectDisplay', function (data, callback) {
        var queue = queues[data.queueId];
        var response = {
            connected: queue != null
        };

        if (response.connected) {
            queue.displays[socket.id] = socket;
            socket.queue = queue;
            socket.onDisconnect = function () {
                delete queue.displays[socket.id];
            }
        } else {
            response.errorMessage = "no queue with code " + data.queueId;
        }

        callback(response);
    });

    socket.on('newClient', function (data, callback) {
        socket.queue.socket.emit('newClient', data);
        callback({
            ok: true
        });
    });

    socket.on('queueState', function (data) {
        var keys = Object.keys(socket.queue.displays);
        for (var i = 0; i < keys.length; i++) {
            socket.queue.displays[keys[i]].emit('queueState', data);
        }

    });

    socket.on('closeQueue', function (data) {
        socket.onDisconnect();
    });

    socket.on('disconnect', function () {
        if (socket.onDisconnect) {
            socket.onDisconnect();
        }
    });
});