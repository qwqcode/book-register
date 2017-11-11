# Book Register

<p align="center"><img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/logo.png"></p>

書記 是一个适用于学校图书室 多人协作共同完成图书录入任务 的在线工作站

数据存储到 MySQL 数据库，可以一键导出为 Excel

数据字段包含 `类目名` `编号` `书名` `出版社` `备注`

> 旨在完成图书室书籍录入任务... 无聊做做项目练练手 (￣▽￣")

采用 PHP, Lumen Framework, NodeJS, WebSocket, ...

# Features
- 快速上手
- 多人协作
- 实时弹幕
- 在线监测
- 自动填充
- 数据统计
- 导出 Excel
- Web Socket
- API
- AJAX

# Requirements
- [PHP](http://www.php.net/) >= 7.0
- [NodeJS](http://nodejs.cn/)
    - [ws](https://github.com/websockets/ws)

# Quick Start
```sh
git clone https://github.com/Zneiat/book-register.git
composer install

php -r "copy('.env.example', '.env');"
# 然后到 .env 里配置数据库连接

php artisan key:generate
php artisan migrate

# 实时弹幕必须
node socket-func
npm i ws --save

# DEV
php -S localhost:8000 -t public
```

> P.S. Windows Server 可下载 [NSSM](http://nssm.cc) 后执行项目中的 `socket-func-install.bat` 让 `node socket-func ` 持久运作

# License
MIT

# Author
[ZNEIAT](https://github.com/Zneiat)

# Screenshots

### 2017-11-11
<p align="center">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/login.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/category_list.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/danmaku.gif">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/editor.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/inserter.gif">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/autocomplete.gif">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/ranking.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-11-11/socket-func.png">
</p>

### 2017-10-28
<p align="center">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-28-1.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-28-2.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-28-3.png">
</p>

### 2017-10-23
<p align="center">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-23-1.png">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-23-2.png">
</p>

### 2017-10-6
<p align="center">
<img src="https://raw.githubusercontent.com/Zneiat/book-register/master/docs/screenshots/2017-10-6-1.png">
</p>