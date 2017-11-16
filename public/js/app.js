/* Zneiat/book-register */
"use strict";

$(document).ready(function () {
    if (!app.checkRequirements())
        return;

    app.router.register();
    app.data.register();
    app.main.register();
    app.editor.register();
    app.danmaku.register();
    app.socket.register();

    app.notify.info('程序初始化完毕');
    app.notify.setShowEnabled(true);

    app.loadingLayer.hide();

    appHelp.init();
});

var app = {
    PROJECT_LINK: 'https://github.com/Zneiat/book-register',
    AUTHOR_LINK: 'https://github.com/Zneiat',

    // 浏览器环境要求
    checkRequirements: function () {
        if (!!window.ActiveXObject || "ActiveXObject" in window) {
            // IE 浏览器升级提示
            alert('浏览器过时，请升级浏览器');
            window.location.href='/upgrade-browser.html';
            return false;
        }

        if (!window.localStorage) {
            alert('浏览器不支持 localStorage 请更换浏览器！');
            return false;
        }

        return true;
    },

    // Loading
    loadingLayer: {
        _sel: '.loading-layer',
        show: function (text) {
            var loadingElem = $(this._sel);
            loadingElem.find('.loading-layer-text').html(text || '加载中...');
            loadingElem.show();
        },
        hide: function () {
            $(this._sel).hide();
        }
    }
};

/**
 * Router
 */
app.router = {
    routes: [],
    currentPath: '',

    register: function () {
        window.addEventListener('load', this.refresh.bind(this), false);
        window.addEventListener('hashchange', this.refresh.bind(this), false);
        this.initRoutes();
    },

    initRoutes: function () {
        app.router.addRoute('home', '/', function() {
            var editor = app.editor.instance;
            if (editor !== null) {
                editor.exit();
                console.log('返回首页');
            }
        });

        app.router.addRoute('category', '/category/:name', function(args) {
            var categoryName = args['name'];
            var editor = app.editor.instance;
            if (editor !== null && editor.category.name !== categoryName) {
                editor.exit();
                console.log('退出类目' + editor.category.name);
            }
            app.main.categoryList.goToWork(categoryName);
            console.log('进入类目页 ' + categoryName);
        });
    },

    addRoute: function (name, path, callback) {
        var keys = [];

        this.routes.push({
            path: (function (path, keys) {
                path = path
                    .concat('/?')
                    .replace(/\/\(/g, '(?:/')
                    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional){
                        if (_ === "*"){
                            keys.push(undefined);
                            return _;
                        }

                        keys.push(key);
                        slash = slash || '';
                        return ''
                            + (optional ? '' : slash)
                            + '(?:'
                            + (optional ? slash : '')
                            + (format || '') + (capture || '([^/]+?)') + ')'
                            + (optional || '');
                    })
                    .replace(/([\/.])/g, '\\$1')
                    .replace(/\*/g, '(.*)');
                return new RegExp('^' + path + '$', 'i');
            })(path, keys), // new RegExp("^" + path.replace(/:[^\s/]+/g, '([\\w\\W]+)') + "$")
            argKeys: keys,
            action: callback
        });
    },

    redirect: function (path) {
        if (path.slice(0, 1) !== '/')
            path = '/' + path;

        location.hash = '#' + path;
    },

    refresh: function () {
        this.currentPath = decodeURIComponent(location.hash.slice(1)) || '/';

        for (var i = 0, l = this.routes.length; i < l; i++) {
            var routes = this.routes[i];
            var found = this.currentPath.match(routes.path);
            if (found) {
                /*console.log("module: " + routes.action);
                console.log("args:", found.slice(1));*/
                var args = {};
                var argsVals = found.slice(1);
                for (var argsI = 0; argsI < routes.argKeys.length; argsI++) {
                    args[routes.argKeys[argsI]] = argsVals[argsI];
                }
                this.routes[i].action(args);
                break; // Ignore the rest of the paths
            }
        }
    }
};

/**
 * Data
 */
app.data = {
    register: function () {},

    setUser: function (val) {
        localStorage.setItem('user', $.trim(val));
    },
    getUser: function () {
        return localStorage.getItem('user');
    },
    clearUser: function () {
        localStorage.removeItem('user');
    },

    // Key = 类目名
    categories: {},

    uploadBooks: function (onSuccess) {
        app.api.uploadCategory(onSuccess);
    }
};

