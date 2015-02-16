
var port = parseInt(process.argv[2]);

var STATUS = Object.freeze({IDLE: 1, BUSY:2, OFF: 0});


if(isNaN(port)) {
    port = 8091;
}

console.log('SocketServer listens on '+port);

var io = require('socket.io').listen(port);

io.sockets.on('connection', function (socket) {

    var status = STATUS.IDLE;

    socket.on('getNodeStatus', function (data) {

        console.log('received getNodeStatus');
        data['status'] = status;
        socket.emit('nodeStatus', data);
        console.log('sent nodeStatus');

    });

});