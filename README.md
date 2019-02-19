# Book Register

<p align="center"><img src="./docs/logo.png"></p>

書記 是一个适用于学校图书室 多人协作共同完成图书录入任务 的在线工作站

数据存储到 MySQL 数据库，可以一键导出为 Excel

数据字段包含 `类目名` `编号` `书名` `出版社` `备注`

采用 PHP, Lumen Framework, NodeJS, WebSocket, jQuery, CSS3...

> 未经允许代码和衍生品不得用于商业用途，侵权必究

另外，也有 Android 移动版，您可以在手机上完成工作 [传送门](https://github.com/qwqcode/library-register-android)

# 特性
- 美观友好的 UI，Material Design
- 快速上手 简单的操作
- 多人协作 多人完成同一类目
- 实时弹幕 全局显示用户动作
- 在线监测 不活跃成员查看
- 自动补全 快速输入，快速定位，类似 Excel
- 数据统计 成员战绩分析
- 编辑器 操作提示
- 编辑器 数据实时更新，本地保存
- 导出 所有/单个 类目为一整个 .xls 文件
- 快速检索功能
- 有 API，可供第三方接入
- 运用 AJAX, Web Socket 等技术优化用户体验

# 环境要求
- [PHP](http://www.php.net/) >= 7.0
	- PHP 环境配置参考：[Lumen](https://laravel-china.org/docs/lumen/5.5/install/1899)
- [NodeJS](http://nodejs.cn/)
- [MySql](https://www.mysql.com/)

# 快速部署
```sh
git clone https://github.com/qwqcode/book-register.git
composer install

# 然后到 .env 里配置数据库连接，并执行：
php artisan key:generate
php artisan migrate

# 实时弹幕必须
nmp install
node socket-func

# 简易开发环境
php -S localhost:8000 -t public
```

> P.S. Windows Server 可下载 [NSSM](http://nssm.cc) 后执行项目中的 `socket-func-install.bat` 让 `node socket-func ` 持久运作

# 目录结构

## 前端

| 路径 | 描述 |
| :------: | :------: |
| [/public/js](/public/js) | 存放 JS 代码文件 |
| [/public/js/app.js](/public/js/app.js) | 实现前端 所有主要功能 |
| [/public/js/editor.js](/public/js/editor.js) | 实现前端 类目编辑器 功能 |
| [/public/js/app-help.js](/public/js/app-help.js) | 实现前端 操作提示 功能 |
| [/public/css](/public/css) | 存放 CSS 代码文件 |
| [/public/css/app.css](/public/css/app.css) | 前端界面样式表 |
| [/resources/views/index.blade.php](/resources/views/index.blade.php) | 总视图文件 |


## 后端

| 路径 | 描述 |
| :------: | :------: |
| [/.env](/.env.example) | 配置文件（数据库，密码相关） |
| [/app/Http/Controllers](/app/Http/Controllers) | 控制器存放目录 |
| [/app/Http/Controllers/ApiController.php](/app/Http/Controllers/ApiController.php) | 所有 Api 逻辑 |
| [/socket-func.js](/socket-func.js) | 弹幕服务器 相关代码 |
| [/socket-func-install.bat](/socket-func-install.bat) | 弹幕服务器 一键安装脚本 |
| [/socket-func-restart.bat](/socket-func-restart.bat) | 弹幕服务器 一键重启脚本 |
| [/database/migrations](/database/migrations) | 存放数据表结构相关 |

# 截图

<p align="center">
<img src="./docs/screenshots/latest/login.png">
<img src="./docs/screenshots/latest/category_list.png">
<img src="./docs/screenshots/latest/danmaku.gif">
<img src="./docs/screenshots/latest/editor.png">
<img src="./docs/screenshots/latest/inserter.gif">
<img src="./docs/screenshots/latest/autocomplete.gif">
<img src="./docs/screenshots/latest/editor-help.png">
<img src="./docs/screenshots/latest/danmaku-input.png">
<img src="./docs/screenshots/latest/danmaku-input-2.png">
<img src="./docs/screenshots/latest/ranking.png">
<img src="./docs/screenshots/latest/excel.png">
<img src="./docs/screenshots/latest/socket-func.png">
</p>

[历史版本截图](./docs/history.md)

# 版权

[書記](https://github.com/qwqcode/book-register) Copyright (C) 2018 [QWQCODE](http://www.qwqaq.com "Author Blog")

# 捐助
如果您觉得我的项目对您有帮助，并且您愿意给予我一点小小的支持，您可以通过以下方式向我捐赠，这样可以维持项目持续地发展，非常感谢！ヽ(•̀ω•́ )ゝ

If you are enjoying this app, please consider making a donation to keep it alive.

| Alipay | Wechat | 
| :------: | :------: | 
| <img width="150" src="./docs/donate/alipay.png"> | <img width="150" src="./docs/donate/wechat.png"> | 

捐赠者的名字将保存于 [捐赠者列表](https://github.com/qwqcode/donate-qwqaq)，非常感谢你们的支持