/* Main */
app.main = {
    _elem: $(),
    _wrapElem: $(),

    login: {},
    categoryList: {},

    register: function () {
        this._elem = $('.main');
        this._wrapElem = $('.main-wrap');

        this.initLogin();
        this.initCategoryList();

        this.show();
    },

    show: function () {
        this._wrapElem.show();

        app.router.redirect('/');
    },

    hide: function () {
        this._wrapElem.hide();
    },

    toggleCategoryList: function (userName) {
        app.data.setUser(userName);
        this._elem.addClass('large-size');
        this.categoryList.refreshList();

        // keep last
        app.socket.connect();
    },

    toggleLogin: function () {
        this._elem.removeClass('large-size');
        this.login.setYourNameVal(app.data.getUser());

        app.socket.close();
    },

    isToggledLogin: function () {
        return !this._elem.hasClass('large-size');
    }
};

app.main.initLogin = function () {
    var _login = this.login;
    var _loginElem = $('.main-login');
    var _loginFormElem = _loginElem.find('.main-login-form');
    var _yourNameElem = _loginFormElem.find('#yourName');

    var _user = app.data.getUser();

    // 自动填充
    if (!!_user)
        _yourNameElem.val(_user);

    _loginFormElem.submit(function () {
        var yourNameVal = $.trim(_yourNameElem.val());

        if (yourNameVal.length < 1 || !/^[\u4e00-\u9fa5]{2,4}$/.test(yourNameVal)) {
            app.notify.warning('请填入你的真实姓名');
            return false;
        }

        app.notify.info('欢迎使用 書記 Online');
        app.main.toggleCategoryList(yourNameVal);

        return false;
    });

    _login.setYourNameVal = function (value) {
        _yourNameElem.val(value);
    };
};

