/* Zneiat/library-register-server */
$(document).ready(function () {
    appUtils.checkLocalTime();
    app.helloScreen.init();
    app.category.init();
    app.work.init();
    app.notify.info('程序初始化完毕');
    app.notify.setShowEnabled(true);
});

var app = {};

app.data = {
    categoris: {},
    categoryBooks: {},
    registrarName: null,
    currentCategoryIndex: null,
    currentCategoryName: null,
    workCategoryIsSaved: false
};

/* HelloScreen */
app.helloScreen = {
    dom: $(),
    wrap: $(),
    headDom: $(),
    formDom: $(),

    init: function () {
        this.dom = $('#helloScreen');
        this.wrap = $('.hello-screen-wrap');
        this.headDom = $('#helloHead');

        this.formDom = $('#helloForm');
        var localRegistrarName = window.localStorage ? localStorage.getItem('registrarName') : false;
        if (localRegistrarName) {
            this.formDom.find('#yourName').val(localRegistrarName);
        }

        this.formDom.submit(function () {
            var yourName = $(this).find('#yourName');
            var yourNameVal = $.trim(yourName.val());
            if (yourNameVal.length < 1) {
                app.notify.error('请填入你的真实姓名');
                return false;
            }

            app.data.registrarName = yourNameVal;
            window.localStorage ? localStorage.setItem('registrarName', yourNameVal) : null;

            app.helloScreen.onFormSubmited();

            return false;
        });
    },

    onFormSubmited: function () {
        this.formDom.addClass('form-hide');

        var selectorWrap = $('#helloCategorySelectorWrap').addClass('show');
        var selector = app.category.selectorBuilder(selectorWrap, false);
        selector.show();
        selector.updateFromServer();

        setTimeout(function (hs) {
            hs.dom.addClass('large-size');
            hs.headDom.find('.big-title').addClass('left-part');
            var rightPart = hs.headDom.find('.right-part');
            rightPart.find('#registrarName').text(app.data.registrarName);
            rightPart.show();
        }(this), 200);
    },

    hide: function () {
        this.wrap.hide();
    }
};

/* Category */
app.category = {
    init: function () {},

    currentSelector: null,

    create: function () {
        var categoryName = window.prompt('填入类目名，例如：Z', '');
        if (!!categoryName && typeof(categoryName) === 'string' && $.trim(categoryName).length > 0) {
            for (var i in app.data.categoris) {
                var item = app.data.categoris[i];
                if (item['name'] === categoryName) {
                    app.notify.warning('类目' + categoryName + ' 已存在，无需再创建！');
                    return;
                }
            }
            this.uploadData($.trim(categoryName), [{"numbering": "1", "name": "", "press": "", "remarks": ""}]);
        }
    }
};

