var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/config');
require('./models/queue');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(config.port, config.host);

app.use(express.static(path.normalize(__dirname) + '/public'));

var connect = function () {
    var options = {
        server: {
            socketOptions: {
                keepAlive: 1
            }
        }
    };
    mongoose.connect(config.db, options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

var queueHandler = require("./queue");

io.on('connection', function (socket) {
    queueHandler(socket);
});