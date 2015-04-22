var host = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
var port = process.env.OPENSHIFT_NODEJS_PORT || '3000';

var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    path: '/socket.io-client'
});
io.set('transports', ['websocket']);

server.listen(port, host);

app.use(express.static(path.normalize(__dirname) + '/public'));

io.on('connection', function (socket) {
    socket.emit('news', {
        hello: 'world'
    });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});