app.main.initCategoryList = function () {
    var _categoryList = this.categoryList;
    var _listElem = $('.main-category-list');
    var _headElem = _listElem.find('.main-category-list-head');
    var _listContentElem = _listElem.find('.main-category-list-content');

    _categoryList.goToWork = function (categoryName) {
        _categoryList.setLoading(true);
        app.api.getCategoryBooks(categoryName, function () {
            // 刷新类目列表
            _categoryList.refreshListFromObj();
            _categoryList.setLoading(false);

            // 打开工作
            app.socket.broadcastDanmaku('已进入类目 ' + categoryName, 4, '#2196f3');
            app.editor.startWork(app.data.categories[categoryName]);
        }, function () {
            _categoryList.setLoading(false);
            app.notify.error('无法打开该类目');
        });
    };

    (function headPart() {
        var onlineUsers = '';

        // User Logout
        _headElem.find('[data-toggle="user-logout"]').click(function () {
            app.dialog.build('改变身份', '确定要改变自己的身份？', ['确定', function () {
                app.main.toggleLogin();
                app.data.clearUser();
            }], ['取消', null]);
        });

        // Show Ranking
        _headElem.find('.book-count').click(function () {
            app.main.showRanking();
        });

        // Create Category Btn
        _headElem.find('[data-toggle="create-category"]').click(function () {
            app.main.createCategoryDialog();
        });

        // Refresh Data Btn
        _headElem.find('[data-toggle="refresh-data"]').click(function () {
            _categoryList.refreshList();
        });

        // Upload Books
        _headElem.find('[data-toggle="upload-books"]').click(function () {
            app.data.uploadBooks();
        });

        // Category Search
        _headElem.find('.list-search > input').bind('input propertychange', function() {
            var value = $.trim($(this).val());
            if (value.length > 0) {
                var categoryData = [];
                for (var key in app.data.categories) {
                    if (!app.data.categories.hasOwnProperty(key)) continue;
                    var item = app.data.categories[key];
                    if ($.trim(item.name).toUpperCase().indexOf(value.toUpperCase()) >= 0) {
                        categoryData[key] = item;
                    }
                }
                _categoryList.refreshListFromObj(categoryData);
            } else {
                _categoryList.refreshListFromObj();
            }
        }).focus(function () {
            $(this).select();
        });

        // Current Online
        _headElem.find('.current-online').click(function () {
            if (onlineUsers.length > 0)
                app.dialog.build('在线成员', onlineUsers);
        });

        _categoryList.setHeadOnline = function (num, str) {
            _headElem.find('.current-online').text('在线：' + num);
            onlineUsers = str;
        };
    })();

    (function ListPart() {
        _categoryList.setLoading = function (isLoading) {
            var el = _listElem.find('.main-category-list-loading');
            isLoading ? el.show() : el.hide();
        };

        _categoryList.refreshList = function (onAfter) {
            _categoryList.setLoading(true);

            app.api.getCategory(function () {
                _categoryList.refreshListFromObj();
                _categoryList.setLoading(false);
                !!onAfter ? onAfter() : null;
            }, function () {
                _categoryList.setLoading(false);
            });

            (function updateUserInfo() {
                var bookCountElem = _headElem.find('.user .book-count');
                var todayCountElem = _headElem.find('.user .today-count');

                var user = app.data.getUser();
                if (!user) return;

                _headElem.find('.user .username').text(user);
                bookCountElem.text('战绩：加载中...');
                todayCountElem.text('今日：加载中...');
                app.api.getUser(user, function (data) {
                    bookCountElem.text('战绩：' + data['user_book_total'] + ' 本');
                    todayCountElem.text('今日：' + data['user_book_today_total'] + ' / '+ data['site_book_today_total']);
                }, function () {
                    bookCountElem.text('战绩：获取失败');
                });
            })();
        };

        _categoryList.refreshListFromObj = function (categoryData) {
            var categories = categoryData || app.data.categories;

            _listContentElem.html('');

            // 我负责的
            var filterAppend = function (getMine) {
                for (var categoryName in categories) {
                    if (!categories.hasOwnProperty(categoryName)) continue;
                    var item = categories[categoryName];
                    if (getMine && !item.isMine()) continue;
                    if (!getMine && item.isMine()) continue;
                    _categoryList.itemRender(categoryName, item)
                        .appendTo(_listContentElem);
                }
            };

            filterAppend(true); // 我负责的类目添加到列表
            filterAppend(false); // 非我负责的

            //_listContentElem.scrollTop(0); // 滚动归零
        };

        _categoryList.itemRender = function (index, category) {
            var categoryName = category['name'] || '';

            if (categoryName.length <= 0) return;

            var itemElem = $(
                '<div class="item col-sm-6 col-md-3' + (category.isMine() ? ' is-mine' : '') +
                (String(category['remarks']).indexOf('已完成') >= 0 ? ' is-completed' : '') +
                '">' +
                '<div class="item-inner">' +

                '<div class="item-head">' +
                '<span class="category-name">' + $.htmlEncode(categoryName) + '</span>' +
                '</div>' +

                '<div class="item-meta">' +
                '<a class="user"><i class="zmdi zmdi-account-circle"></i> ' + category['user'] + '</a>' +
                '<a class="users"><i class="zmdi zmdi-mood"></i> ' + Object.keys(category['users']).length + ' 人</a>' +
                '<a class="book-count"><i class="zmdi zmdi-run"></i> ' + category['books_count'] + ' 本书</a>' +
                '</div>' +

                '</div>' +
                '</div>'
            );

            itemElem.find('.item-head').click(function () {
                _categoryList.goToWork(categoryName);
            });

            itemElem.find('.item-meta > a').click(function showCategoryInfo() {
                var content = $(
                    '<div class="dialog-category-users">' +
                    '<div class="created">创建者：' + $.htmlEncode(category['user']) + '</div>' +
                    '<div class="created">总图书：' + category['books_count'] + ' 本' +
                    '<a href="/categoryExcel?name=' + encodeURIComponent(categoryName) + '" style="margin-left: 10px;color: #5cacf7;"><i class="zmdi zmdi-download"></i> 下载</a>' +
                    '</div>' +
                    '<div class="workers">贡献者（' + Object.keys(category['users']).length + '）：<span class="users-list"></span></div>' +
                    '<div class="updated-at">最新更新：' + $.dateFormat(category['updated_at'] * 1000) + '（' + $.timeAgo(category['updated_at']) + '）</div>' +
                    '<div class="updated-at">创建日期：' + $.dateFormat(category['created_at'] * 1000) + '（' + $.timeAgo(category['created_at']) + '）</div>' +
                    '</div>'
                );

                for (var i in category['users']) {
                    var user = category['users'][i];
                    var userName = $.trim(user['username']).length > 0 ? $.htmlEncode($.trim(user['username'])) : '无名英雄';
                    $('<span class="user-item">' +
                        '<span class="username">' + userName + '</span>' +
                        '<span class="book-count">' + user['books_count'] + ' 本书</span>' +
                        '<span class="percentage">' + user['percentage'] + '%</span>' +
                        '</span>').appendTo(content.find('.users-list'));
                }

                app.dialog.build('类目 ' + $.htmlEncode(categoryName), content);
            });

            return itemElem;
        };
    })();
};

