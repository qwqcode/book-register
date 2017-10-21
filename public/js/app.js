/* Zneiat/library-register-server */
$(document).ready(function () {
    appUtils.checkLocalTime();

    app.data.register();
    app.main.register();

    app.notify.info('程序初始化完毕');
    app.notify.setShowEnabled(true);

    app.pageLoader.hide();
});

var app = {};

app.pageLoader = {
    sel: '#pageLoaderLayer',
    show: function (text) {
        text = text || '加载中...';
        var dom = $(this.sel);
        dom.find('.loading-text').text(text);
        dom.fadeIn(300);
    },
    hide: function () {
        var dom = $(this.sel);
        dom.fadeOut(300);
    }
};

app.data = {
    register: function () {
        this.user = window.localStorage ? localStorage.getItem('user') || null : null;
    },
    user: null,
    setUser: function (val) {
        if (!val || typeof (val) !== 'string' || $.trim(val).length < 1) return;
        val = $.trim(val);
        this.user = val;
        window.localStorage ? localStorage.setItem('user', val) : null;
    },
    getUser: function () {
        return this.user || '';
    },
    clearUser: function () {
        this.user = null;
        window.localStorage ? localStorage.removeItem('user') : null;
    },
    categoris: {},
    categoryBooks: {},
    currentCategoryIndex: null,
    currentCategoryName: null,
    workCategoryIsSaved: false
};

/* Main */
app.main = {
    dom: $(),
    wrap: $(),
    headDom: $(),
    loginDom: $(),
    categoryListDom: $(),
    categoryListObj: null,

    register: function () {
        this.dom = $('.main');
        this.wrap = $('.main-wrap');
        this.headDom = $('.main-head');
        this.loginDom = $('.main-login');
        this.categoryListDom = $('.main-category-list-wrap');

        // Header
        this.headDom.find('.user-name').click(function () {
            app.dialog.build('改变身份', '确定要改变自己的身份？', ['确定', function () {
                app.main.toggleLogin();
                app.data.clearUser();
            }], ['取消', null]);
        });

        // Category List
        this.categoryListObj = this.categoryList(this.categoryListDom);
        this.categoryListObj.updateFromServer(); // Update Category Data

        // Login Check
        if (!!app.data.getUser())
            this.toggleCategoryList();

        // Login Form
        this.loginDom.submit(function () {
            var yourName = $(this).find('#yourName');
            var yourNameVal = $.trim(yourName.val());
            if (yourNameVal.length < 1) {
                app.notify.error('请填入你的真实姓名');
                return false;
            }

            app.main.toggleCategoryList(yourNameVal);

            return false;
        });

        this.show();
    },

    toggleCategoryList: function (userName) {
        if (!!userName)
            app.data.setUser(userName);

        this.dom.addClass('large-size');
        this.headDom.find('.user-name > .action-text').text(app.data.getUser());
    },

    toggleLogin: function () {
        this.loginDom.find('#yourName').val(app.data.getUser());
        this.dom.removeClass('large-size');
    },

    show: function () {
        this.wrap.show();
    },

    hide: function () {
        this.wrap.hide();
    }
};

