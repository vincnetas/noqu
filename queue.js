var mongoose = require('mongoose');
var Queue = mongoose.model('Queue');
var queues = [];
var accessTokens = {};
var _ = require('lodash');


function disconnectAll(list) {
    var keys = Object.keys(list);
    for (var i = 0; i < keys.length; i++) {
        list[keys[i]].emit("closeQueue", {});
    }
}

function getQueue(queueId, callback) {
    if (accessTokens[queueId]) {
        queueId = accessTokens[queueId];
    }

    var queue = queues[queueId];
    if (!queue) {
        Queue.findOne({
            _id: queueId
        }, function (err, queue) {
            if (!err) {
                queue.registers = [];
                queue.kiosks = [];
                queue.displays = [];
                queues[queueId] = queue;

                callback(null, queue);
            } else {
                callback(err);
            }
        });
    } else {
        callback(null, queue);
    }
}

function forEach(list, callback) {
    var keys = Object.keys(list);
    for (var i = 0; i < keys.length; i++) {
        callback(list[keys[i]]);
    }
}

module.exports = function (socket) {

    socket.on('createQueue', function (data, callback) {
        var queue = new Queue({
            topics: data.topics
        });
        queue.save(function (err, queue) {
            if (err) {
                callback(false);
            } else {
                callback({
                    queueId: queue._id
                });
            }
        });
    });

    socket.on('connectQueue', function (data, callback) {
        getQueue(data.queueId, function (err, queue) {
            if (err) {
                callback(false);
            } else {
                socket.queue = queue;
                queue.registers[socket.id] = socket;
                socket.onDisconnect = function () {
                    delete queue.registers[socket.id];
                }

                callback({
                    clients: queue.clients,
                    queueId: queue.id
                });
            }
        });
    });


    socket.on('connectClient', function (data, callback) {
        getQueue(data.queueId, function (err, queue) {
            if (err) {
                callback(false);
            } else {
                socket.queue = queue;
                queue.kiosks[socket.id] = socket;
                socket.onDisconnect = function () {
                    delete queue.kiosks[socket.id];
                }

                callback({
                    topics: queue.topics,
                    queueId: queue.id
                });
            }
        });
    });

    socket.on('connectDisplay', function (data, callback) {
        getQueue(data.queueId, function (err, queue) {
            if (err) {
                callback(false);
            } else {
                socket.queue = queue;
                queue.displays[socket.id] = socket;
                socket.onDisconnect = function () {
                    delete queue.displays[socket.id];
                }

                callback({
                    clients: queue.clients,
                    queueId: queue.id
                });
            }
        });
    });

    function notifyQueueUpdate(queue) {
        forEach(queue.registers, function (socket) {
            socket.emit('queueUpdate', {
                clients: queue.clients
            });
        });
        forEach(queue.displays, function (socket) {
            socket.emit('queueUpdate', {
                clients: queue.clients
            });
        });
    }

    function updateQueue(queue, callback) {
        queue.save(function (err, queue) {
            if (err) {
                callback(false);
            } else {
                notifyQueueUpdate(queue);

                callback(true);
            }
        });
    }
    
    function getClientNumber(client, queue) {
        var index = _.findIndex(queue.topics, 'id', client.topic.id);
        if (index != -1) {
            topic = queue.topics[index];
            topic.counter++;
            
            if (topic.counter > 99) {
                topic.counter = 0;
            }
            
            return (index + 1) + _.padLeft("" + topic.counter, 2, '0');
        }
        
        return -1;
    }

    socket.on('newClient', function (client, callback) {
        var queue = socket.queue;
        client.number = getClientNumber(client, queue);
        queue.clients.push(client);
        updateQueue(queue, function(result) {
            if (result) {
                callback({
                    number: client.number
                });
            } else {
                callback(result);
            }
        });
    });

    socket.on('deleteClient', function (client, callback) {
        var queue = socket.queue;
        var index = _.findIndex(queue.clients, 'id', client.id);
        if (index > -1) {
            queue.clients.splice(index, 1);
            updateQueue(queue, callback);
        }
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

    socket.on('getAccessToken', function (data, callback) {
        var validTime = 30000;
        var token = "" + Math.round(Math.random() * 1000);
        accessTokens[token] = socket.queue.id;
        setTimeout(function () {
            delete accessTokens[token];
        }, validTime);
        callback({
            token: token,
            validTime: validTime
        });
    });
}