app.main.showRanking = function () {
    app.main.categoryList.setLoading(true);
    app.api.getRanking(function (data) {
        app.main.categoryList.setLoading(false);
        var bookRanking = data['book_ranking'];
        var rankingElem = $(
            '<div class="dialog-ranking">' +
            '<div class="site-total"></div>' +
            '<div class="book-ranking"></div>' +
            '</div>'
        );
        rankingElem.find('.site-total').html('<i class="zmdi zmdi-cloud-outline-alt"></i> 全站目前共有 ' + data['site_category_total'] + ' 个类目，' + data['site_book_total'] + ' 本图书记录');
        var bookRankingElem = rankingElem.find('.book-ranking');
        for (var i in bookRanking) {
            var item = bookRanking[i],
                number = Number(i) + 1;
            var rankingItem = $(
                '<div class="book-ranking-item" data-number="' + number + '">' +
                '<span class="number"></span>' +
                '<span class="user-name"></span>' +
                '<span class="book-count"></span>' +
                '<span class="percentage"></span>' +
                '</div>'
            );
            rankingItem.find('.number').text(number);
            rankingItem.find('.user-name').text(item['user_name'] || '无名英雄');
            rankingItem.find('.book-count').text(item['book_count'] + ' 本书');
            rankingItem.find('.percentage').text(item['percentage'] + '%');
            rankingItem.appendTo(bookRankingElem);
        }
        app.dialog.build('战绩排名', rankingElem);
    }, function () {
        app.main.categoryList.setLoading(false);
    });
};

app.main.createCategoryDialog = function () {
    var el = $(
        '<div class="create-category-dialog-layer anim-fade-in">' +
        '<div class="create-category-dialog">' +

        '<div class="dialog-head">' +
        '<div class="dialog-title">创建新的类目</div>' +
        '<span class="dialog-close-btn"></span>' +
        '</div>' +

        '<form class="create-category-form" onsubmit="return false;">' +
        '<input type="text" id="categoryName" class="form-control" placeholder="输入类目名，例如：Z3" autocomplete="off" spellcheck="false">' +
        '<button type="submit" class="create-category-submit">好的</button>' +
        '</form>' +

        '</div>' +
        '</div>'
    );
    el.find('.dialog-close-btn').click(function () {
        el.remove();
    });
    el.find('.create-category-form').submit(function () {
        var input = el.find('#categoryName');
        var inputVal = $.trim(input.val());
        if (inputVal.length <= 0) { input.focus();return; }
        inputVal = inputVal.toUpperCase();
        app.dialog.build('创建新的类目', '请确认类目名 ' + $.htmlEncode(inputVal) + ' 准确无误', ['立刻创建', function () {
            app.main.categoryList.setLoading(true);
            app.api.categoryCreate(inputVal, function (data) {
                app.main.categoryList.refreshList(function () {
                    var categoryName = data['categoryName'];

                    if (!!data['categoryExist']) {
                        app.notify.success('类目 ' + categoryName + ' 已存在');
                    } else {
                        app.notify.success('类目 ' + categoryName + ' 创建成功');
                        app.socket.broadcastDanmaku('类目 ' + categoryName + ' 已创建', 1, '#2feab7');
                    }

                    if (app.data.categories.hasOwnProperty(categoryName)) {
                        // 是否现在打开类目？
                        app.dialog.build('进入类目', '类目 ' + $.htmlEncode(categoryName) + ' 可以进入了！要现在进入吗？', ['要', function () {
                            app.main.categoryList.goToWork(categoryName);
                        }], ['不要', null]);
                    }
                });
            }, function () {
                app.main.categoryList.refreshList();
            });
            el.remove();
        }], ['返回修改']);
    });

    el.appendTo('body');
};

