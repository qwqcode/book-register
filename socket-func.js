var ws = require('ws');
var fs = require('fs');

// 配置
var conf = {
    port: 51230 // 监听端口
};

// 实例化
var wss = new ws.Server(conf);

// Go it!
console.log('>> Listening...');

// 用户在线记录
var users = {};

// 发送全局广播
var broadcast = function (obj) {
    var jsonStr = JSON.stringify(obj);
    wss.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN)
            client.send(jsonStr);
    });
};

var danmaku = function (msg, mode, color) {
    return {
        type: 'danmaku',
        msg: msg,
        mode: mode || 2,
        color: color || '#FFFFFF'
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
    var id = req.headers['sec-websocket-key'];
    var currentUser = '无名英雄';

    // 接收消息事件
    var onMessage = function (data) {
        data = JSON.parse(data);
        switch (data['type']) {
            case 'register':
                currentUser = data['user'];
                users[id] = currentUser;
                // MSG
                console.log(currentUser + ' ['+ id +'] 已上线');
                broadcast(danmaku('[系统] 成员 ' + currentUser + ' 上线了', 2));
                break;

            case 'getOnline':
				var onlineStr = [];
                (function () {
                    for (var key in users) {
                        if (users.hasOwnProperty(key))
                            onlineStr.push(users[key]);
                    }
                })();
                var userCount = Object.keys(users).length;
                broadcast({
                    type: 'getOnline',
                    online_total: userCount,
                    online_users: users,
                    str: '目前在线 (' + userCount + ')：' + onlineStr.join(', ')
                });
                break;

            case 'broadcastDanmaku':
                broadcast(danmaku('[' + currentUser  + '] ' + data['msg'], data['mode'], data['color']));
                break;

            case 'logFrontendError':
                var msg = [
                    'Message: ' + data.msg,
                    'URL: ' + data.url,
                    'Line: ' + data.lineNo,
                    'Column: ' + data.columnNo,
                    'Error object: ' + data.errorObj
                ].join(' - ');

                msg = '[' + new Date().toLocaleString() + '][' + currentUser + '] ' + msg;

                fs.appendFile('storage/logs/frontend-err.log', msg + '\n', function (err) {
                    console.log('用户：' + currentUser + ' 的前端发生了一个错误');
                });
                break;

            default:
                send({'error': '(ÒωÓױ)！不明的请求参数'});
                return;
        }
    };

    // 关闭事件
    var onClose = function () {
        if (users.hasOwnProperty(id))
            delete users[id];

        // MSG
        console.log(currentUser + ' 下线');
        broadcast(danmaku('[系统] 成员 ' + currentUser + ' 下线了', 2));
    };

    // 绑定事件
    ws.on('message', function (data) {
        try { onMessage(data); } catch (e) { console.log('一个野生错误：' + e.toString()); }
    });
    ws.on('close', onClose);
});