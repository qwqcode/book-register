var WebSocket = require('ws');

// 配置
var conf = {
    port: 51230 // 监听端口
};

// 实例化
var wss = new WebSocket.Server(conf);

// Go it!
console.log('>> Listening...');

// 用户在线记录
var users = [];

// 发送全局广播
var broadcast = function (obj) {
    var jsonStr = JSON.stringify(obj);
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN)
            client.send(jsonStr);
    });
};

// level: s, e, i, w
var notify = function (msg, level) {
    if (level === undefined)
        level = 'i';

    return {
        type: 'notify',
        msg: msg,
        level: level
    };
};

// 单个用户连接事件
wss.on('connection', function (ws, req) {
    var send = function (data) {
        ws.send(JSON.stringify(data));
    };

    // 发送欢迎信息
    send({type: 'hello', hello: '(*´▽｀)ノノ 连接实时服务器成功'});

    console.log('Client Connected + 1');

    // 当前用户标识
    var currentUser = '';

    // 接收消息事件
    var onMessage = function (data) {
        data = JSON.parse(data);
        switch (data['type']) {
            case 'register':
                currentUser = data['user'];
                users.indexOf(currentUser) <= -1 ? users.push(currentUser) : null;
                // MSG
                console.log(currentUser + ' 已上线');
                broadcast(notify('成员 ' + currentUser + ' 已上线', 'i'));
                break;

            case 'getOnline':
				var onlineStr = users.join(', ');
                broadcast({
                    type: 'getOnline',
                    online_total: users.length,
                    online_users: users,
                    str: '目前在线 (' + users.length + ')：' + onlineStr
                });
                break;

            case 'broadcastNotify':
                broadcast(notify(currentUser  + ' 说：\n' + data['msg'], 'i'));
                break;

            default:
                send({'error': '(ÒωÓױ)！不明的请求参数'});
                return;
        }
    };

    // 关闭事件
    var onClose = function () {
        var index = users.indexOf(currentUser);
        index > -1 ? users.splice(index, 1) : null;
        // MSG
        console.log(currentUser + ' 下线');
        broadcast(notify('成员 ' + currentUser + ' 下线了', 'w'));
    };

    // 绑定事件
    ws.on('message', function (data) {
        try { onMessage(data); } catch (e) { console.log('一个野生错误：' + e.toString()); }
    });
    ws.on('close', onClose);
});