/* Api */
app.api = {
    responseHandle: function (responseData) {
        if (!responseData || typeof responseData !== 'object' || $.isEmptyObject(responseData)) {
            app.notify.error('服务器响应数据格式错误');
            return;
        }

        var obj = {};
        obj.isSuccess = function () {
            return !!responseData['success'];
        };
        obj.getMsg = function () {
            return responseData['msg'] || '';
        };
        obj.checkGetData = function () {
            if (obj.isSuccess()) {
                return responseData['data'] || [];
            } else {
                app.notify.error(obj.getMsg());
                return false;
            }
        };
        obj.checkMakeNotify = function () {
            if (obj.isSuccess()) {
                app.notify.success(obj.getMsg());
                return true;
            } else {
                app.notify.error(obj.getMsg());
                return false;
            }
        };

        return obj;
    },

    getUser: function (user, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        user = user || app.data.getUser();

        $.ajax({
            url: '/getUser', data: {
                user: user
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    onSuccess(data);
                } else {
                    onError(data);
                }
            }, error: function () {
                app.notify.error('网络错误，用户资料无法失败');
                onError();
            }
        });
    },

    handleCategoryData: function (item) {
        item.isMine = function () {
            return !!this.user && typeof this.user === 'string' && this.user.length > 0 && this.user === app.data.getUser();
        };

        if (typeof item.books === 'object' && item.books instanceof Array) {
            var booksObj = {};
            for (var i = 0; i < item.books.length; ++i)
                booksObj[i] = item.books[i];
            item.books = booksObj;
            console.info('由于服务器响应的 books 为 Array 类型，已自动转换为 Object');
        }
    },

    getCategory: function (onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/getCategory', data: {
                name: ''
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    for (var categoryName in data['categories']) {
                        var item = data['categories'][categoryName];
                        app.api.handleCategoryData(item);
                    }
                    app.data.categories = data['categories'];
                    onSuccess(data);
                } else {
                    onError(data);
                }
            }, error: function () {
                app.notify.error('网络错误，类目列表无法失败');
                onError();
            }
        });
    },

    categoryCreate: function (categoryName, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/categoryCreate', data: {
                'name': categoryName,
                'user': app.data.getUser()
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    onSuccess(data);
                } else {
                    onError(data);
                }
            }, error: function () {
                app.notify.error('网络错误，类目无法创建');
                onError();
            }
        });
    },

    getCategoryBooks: function (categoryName, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        if (!app.data.categories.hasOwnProperty(categoryName)) {
            app.notify.error('找不到 ' + categoryName + ' 类 对象');
            onError();
            return;
        }

        var category = app.data.categories[categoryName];

        $.ajax({
            url: '/getCategory', data: {
                'name': categoryName
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    // 更新类目列表数据
                    app.data.categories[categoryName] = data.categories[categoryName];
                    app.api.handleCategoryData(app.data.categories[categoryName]);
                    onSuccess(data);
                } else {
                    onError(data);
                }
            }, error: function () {
                app.notify.error('网络错误，类目图书无法下载');
                onError();
            }
        });
    },

    uploadCategory: function (onSuccess) {
        onSuccess = onSuccess || function () {};

        var localData = app.editor.local.getAll();
        if (!localData || $.isEmptyObject(localData)) {
            app.notify.info('图书没有任何改动，无需上传');
            return;
        }

        app.loadingLayer.show('正在上传数据<br/>请勿关闭浏览器');

        var json = JSON.stringify(localData);

        $.ajax({
            url: '/uploadCategory', method: 'POST', data: {
                'user': app.data.getUser(),
                'books': json
            }, success: function (data) {
                app.loadingLayer.hide();
                var resp = app.api.responseHandle(data);
                if (resp.checkMakeNotify()) {
                    // 数据修改 清空
                    app.editor.local.setAll({});
                    app.socket.broadcastDanmaku('上传了数据', 4, '#2feab7');
                    onSuccess();
                }
            }, error: function () {
                app.loadingLayer.hide();
                app.notify.error('网络错误，图书数据无法上传');
            }
        });
    },

    getRanking: function (onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/getRanking', data: {

            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    onSuccess(data);
                } else {
                    onError(data);
                }
            }, error: function () {
                app.notify.error('网络错误，排名无法获取');
                onError();
            }
        });
    }
};