/* Category > Selector Builder */
app.category.selectorBuilder = function (appendingDom, showCloseBtn) {
    var obj = {};

    var dom = $(
        '<div class="category-list" style="display: none">' +

        '<div class="list-head">' +
        '<span class="title">书籍类目列表</span>' +
        '<span class="part-right">' +
        '<span class="list-actions">' +
        '<span onclick="app.category.create()"><i class="zmdi zmdi-plus"></i> 创建类目</span>' +
        '</span>' +
        '<span class="close-btn zmdi zmdi-close"></span>' +
        '</span>' +
        '</div>' +

        '<div class="list-body">' +
        '<div class="list-content"></div>' +
        '<div class="list-loading anim-fade-in" style="display: none;"><div class="page-loader-spinner"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"></circle></svg></div></div>' +
        '</div>' +

        '</div>'
    );

    obj.getDom = function () {
        return dom;
    };

    obj.updateFromServer = function () {
        obj.setLoading(true);
        app.category.categoriesDownload(function () {
            obj.setLoading(false);
            obj.update();
        }, function () {
            obj.setLoading(false);
        });
    };

    obj.update = function () {
        var contentDom = dom.find('.list-content');
        var categories = app.data.categoris;
        contentDom.html('');
        for (var i in categories) {
            var item = categories[i];
            var itemDom = $(
                '<div class="item" data-category-index="' + i + '">' +
                '<div class="item-head">' +
                '<span class="category-name' + (item['registrar_name'] === app.data.registrarName ? ' is-mine' : '') + '">' +
                appUtils.htmlEncode(item['name'] || "未命名") +
                (String(item['remarks']).indexOf('已完成') >= 0 ? '  [已完成]' : '') +
                '</span>' +
                '</div>' +
                '<div class="item-desc">' +
                '<span title="登记员"><i class="zmdi zmdi-account"></i> ' + appUtils.htmlEncode(item['registrar_name'] || "未知") + '</span>' +
                '<span title="更新时间"><i class="zmdi zmdi-cloud-upload"></i> ' + appUtils.timeAgo(item['update_at'] || "未知") + '</span>' +
                '<span title="创建时间"><i class="zmdi zmdi-plus-square"></i> ' + appUtils.timeAgo(item['created_at'] || "未知") + '</span>' +
                '</div>' +
                '</div>'
            );
            itemDom.click(function () {
                obj.onItemClick($(this).attr('data-category-index'));
            });
            itemDom.appendTo(contentDom);
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

        obj.setLoading(true);
        app.category.booksDownload(categoryData, function () {
            // 当图书数据下载完毕
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

    obj.show = function () {
        app.category.currentSelector = this;
        return this.getDom().show();
    };

    obj.hide = function () {
        if (app.category.currentSelector === this)
            app.category.currentSelector = null;

        return this.getDom().hide();
    };

    obj.remove = function () {
        if (app.category.currentSelector === this)
            app.category.currentSelector = null;

        this.getDom().remove();
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

    // Close Btn
    if (showCloseBtn !== undefined && typeof showCloseBtn === 'boolean' && !showCloseBtn) {
        dom.find('.close-btn').remove();
    } else {
        dom.find('.close-btn').click(function () {
            obj.hide();
        });
    }

    dom.appendTo(appendingDom);

    return obj;
};

/* Api Actions */
app.category.categoriesDownload = function (onSuccess, onError) {
    onSuccess = onSuccess || function () {
    };
    onError = onError || function () {
    };

    $.ajax({
        url: '/getCategories', beforeSend: function () {},
        success: function (data) {
            if (!!data['success']) {
                app.data.categoris = data['data']['categories'];
                app.notify.success('类目列表成功更新');
                onSuccess(data);
            } else {
                app.notify.error(data['msg']);
                app.notify.error('服务器程序错误，类目列表无法失败');
                onError();
            }
        }, error: function () {
            app.notify.error('网络错误，类目列表无法失败');
            onError();
        }
    });
};

app.category.booksDownload = function (categoryData, onSuccess, onError) {
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
                if (app.category.currentSelector !== null) {
                    app.category.currentSelector.update();
                    app.category.currentSelector.setLoading(false);
                }

                app.notify.success('类目' + categoryData['name'] + ' 图书数据成功获取');
                onSuccess(data);
            } else {
                if (app.category.currentSelector !== null) {
                    app.category.currentSelector.setLoading(false);
                }

                app.notify.error(data['msg']);
                app.notify.error('服务器程序错误，类目图书无法获取');
                onError();
            }
        }, error: function () {
            if (app.category.currentSelector !== null) {
                app.category.currentSelector.setLoading(false);
            }

            app.notify.error('网络错误，类目图书无法获取');
            onError();
        }
    });
};

app.category.uploadData = function (categoryName, categoryBooksArr, onSuccess, onError) {
    onSuccess = onSuccess || function () {
    };
    onError = onError || function () {
    };

    var data = {};
    data[categoryName] = categoryBooksArr;
    var json = JSON.stringify(data);
    $.ajax({
        url: '/uploadCategoryBooks', method: 'POST', data: {
            'registrarName': app.data.registrarName,
            'booksInCategoriesJson': json
        }, beforeSend: function () {

        }, success: function (data) {
            if (!!data['success']) {
                app.notify.success(data['msg']);
                onSuccess();
                // 更新类目列表
                if (app.category.currentSelector !== null)
                    app.category.currentSelector.updateFromServer();
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
};

/* Work */
app.work = {
    hot: null,
    dom: $(),
    workTableDom: $(),
    init: function () {
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
                items: {
                    'cut'  : {name: '剪切* (Ctrl+X)'},
                    'copy' : {name: '复制* (Ctrl+C)'},
                    'paste': {name: '粘贴* (Ctrl+V)'},
                    'undo' : {name: '撤销 (Ctrl+Z)'},
                    'redo' : {name: '重做 (Ctrl+Y)'}
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
            var returnValue = "数据保存了吗？真的要离开吗？";
            eventObject.returnValue = returnValue;
            return returnValue;
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

    saveCurrent: function () {
        if (this.hot === null) {
            app.notify.warning('Handsontable 还未实例化');
            return;
        }

        if (!window.confirm('在保存数据之前，请确认数据无误，是否继续？')){
            return;
        }

        app.work.hot.deselectCell();
        var tableData = this.hot.getSourceData();
        var updateData = this.handleTableDataUploadUse(tableData);
        app.category.uploadData(app.data.currentCategoryName, updateData, function () {

        });
    },

    exitWork: function() {
        if (!window.confirm('数据保存了吗？是否真的要退出？')){
            return;
        }

        window.location.reload();
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

        timeout = (timeout !== undefined && typeof timeout === 'number') ? timeout : 2000;

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

var appUtils = {
    timeAgo: function (date) {
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
        } else if ((time < 60 * 60 * 24 * 7) && (time >= 60 * 60 * 24)) {
            // 超过1天少于7天内
            s = Math.floor(time / 60 / 60 / 24);
            return s + " 天前";
        } else {
            // 超过3天
            var dateObj = new Date(parseInt(date) * 1000);
            return dateObj.getFullYear() + "/" + (dateObj.getMonth() + 1) + "/" + dateObj.getDate();
        }
    },
    checkLocalTime: function () {
        $.ajax({
            url: '/getTime', beforeSend: function () {

            }, success: function (data) {
                if (!!data['success']) {
                    var serverTime = data['data']['time'];
                    var serverTimeFormat = data['data']['time_format'];
                    console.log('服务器当前时间：' + serverTimeFormat);
                    // 获取 js 时间戳
                    var time = new Date().getTime();
                    // 去掉 js 时间戳后三位，与 php 时间戳保持一致
                    time = parseInt((time - serverTime * 1000) / 1000);
                    // 若时差超过3小时
                    if (Math.floor(time / 60 / 60) >= 1 || Math.floor(time / 60 / 60) <= -1) {
                        app.notify.warning('当前本地时间快了 ' + Math.floor(time / 60 / 60) + ' 小时，请调整本地时间为 ' + serverTimeFormat)
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