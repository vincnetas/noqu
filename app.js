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
var sockets = {};
var displays = {};

function getClientQueue(socket) {
    var result = null;
    var keys = Object.keys(queues);
    for (var i = 0; i < keys.length; i++) {
        if (queues[keys[i]].clients[socket.id]) {
            result = queues[keys[i]];
            break;
        }
    }

    return result;
}

function getDisplayQueue(socket) {
    var result = null;
    var keys = Object.keys(queues);
    for (var i = 0; i < keys.length; i++) {
        if (queues[keys[i]].displays[socket.id]) {
            result = queues[keys[i]];
            break;
        }
    }

    return result;
}

function getSocketQueue(socket) {
    var result = null;
    var keys = Object.keys(queues);
    for (var i = 0; i < keys.length; i++) {
        if (queues[keys[i]].socketId == socket.id) {
            result = queues[keys[i]];
            break;
        }
    }

    return result;
}

io.on('connection', function (socket) {


    socket.on('connectClient', function (data, callback) {
        var queue = queues[data.queueId];
        var response = {
            connected: queue != null
        };

        if (response.connected) {
            queue.clients[socket.id] = socket;
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
        } else {
            response.errorMessage = "Queue with code " + data.queueId + " already connected";
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
        } else {
            response.errorMessage = "No queue with code " + data.queueId;
        }

        callback(response);
    });

    socket.on('newClient', function (data, callback) {
        var queue = getClientQueue(socket);
        var response = {
            connected: queue != null
        }

        if (response.connected) {
            queue.socket.emit('newClient', data);
        } else {
            response.errorMessage = "No queue for this client";
        }

        callback(response);
    });

    socket.on('queueState', function (data) {
        var queue = getSocketQueue(socket);

        if (queue != null) {
            var keys = Object.keys(queue.displays);
            for (var i = 0; i < keys.length; i++) {
                queue.displays[keys[i]].emit('queueState', data);
            }
        }
    });

    socket.on('disconnect', function () {
        var queue = getClientQueue(socket);
        if (queue) {
            delete queue.clients[socket.id];
        } else {
            queue = getSocketQueue(socket);
            if (queue) {
                delete queues[queue.id];
            } else {
                queue = getDisplayQueue(socket);
                if (queue) {
                    delete queue.displays[socket.id];
                }
            }
        }

    });
});