app.socket = {
    url: 'ws://' + document.domain + ':51230',

    webSocket: null,

    register: function () {
        this.initConnectGuard();
        this.initGlobalErrorListener();
    },

    // 初始化连接守卫
    initConnectGuard: function () {
        setInterval(function () {
            app.socket.connect();
        }, 4000);

        // Connected functions
        setInterval(function () {
            if (!app.socket.isConnected())
                return;

            app.socket.getOnline();
        }, 4000);
    },

    // 建立通讯
    connect: function () {
        if (app.main.isToggledLogin() || !app.data.getUser() || this.webSocket !== null)
            return;

        this.webSocket = new WebSocket(this.url);
        this.webSocket.onopen = function (obj) { app.socket.onOpen(obj); };
        this.webSocket.onmessage = function (obj) { app.socket.onMessage(obj); };
        this.webSocket.onclose = function () { app.socket.onClose(); };
    },

    // 是否已连接
    isConnected: function () {
        return this.webSocket !== null && this.webSocket.readyState === 1;
    },

    // 关闭通讯
    close: function () {
        this.webSocket.close();
    },

    // ==================
    // 事件监听
    // ==================
    onOpen: function (obj) {
        this.debugLog('远程服务器已连接');
        this.sendData('register', {user: app.data.getUser()});
        this.getOnline();
    },

    onMessage: function (obj) {
        app.socket.debugLog('接收消息: ' + obj.data);
        var data = JSON.parse(obj.data);

        switch (data['type']) {
            case 'danmaku':
                app.danmaku.make(data['msg'], data['mode'], data['color']);
                break;

            case 'getOnline':
                app.main.categoryList.setHeadOnline(data['online_total'], data['str']);
                break;
        }
    },

    onClose: function () {
        this.webSocket = null;
        this.debugLog('远程服务器已断开');
    },
    // ==================

    // 发送数据
    sendData: function (type, obj) {
        if (!this.isConnected()) {
            app.notify.warning('WebSocket 通讯尚未建立');
            return;
        }

        if (typeof type !== 'string' || typeof obj !== 'object')
            throw new Error('将要发送的数据类型有误');

        obj.type = type;
        var str = JSON.stringify(obj);

        this.webSocket.send(str);
        this.debugLog('发送数据： ' + str)
    },

    // 获取在线数据
    getOnline: function () {
        this.sendData('getOnline', {});
    },

    // 全局广播
    broadcastDanmaku: function (msg, mode, color) {
        this.sendData('broadcastDanmaku', {msg: msg, mode: mode, color: color});
    },

    // 记录调试日志
    debugLog: function (msg) {
        console.log('[app.socket] ' + msg);
    },

    // 初始化监听全局程序错误
    initGlobalErrorListener: function () {
        window.onerror = function (msg, url, lineNo, columnNo, error) {
            app.socket.sendData('logFrontendError', {
                msg: msg,
                url: url,
                lineNo: lineNo,
                columnNo: columnNo,
                errorObj: JSON.stringify(error)
            });

            return false;
        };
    }
};

/*
    transform: translateX(-910.301px) translateY(0px) translateZ(0px);
    transition: -webkit-transform 0s linear;
 */