/* Category > Selector Builder */
app.main.categoryList = function (appendingDom) {
    var obj = {};

    var dom = $(
        '<div class="category-list">' +

        '<div class="list-head">' +
        '<span class="title">书籍类目列表</span>' +
        '<span class="part-right">' +
        '<span class="list-actions">' +
        '<span><a href="/downloadExcel?categoryName=__ALL"><i class="zmdi zmdi-download"></i> 下载数据</a></span>' +
        '<span data-toggle="create-category"><i class="zmdi zmdi-plus"></i> 创建类目</span>' +
        '</span>' +
        '</span>' +
        '</div>' +

        '<div class="list-body">' +
        '<div class="list-content"></div>' +
        '<div class="list-loading anim-fade-in" style="display: none;"><div class="page-loader-spinner"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"></circle></svg></div></div>' +
        '</div>' +

        '</div>'
    );

    // Create Category Btn
    dom.find('[data-toggle="create-category"]').click(function () {
        var categoryName = window.prompt('填入类目名，例如：Z', '');
        if (!!categoryName && String(categoryName).length > 0) {
            app.dialog.build('创建类目', '确定要创建 类目' + appUtils.htmlEncode(categoryName) + ' 吗？', ['确定', function () {
                obj.setLoading(true);
                app.api.createCategory($.trim(categoryName), function () {
                    obj.updateFromServer();
                }, function () {
                    obj.updateFromServer();
                });
            }], ['取消']);
        }
    });

    obj.getDom = function () {
        return dom;
    };

    obj.updateFromServer = function () {
        obj.setLoading(true);
        app.api.getCategory(function () {
            obj.update();
            obj.setLoading(false);
        }, function () {
            obj.setLoading(false);
        });
    };

    obj.update = function () {
        var contentDom = dom.find('.list-content');
        var categories = app.data.categoris;
        contentDom.html('');
        var itemRender = function (index, item) {
            var itemDom = $(
                '<div class="item" data-category-index="' + index + '">' +
                '<div class="item-head">' +
                '<span class="category-name' + (item['user'] === app.data.getUser() ? ' is-mine' : '') + '">' +
                appUtils.htmlEncode(item['name'] || "未命名") +
                (String(item['remarks']).indexOf('已完成') >= 0 ? '  [已完成]' : '') +
                '</span>' +
                '</div>' +
                '<div class="item-desc">' +
                '<span title="登记员"><i class="zmdi zmdi-account"></i> ' + appUtils.htmlEncode(item['user'] || "未知") + '</span>' +
                '<span title="更新时间"><i class="zmdi zmdi-time"></i> ' + appUtils.timeAgo(item['updated_at']) + '</span>' +
                '<span title="创建时间"><i class="zmdi zmdi-time"></i> ' + appUtils.timeAgo(item['created_at']) + '</span>' +
                '</div>' +
                '</div>'
            );
            itemDom.click(function () {
                obj.onItemClick($(this).attr('data-category-index'));
            });
            itemDom.appendTo(contentDom);
        };

        // 我负责的
        var mineCategoryNames = [];
        for (var indexMine in categories) {
            var itemMain = categories[indexMine];
            if (!!itemMain['registrar_name'] && itemMain['user'] === app.data.getUser()) {
                mineCategoryNames.push(itemMain['name']);
                itemRender(indexMine, itemMain);
            }
        }
        // 非我负责的
        for (var indexAll in categories) {
            var item = categories[indexAll];
            if (mineCategoryNames.indexOf(item['name']) > -1)
                continue;

            itemRender(indexAll, item);
        }

        return true;
    };

    obj.onItemClick = function (categoryDataIndex) {
        var categoryData = app.data.categoris[categoryDataIndex];
        if (!categoryData) {
            app.notify.error('不存在的类目，Index=' + categoryDataIndex);
            return;
        }

        var categoryName = categoryData['name'];
        if (!categoryName) {
            app.notify.error('不知名的类目...');
            return;
        }

        var categoryUser = categoryData['user'] || '';

        var startWork = function () {
            obj.setLoading(true);
            app.api.booksDownload(categoryData, function () {
                // 当图书数据下载完毕
                obj.update();
                obj.setLoading(false);

                if (!app.data.categoryBooks.hasOwnProperty(categoryName)) {
                    app.notify.error('真是奇怪呐... 未找到 app.data.categories 中的该类目数据');
                    return;
                }

                var categoryBooks = app.data.categoryBooks[categoryName];

                app.data.currentCategoryIndex = categoryDataIndex;
                app.data.currentCategoryName = categoryName;

                // 正式开始工作
                app.work.show();
                app.work.newTable(app.work.handleBooksTableUse(categoryName, categoryBooks));

            }, function () {
                obj.setLoading(false);
                app.notify.error('无法打开该类目');
            });
        };

        if (categoryUser !== app.data.getUser()) {
            app.dialog.build('编辑警告', '该类目由 ' + appUtils.htmlEncode(categoryUser) + ' 全权负责<br/>如果你得到了 ' + appUtils.htmlEncode(categoryName) + '类 图书，请交给他登记<br/>为了防止数据冲突，禁止编辑该类目！', ['返回', function () {}], ['仍然继续', function () {
                startWork();
            }]);
        } else {
            startWork();
        }
    };

    obj.setLoading = function (isLoading) {
        if (typeof isLoading !== 'boolean')
            return;

        if (isLoading) {
            this.getDom().find('.list-loading').show();
        } else {
            this.getDom().find('.list-loading').hide();
        }
    };

    dom.appendTo(appendingDom);

    return obj;
};

