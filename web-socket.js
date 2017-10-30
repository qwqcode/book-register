var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var wss = new WebSocketServer({
	port: 51230
});

var users = [];

wss.on('connection', function (ws, req) {
	var userName = '';

    console.log('Cclient connected + 1');

    ws.on('message', function (msg) {
    	/*if (message.indexOf('/newUser') === 0) {
    		var userArray = message.split(' ');
    		userName = message;
    	}*/
    	if (msg === '__getUsers') {
    		var onlineStr = '';
    		for (var i in users) {
    			onlineStr += users[i] + ', ';
    		}
        	sendMsgForEach('目前在线 (' + users.length + ')：' + onlineStr);
			return;
    	}
    	userName = msg;
    	if (users.indexOf(userName) <= -1)
    		users.push(userName);
    	sendMsgForEach(userName + ' 已上线');
        console.log(userName + ' 已上线');
    });

    ws.on('close', function () {
    	var index = users.indexOf(userName);
    	if (index > -1)
    		users.splice(index, 1);

    	sendMsgForEach(userName + ' 下线');
		console.log(userName + ' 下线');
	});

	ws.send('(*´▽｀)ノノ Hello');
});

function sendMsgForEach(msg) {
	wss.clients.forEach(function each(client) {
    	if (client.readyState === WebSocket.OPEN) {
      		client.send(msg);
    	}
  	});
}