app.danmaku = {
    register: function () {
        // Comment Manager
        var elem = $('<div class="danmaku-layer-wrap"><div class="danmaku-layer"></div></div>').appendTo('body');
        var cm = new CommentManager(elem.find('.danmaku-layer').get(0));
        cm.init();
        cm.start(); // 启用弹幕播放
        window.CM = cm;

        // Send Broadcast Danmaku Btn
        var btnElem = $('<button class="danmaku-broadcast-send">发送弹幕</button>').appendTo('body');
        btnElem.click(function () {
            var dialogLayer = $('.danmaku-send-dialog-layer');
            if (dialogLayer.length <= 0)
                app.danmaku.displaySendDialog();
            else
                dialogLayer.remove();
        });
    },

    displaySendDialog: function () {
        if ($('.danmaku-send-dialog-layer').length !== 0) return;

        var dialogLayerElem = $('<div class="danmaku-send-dialog-layer anim-fade-in"></div>').appendTo('body');

        var dialogElem = $(
            '<div class="danmaku-send-dialog">' +
            '<span class="zmdi zmdi-close exit-btn"></span>' +
            '<form class="danmaku-send-form" onsubmit="return false;">' +
            '<span data-toggle="showColorSelector" class="danmaku-style-btn zmdi zmdi-format-color-text"></span>' +
            '<input class="danmaku-msg-input" type="text" placeholder="(～￣▽￣)～ 输入弹幕内容" autocomplete="off">' +
            '<button type="submit" class="danmaku-send-btn">发送 &gt;</button>' +
            '</form>' +
            '<div class="color-selector"></div>' +
            '</div>'
        ).appendTo(dialogLayerElem);

        dialogElem.find('.exit-btn').click(function () {
            dialogLayerElem.remove();
        });

        var colors = ['#FFFFFF', '#cfd8dc', '#000000', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'],
            selectedColor = colors[0];
        var formElem = dialogElem.find('.danmaku-send-form');
        var danmakuMsgInputElem = formElem.find('.danmaku-msg-input');
        danmakuMsgInputElem.focus();

        formElem.submit(function () {
            var msg = $.trim(danmakuMsgInputElem.val());
            if (msg.length <= 0) {
                app.notify.warning('弹幕内容不能为空哟');
                danmakuMsgInputElem.focus();
                return false;
            }

            var mode = 1;
            app.socket.broadcastDanmaku('说：' + msg, mode, selectedColor);
            danmakuMsgInputElem.val('');

            return false;
        });

        var colorSelectorElem = dialogElem.find('.color-selector');
        dialogElem.find('[data-toggle="showColorSelector"]').on('mousedown', function(e) {
            e.preventDefault();
        }).click(function () {
            if (colorSelectorElem.hasClass('selector-show')) return;
            colorSelectorElem.addClass('selector-show');
            setTimeout(function () {
                $(document).bind('click.for-selector-hide', function (e) {
                    if(!$(e.target).closest('.color-selector').length) {
                        colorSelectorElem.removeClass('selector-show');
                        $(document).unbind('click.for-selector-hide');
                    }
                });
            }, 50);
        });

        var setColorBlockItemSelected = function (hex) {
            colorSelectorElem.children().removeClass('color-selected');
            colorSelectorElem.find('[data-color-hex=' + hex + ']').addClass('color-selected');
        };

        for (var i in colors) {
            if (!colors.hasOwnProperty(i)) continue;
            var colorHex = colors[i];
            $('<div class="color-block-item" style="background-color: ' + colorHex + '" data-color-hex="' + colorHex + '"></div>')
                .data('color-hex', colorHex)
                .click(function () {
                    var colorHex = $(this).attr('data-color-hex');
                    selectedColor = colorHex;
                    setColorBlockItemSelected(colorHex);
                })
                .appendTo(colorSelectorElem);
        }

        setColorBlockItemSelected(colors[0]);
    },

    make: function (message, mode, color) {
        mode = Number(mode);

        var colorHEX = parseInt((color || '#FFF').replace(/^#/, ''), 16);
        var config = {
            mode: mode,
            text: message,
            stime: 0,
            size: 25,
            color: colorHEX
        };

        if (mode === 1 || mode === 2) {
            config.dur = 7500;
        }

        CM.send(config);
    }
};

app.notify = {
    showEnabled: false,
    setShowEnabled: function (showEnabled) {
        if (showEnabled === undefined || typeof showEnabled !== 'boolean')
            return false;

        this.showEnabled = showEnabled;
        return true;
    },
    success: function (message) {
        this.show(message, 's');
    },
    error: function (message) {
        this.show(message, 'e');
    },
    info: function (message) {
        this.show(message, 'i');
    },
    warning: function (message) {
        this.show(message, 'w');
    },
    // level: s, e, i, w
    show: function (message, level, timeout) {
        console.log('[app.notify][' + level + '][' + new Date().toLocaleString() + '] ' + message);

        if (!this.showEnabled)
            return false;

        timeout = (timeout !== undefined && typeof timeout === 'number') ? timeout : 4000;

        var layerElem = $('.notify-layer');
        if (layerElem.length === 0)
            layerElem = $('<div class="notify-layer" />').appendTo('body');

        var notifyElem = $('<div class="notify-item anim-fade-in ' + (!!level ? 'type-' + level : '') + '"><p class="notify-content"></p></div>');
        notifyElem.find('.notify-content').html($.htmlEncode(message).replace('\n', '<br/>'));
        notifyElem.prependTo(layerElem);

        var notifyRemove = function () {
            notifyElem.addClass('anim-fade-out');
            setTimeout(function () {
                notifyElem.remove();
            }, 200);
        };

        var autoOut = true;
        notifyElem.click(function () {
            notifyRemove();
            autoOut = false;
        });

        if (timeout > 0) {
            setTimeout(function () {
                if (!autoOut) return;
                notifyRemove();
            }, timeout);
        }

        return true;
    }
};

app.dialog = {
    build: function (title, content, yesBtn, cancelBtn) {
        var layerSel = '.dialog-layer';

        if ($(layerSel).length !== 0)
            $(layerSel).remove();

        var dialogLayerElem = $('<div class="dialog-layer anim-fade-in" />').appendTo('body');
        var dialogLayerHide = function () {
            dialogLayerElem.addClass('anim-fade-out');
            setTimeout(function () {
                dialogLayerElem.hide();
            }, 200);
        };

        var dialogElem = $('<div class="dialog-inner"><div class="dialog-title">'+title+'</div>\n<div class="dialog-content"></div></div>')
            .appendTo(dialogLayerElem);
        dialogElem.find('.dialog-content').append(content);

        // 底部按钮
        if (!!yesBtn || !!cancelBtn) {
            var dialogBottomElem = $('<div class="dialog-bottom"></div>')
                .appendTo(dialogElem);

            // 确定按钮
            if (!!yesBtn) {
                var yesOnClick = yesBtn[1] || function () {};
                var yesBtnText = yesBtn[0] || '确定';

                $('<a class="dialog-btn yes-btn">' + yesBtnText + '</a>').click(function () {
                    dialogLayerHide();
                    yesOnClick();
                }).appendTo(dialogBottomElem);
            }

            // 取消按钮
            if (!!cancelBtn) {
                var cancelBtnText = cancelBtn[0] || '取消';
                var cancelOnClick = cancelBtn[1] || function () {};

                $('<a class="dialog-btn cancel-btn">' + cancelBtnText + '</a>').click(function () {
                    dialogLayerHide();
                    cancelOnClick();
                }).appendTo(dialogBottomElem);
            }
        } else {
            $('<a class="right-btn"><i class="zmdi zmdi-close"></i></a>').appendTo($(dialogElem).find('.dialog-title')).click(function () {
                dialogLayerHide();
            });
        }

        var obj = {};
        obj.getElem = function () {
            return dialogElem;
        };

        return obj;
    }
};

$.extend({
    dateFormat: function (fdate, formatStr){
        var fTime, fStr = 'ymdhis';
        if (!formatStr)
            formatStr= "y-m-d h:i:s";
        if (fdate)
            fTime = new Date(fdate);
        else
            fTime = new Date();
        var formatArr = [
            fTime.getFullYear().toString(),
            (fTime.getMonth()+1).toString(),
            fTime.getDate().toString(),
            fTime.getHours().toString(),
            fTime.getMinutes().toString(),
            fTime.getSeconds().toString()
        ];
        for (var i=0; i<formatArr.length; i++){
            formatStr = formatStr.replace(fStr.charAt(i), formatArr[i]);
        }
        return formatStr;
    },
    timeAgo: function (date) {
        if (!date || isNaN(date) || date === 0)
            return '未知';

        // 获取js 时间戳
        var time = new Date().getTime();
        // 去掉 js 时间戳后三位，与php 时间戳保持一致
        time = parseInt((time - date * 1000) / 1000);

        // 存储转换值
        var s;
        if (time < 60 * 10) { // 十分钟内
            return '刚刚';
        } else if ((time < 60 * 60) && (time >= 60 * 10)) {
            // 超过十分钟少于1小时
            s = Math.floor(time / 60);
            return s + " 分钟前";
        } else if ((time < 60 * 60 * 24) && (time >= 60 * 60)) {
            // 超过1小时少于24小时
            s = Math.floor(time / 60 / 60);
            return s + " 小时前";
        } else {
            // 超过1天少于7天内
            s = Math.floor(time / 60 / 60 / 24);
            return s + " 天前";
        }
    },
    htmlEncode: function (value) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(value));
        return div.innerHTML;
    },
    htmlDecode: function (value) {
        var div = document.createElement('div');
        div.innerHTML = value;
        return div.innerText || div.textContent;
    },
    getPosition: function ($element) {
        var el = $element[0];
        var isBody = el.tagName === 'BODY';

        var elRect = el.getBoundingClientRect();
        if (elRect.width === null) {
            // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
            elRect = $.extend({}, elRect, {width: elRect.right - elRect.left, height: elRect.bottom - elRect.top})
        }
        var isSvg = window.SVGElement && el instanceof window.SVGElement;
        // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
        // See https://github.com/twbs/bootstrap/issues/20280
        var elOffset = isBody ? {top: 0, left: 0} : (isSvg ? null : $element.offset());
        var scroll = {scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop()};
        var outerDims = isBody ? {width: $(window).width(), height: $(window).height()} : null;

        return $.extend({}, elRect, scroll, outerDims, elOffset);
    }
});