/* Api */
app.api = {
    responseHandle: function (responseData) {
        if (!responseData || typeof (responseData) !== 'object' || $.isEmptyObject(responseData)) {
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

        return obj;
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
                    app.data.categoris = data['categories'];
                    onSuccess(data);
                } else {
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，类目列表无法失败');
                onError();
            }
        });
    },

    booksDownload: function (categoryData, onSuccess, onError) {
        onSuccess = onSuccess || function () {
        };
        onError = onError || function () {
        };

        $.ajax({
            url: '/getCategoryBooks', data: {'categoryName': categoryData['name']}, beforeSend: function () {

            }, success: function (data) {
                console.log(data);
                if (!!data['success']) {
                    app.data.categoryBooks[categoryData['name']] = data['data']['books'];

                    // 更新类目列表数据
                    for (var i in app.data.categoris) {
                        var itemCategory = app.data.categoris[i];
                        if (itemCategory['name'] === categoryData['name']) {
                            app.data.categoris[i] = data['data']['category'];
                            break;
                        }
                    }

                    app.notify.success('类目' + categoryData['name'] + ' 图书数据成功获取');
                    onSuccess(data);
                } else {
                    app.notify.error(data['msg']);
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，类目图书无法获取');
                onError();
            }
        });
    },

    createCategory: function (categoryName, onSuccess, onError) {
        onSuccess = onSuccess || function () {
        };
        onError = onError || function () {
        };

        $.ajax({
            url: '/createCategory', data: {
                'categoryName': categoryName,
                'user': app.data.getUser()
            }, beforeSend: function () {

            }, success: function (data) {
                if (!!data['success']) {
                    app.notify.success(data['msg']);
                    onSuccess(data);
                } else {
                    app.notify.error(data['msg']);
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，类目无法创建');
                onError();
            }
        });
    },

    uploadData: function (categoryName, categoryBooksArr, onSuccess, onError) {
        onSuccess = onSuccess || function () {
        };
        onError = onError || function () {
        };

        var data = {};
        data[categoryName] = categoryBooksArr;
        var json = JSON.stringify(data);
        $.ajax({
            url: '/uploadCategoryBooks', method: 'POST', data: {
                'user': app.data.getUser(),
                'booksInCategoriesJson': json
            }, beforeSend: function () {

            }, success: function (data) {
                if (!!data['success']) {
                    app.notify.success(data['msg']);
                    onSuccess();
                } else {
                    app.notify.error(data['msg']);
                    app.notify.error('严重：服务器程序错误，数据无法保存，面临丢失的风险');
                    onError();
                }
            }, error: function () {
                app.notify.error('严重：网络错误，数据无法保存，面临丢失的风险');
                onError();
            }
        });
    }
};

/* Work */
app.work = {
    hot: null,
    dom: $(),
    workTableDom: $(),
    register: function () {
        this.dom = $('#workArea');
        this.workTableDom = $('#workTable');
    },
    show: function () {
        if (this.dom.css('display') !== 'none') {
            return;
        }

        app.helloScreen.hide();
        this.dom.show();
    },
    newTable: function (tableBooksData) {
        if (this.hot !== null) {
            this.hot.destroy();
        }

        var hotDom = this.workTableDom.html('<div id="handsontable"></div>')
            .find('#handsontable');
        this.hot = new Handsontable(hotDom[0], {
            rowHeaders: true,
            colHeaders: ['类目', '索引号', '书名', '出版社', '备注'],
            colWidths: [5, 10, 30, 20, 30],
            columns: [
                {data: 'category', readOnly: true},
                {data: 'numbering', readOnly: true},
                {data: 'name'},
                {data: 'press'},
                {data: 'remarks'}
            ],

            filters: true,
            //dropdownMenu: true,
            //minSpareRows: 500,
            manualColumnResize: true,
            manualRowResize: true,
            stretchH: 'all',
            contextMenu: {
                callback: function (key, options) {
                    if (key === 'aboutCut' || key === 'aboutCopy' || key === 'aboutPaste') {
                        setTimeout(function () {
                            app.dialog.build('换一个方式操作？！', '您可以使用键盘快捷键进行操作：<br>' +
                                '复制 Ctrl + C<br>粘贴 Ctrl + V<br>剪切 Ctrl + X<br>撤销 Ctrl + Z<br>重做 Ctrl + Y')
                        }, 100);
                    }

                    if (key === 'saveData') {
                        app.work.saveCurrent();
                    }
                },
                items: {
                    'aboutCut'  : {name: '剪切 (Ctrl+X)'},
                    'aboutCopy' : {name: '复制 (Ctrl+C)'},
                    'aboutPaste': {name: '粘贴 (Ctrl+V)'},
                    "hsep1": "---------",
                    'undo' : {name: '撤销 (Ctrl+Z)'},
                    'redo' : {name: '重做 (Ctrl+Y)'},
                    "hsep2": "---------",
                    'saveData' : {name: '保存数据'}
                }
            },
            // Enter envent
            enterMoves: function () {
                return {
                    row: 1,
                    col: -app.work.hot.getSelected()[1] + 2
                }
            }
        });

        // Spare rows adding
        Handsontable.hooks.add('afterSetDataAtCell', function (changes, source) {
            // 数据未保存的
            app.work.isSaved = false;
            // 当编辑了最后一行
            if (changes[0][0] + 1 >= app.work.hot.getData().length) {
                // 创建新行
                var categoryName = app.data.currentCategoryName;
                var dataLastNumbering = app.work.hot.getData().length + 1;
                var data = app.work.hot.getSourceData();
                // 创建新 500 行
                for (var i = 1; i <= 500; i++) {
                    var numbering = dataLastNumbering + i;
                    data.push({
                        category: categoryName,
                        numbering: numbering,
                        name: '',
                        press: '',
                        remarks: ''
                    });
                }
                app.work.hot.render();
            }
        });

        var tableScreenFit = function () {
            app.work.hot.updateSettings({
                height: app.work.dom.innerHeight()
            });
        };
        tableScreenFit();
        $(window).resize(function () {
            tableScreenFit();
        });

        // 装入图书
        app.work.hot.loadData(tableBooksData);

        // 离开页面提示
        $(window).on('beforeunload', function(eventObject) {
            if (!app.work.isSaved) {
                var returnValue = "数据保存了吗？真的要离开吗？";
                return eventObject.returnValue = returnValue;
            }
        })
    },

    /* Data Handle */

    handleBooksTableUse: function (categoryName, booksData) {
        if (!booksData || typeof(booksData) !== 'object') {
            return [];
        }

        var total = booksData.length + 500; // 预留 500 个空行
        var data = [];
        for (var i = 0; i < total; i++) {
            var numbering = String(i + 1);
            data[i] = {
                category: categoryName,
                numbering: numbering,
                name: '',
                press: '',
                remarks: ''
            };

            // 搜寻是否有当前 numbering 的图书数据
            for (var bookItemIndex in booksData) {
                var bookItem = booksData[bookItemIndex];
                if (String(bookItem['numbering']) === numbering) {
                    data[i]['name'] = String(bookItem['name'] || '');
                    data[i]['press'] = String(bookItem['press'] || '');
                    data[i]['remarks'] = String(bookItem['remarks'] || '');
                    break;
                }
            }
        }

        return data;
    },

    handleTableDataUploadUse: function (tableData) {
        if (!tableData || typeof(tableData) !== 'object') {
            return [];
        }

        var data = [];

        var maxNumbering = 1;
        for (var i in tableData) {
            var item = tableData[i];
            var numbering = Number(item['numbering']);
            if (numbering > maxNumbering
                && ($.trim(item['name']).length > 0 || $.trim(item['press']).length > 0 || $.trim(item['remarks']).length > 0))
                maxNumbering = numbering;
        }

        for (var i = 0; i <= maxNumbering - 1; i++) {
            var bookItem = tableData[i];
            data[i] = {
                numbering: bookItem['numbering'],
                name: bookItem['name'],
                press: bookItem['press'],
                remarks: bookItem['remarks']
            };
        }
        return data;
    },

    isSaved: true,
    saveCurrent: function () {
        if (this.hot === null) {
            app.notify.warning('Handsontable 还未实例化');
            return;
        }

        app.work.hot.deselectCell();
        var tableData = app.work.hot.getSourceData();
        var updateData = app.work.handleTableDataUploadUse(tableData);
        app.pageLoader.show('数据保存中，请勿退出浏览器！');
        app.api.uploadData(app.data.currentCategoryName, updateData, function () {
            // 更新类目列表
            if (app.category.currentSelector !== null)
                app.category.currentSelector.updateFromServer();
            app.work.isSaved = true;
            app.pageLoader.hide();
        }, function () {
            app.work.isSaved = false;
            app.pageLoader.hide();
        });
    },

    exitWork: function() {
        app.dialog.build('退出', '数据保存了吗？是否真的要退出？', ['退出', function () {
            window.location.reload();
        }], ['放弃', function () {}]);
    }
};

app.notify = {
    showEnabled: false,
    setShowEnabled: function (showEnabled) {
        if (showEnabled === undefined || typeof(showEnabled) !== 'boolean')
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

        var layerDom = $('.notify-layer');
        if (layerDom.length === 0)
            layerDom = $('<div class="notify-layer" />').appendTo('body');

        var notifyDom = $('<div class="notify-item anim-fade-in ' + (!!level ? 'type-' + level : '') + '"><p class="notify-content"></p></div>');
        notifyDom.find('.notify-content').text(message);
        notifyDom.prependTo(layerDom);

        var notifyRemove = function () {
            notifyDom.addClass('anim-fade-out');
            setTimeout(function () {
                notifyDom.remove();
            }, 200);
        };

        var autoOut = true;
        notifyDom.click(function () {
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

        var dialogLayerDom = $('<div class="dialog-layer anim-fade-in" />').appendTo('body');
        var dialogLayerHide = function () {
            dialogLayerDom.addClass('anim-fade-out');
            setTimeout(function () {
                dialogLayerDom.hide();
            }, 200);
        };

        var dialogDom = $('<div class="dialog-inner"><div class="dialog-title">'+title+'</div>\n<div class="dialog-content">'+content+'</div></div>').appendTo(dialogLayerDom);

        // 底部按钮
        if (!!yesBtn || !!cancelBtn) {
            var dialogBottomDom = $('<div class="dialog-bottom"></div>')
                .appendTo(dialogDom);

            // 确定按钮
            if (!!yesBtn) {
                var yesOnClick = yesBtn[1] || function () {};
                var yesBtnText = yesBtn[0] || '确定';

                $('<a class="dialog-btn yes-btn">' + yesBtnText + '</a>').click(function () {
                    dialogLayerHide();
                    yesOnClick();
                }).appendTo(dialogBottomDom);
            }

            // 取消按钮
            if (!!cancelBtn) {
                var cancelBtnText = cancelBtn[0] || '取消';
                var cancelOnClick = cancelBtn[1] || function () {};

                $('<a class="dialog-btn cancel-btn">' + cancelBtnText + '</a>').click(function () {
                    dialogLayerHide();
                    cancelOnClick();
                }).appendTo(dialogBottomDom);
            }
        } else {
            $('<a class="right-btn"><i class="zmdi zmdi-close"></i></a>').appendTo($(dialogDom).find('.dialog-title')).click(function () {
                dialogLayerHide();
            });
        }
    }
};

var appUtils = {
    timeAgo: function (date) {
        if (!date || isNaN(date) || date === 0) {
            return '未知';
        }

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
    checkLocalTime: function () {
        $.ajax({
            url: '/getTime', beforeSend: function () {

            }, success: function (data) {
                if (!!data['success']) {
                    var serverTime = data['data']['time'];
                    var serverTimeFormat = data['data']['time_format'];
                    // 获取 js 时间戳
                    var time = new Date().getTime();
                    // 去掉 js 时间戳后三位，与 php 时间戳保持一致
                    time = parseInt((time - serverTime * 1000) / 1000);
                    // 若时差超过1小时
                    if (Math.floor(time / 60 / 60) >= 1 || Math.floor(time / 60 / 60) <= -1) {
                        app.dialog.build('警告', '当前本地系统时间快了 ' + Math.floor(time / 60 / 60) + ' 小时<br/>为了避免发生错误，请调整为 ' + serverTimeFormat);
                    }
                } else {
                    app.notify.warning('服务器当前时间戳获取失败')
                }
            }, error: function () {
                app.notify.warning('网络错误，服务器当前时间戳获取失败')
            }
        });
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
    }
};