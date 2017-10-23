/* Zneiat/library-register-server */
$(document).ready(function () {
    appUtils.checkLocalTime();

    app.data.register();
    app.main.register();
    app.editor.register();

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
    categoris: {}
};

/* Main */
app.main = {
    dom: $(),
    wrap: $(),
    headDom: $(),
    loginDom: $(),
    categoryListDom: $(),
    categoryList: null,

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
        this.categoryListInit(this.categoryListDom);
        this.categoryList.updateFromServer(); // Update Category Data

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
        this.updateHead();
    },

    toggleLogin: function () {
        this.loginDom.find('#yourName').val(app.data.getUser());
        this.dom.removeClass('large-size');
    },

    updateHead: function () {
        // Update User Info
        this.headDom.find('.user-name-text').text(app.data.getUser());

        var headBookTotalText = app.main.headDom.find('.book-total-text');
        headBookTotalText.text('加载中...');
        app.api.getUser(app.data.getUser(), function (data) {
            headBookTotalText.text(data['book_total'] + ' 本书');
        }, function () {
            headBookTotalText.text('获取失败...');
        });
    },

    show: function () {
        this.wrap.show();
    },

    hide: function () {
        this.wrap.hide();
    }
};

/* Category > Selector Builder */
app.main.categoryListInit = function (appendingDom) {
    var obj = {};

    var dom = $(
        '<div class="category-list">' +

        '<div class="list-head">' +
        '<span class="title">书籍类目列表</span>' +
        '<span class="part-right">' +
        '<span class="list-search">' +
        '<input type="text" class="form-control" placeholder="搜索类目..." autocomplete="off" spellcheck="false">' +
        '</span>' +
        '<span class="list-actions">' +
        '<span data-toggle="refresh-data"><i class="zmdi zmdi-refresh"></i> 刷新</span>' +
        '<span><a href="/categoryExcel"><i class="zmdi zmdi-download"></i> 下载数据</a></span>' +
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
        app.main.createCategoryDialog();
    });

    // Refresh Data Btn
    dom.find('[data-toggle="refresh-data"]').click(function () {
        app.main.categoryList.updateFromServer();
    });

    // Category Search
    dom.find('.list-search > input').bind('input propertychange', function() {
        var value = $.trim($(this).val());
        if (value.length > 0) {
            var categoryData = [];
            for (var i in app.data.categoris) {
                var item = app.data.categoris[i];
                if ($.trim(item['name']).toUpperCase().indexOf(value) >= 0) {
                    categoryData[i] = item;
                }
            }
            app.main.categoryList.update(categoryData);
        } else {
            app.main.categoryList.update();
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

        app.main.updateHead();
    };

    obj.update = function (categoryData) {
        var contentDom = dom.find('.list-content');
        var categories = categoryData || app.data.categoris;
        contentDom.html('');
        var itemRender = function (index, item) {
            var itemDom = $(
                '<div class="item' + (item.isMine() ? ' is-mine' : '') + '' +
                (String(item['remarks']).indexOf('已完成') >= 0 ? ' is-completed' : '') +
                '" data-category-index="' + index + '">' +
                '<div class="item-head">' +
                '<span class="category-name">' +
                appUtils.htmlEncode(item['name'] || "未命名") +
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
        for (var indexMine in categories) {
            var itemMine = categories[indexMine];
            if (!itemMine.isMine()) continue;
            itemRender(indexMine, itemMine);
        }
        // 非我负责的
        for (var index in categories) {
            var item = categories[index];
            if (item.isMine()) continue;
            itemRender(index, item);
        }

        return true;
    };

    obj.onItemClick = function (categoryDataIndex) {
        var categoryData = app.data.categoris[categoryDataIndex];
        if (!categoryData) {
            app.notify.error('类目是不存在的，index=' + categoryDataIndex);
            return;
        }

        var categoryName = categoryData['name'];
        if (!categoryName) {
            app.notify.error('不知名的类目...');
            return;
        }

        var startWork = function () {
            obj.setLoading(true);
            app.api.getCategoryBooks(categoryDataIndex, function () {
                // 当图书数据下载完毕
                obj.update();
                obj.setLoading(false);

                // 正式开始工作
                app.editor.startWork(categoryDataIndex);
            }, function () {
                obj.setLoading(false);
                app.notify.error('无法打开该类目');
            });
        };

        startWork();
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

    this.categoryList = obj;
};

app.main.createCategoryDialog = function () {
    var dom = $(
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
    dom.find('.dialog-close-btn').click(function () {
        dom.remove();
    });
    dom.find('.create-category-form').submit(function () {
        var input = dom.find('#categoryName');
        var inputVal = $.trim(input.val());
        if (inputVal.length <= 0) { input.focus();return; }
        app.dialog.build('创建新的类目', '请确认类目名 ' + appUtils.htmlEncode(inputVal) + ' 准确无误', ['立刻创建', function () {
            app.main.categoryList.setLoading(true);
            app.api.categoryCreate(inputVal, function () {
                app.main.categoryList.updateFromServer();
            }, function () {
                app.main.categoryList.updateFromServer();
            });
            dom.remove();
        }], ['返回修改']);
    });

    dom.appendTo('body');
};

/* Editor */
app.editor = {
    currentCategoryIndex: null,
    currentCategoryObj: null,
    currentCategoryBooks: null,
    getCurrentCategoryName: function () {
        return !!this.currentCategoryObj ? this.currentCategoryObj['name'] || '' : '';
    },
    isSaved: false,
    currentBookIndex: 0,
    localData: [],
    localStorageKey: 'editor_local_data',

    dom: $(),
    wrapDom: $(),
    inserterDom: $(),
    inputDoms: {
        name: $(),
        press: $(),
        remarks: $()
    },
    currentBookInfoDom: $(),
    preBookBtnDom: $(),
    nxtBookBtnDom: $(),
    bookListDom: $(),
    bookListContentDom: $(),

    register: function () {
        if (window.localStorage)
            this.localData = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');

        this.dom = $('.editor');
        this.wrapDom = $('.editor-wrap');

        this.inserterDom = $('.editor-inserter');
        this.inputDoms.name = this.inserterDom.find('[name="name"]');
        this.inputDoms.press = this.inserterDom.find('[name="press"]');
        this.inputDoms.remarks = this.inserterDom.find('[name="remarks"]');
        this.currentBookInfoDom = this.inserterDom.find('.current-book-info');
        this.preBookBtnDom = this.inserterDom.find('.pre-book-btn');
        this.nxtBookBtnDom = this.inserterDom.find('.nxt-book-btn');

        this.bookListDom = $('.editor-book-list');
        this.bookListContentDom = this.bookListDom.find('.list-content');
    },
    startWork: function (categoryDataIndex) {
        var category = app.data.categoris[categoryDataIndex];
        if (!category) {
            app.notify.error('类目是不存在的，index=' + categoryDataIndex);return;
        }
        var categoryName = category['name'];
        if (!categoryName || typeof(categoryName) !== 'string' || $.trim(categoryName).length <= 0) {
            app.notify.error('index=' + categoryDataIndex + ' 的类目，名称为 NULL');return;
        }

        this.currentCategoryIndex = categoryDataIndex;
        this.currentCategoryObj = category;
        this.currentCategoryBooks = category['books'];
        this.isSaved = false;
        this.currentBookIndex = 0;

        this.preBookBtnDom.click(function () {
            app.editor.preBook();
        });
        this.inserterDom.submit(function () {
            app.editor.nxtBook();
        });

        this.bindKey();
        this.refreshInserter();
        this.refreshBookList();

        app.main.hide();
        this.wrapDom.show();
    },
    refreshInserter: function () {
        this.currentBookInfoDom.find('.category-name')
            .text(this.getCurrentCategoryName());
        this.currentBookInfoDom.find('.numbering')
            .val((this.currentBookIndex + 1));
        this.clearInputs();
        this.inputDoms.name.focus();
    },
    clearInputs: function () {
        this.inputDoms.name.val('');
        this.inputDoms.press.val('');
        this.inputDoms.remarks.val('');
    },
    preBook: function () {
        if (this.currentBookIndex <= 0) {
            app.notify.info('没有上一本书了...');
            return;
        }

        this.saveCurrentBook();
        this.currentBookIndex--;
        this.refreshInserter();
    },
    nxtBook: function () {
        if (this.currentBookIndex >= 29) {
            app.notify.info('没有下一本书了...');
            return;
        }

        this.saveCurrentBook();
        this.currentBookIndex++;
        this.refreshInserter();
    },
    refreshBookList: function () {
        var dom = this.bookListContentDom;
        dom.html('');

        for (var i = this.currentCategoryBooks.length - 1; i >= 0; i--) {
            this.bookListItemRender(i, this.currentCategoryBooks[i]).appendTo(dom);
        }
    },
    bookListItemRender: function (index, item) {
        var numbering = app.editor.getCurrentCategoryName() + ' ' + item['numbering'],
            bookName = item['name'],
            bookPress = item['press'],
            bookRemarks = item['remarks'];

        var itemDom = $(
            '<div class="list-item">' +
            '<span class="numbering">' + numbering + '</span>' +
            '<span class="book-name">' + bookName + '</span>' +
            '<span class="book-press">' + bookPress + '</span>' +
            '<span class="book-remarks">' + bookRemarks + '</span>' +
            '</div>'
        );

        return itemDom;
    },
    saveCurrentBook: function () {

    },
    bindKey: function () {
        $(document).bind('keydown.app_editor', function(e) {
            switch(e.which) {
                case 37: // left
                    if (app.editor.isInputsFocused()) return;
                    alert('1');
                    break;

                case 39: // right
                    if (app.editor.isInputsFocused()) return;
                    alert('2');
                    break;

                default: return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
    },
    unbindKey: function () {
        $(document).unbind('keydown.app_editor');
    },
    isInputsFocused: function () {
        var isFocused = this.inputDoms.name.is(':focus'),
            isFocused2 = this.inputDoms.press.is(':focus'),
            isFocused3 = this.inputDoms.remarks.is(':focus');

        return isFocused || isFocused2 || isFocused3;
    },
    localDataLocalStorage: function () {
        window.localStorage ? localStorage.setItem(this.localStorageKey, JSON.stringify(this.localData)) : null;
    },
    exit: function () {
        this.wrapDom.hide();
        app.main.show();

        this.currentCategoryIndex = null;
        this.currentCategoryObj = null;
        this.isSaved = false;
        this.currentBookIndex = 0;

        this.clearInputs();
        this.unbindKey();
        this.preBookBtnDom.unbind('click');
        this.inserterDom.unbind('submit');
    }
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
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，用户资料无法失败');
                onError();
            }
        });
    },

    handleCategoryData: function (item) {
        item.isMine = function () {
            return !!this.user && this.user === app.data.getUser();
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
                    for (var i in data['categories']) {
                        var item = data['categories'][i];
                        app.api.handleCategoryData(item);
                    }
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

    categoryCreate: function (categoryName, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/categoryCreate', data: {
                'name': categoryName,
                'user': app.data.getUser()
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                if (resp.checkMakeNotify()) {
                    onSuccess(data);
                } else {
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，类目无法创建');
                onError();
            }
        });
    },

    getCategoryBooks: function (categoryDataIndex, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        if (!app.data.categoris.hasOwnProperty(categoryDataIndex)) {
            app.notify.error('找不到 index=' + categoryDataIndex + ' 的类目');
            return;
        }

        var categoryData = app.data.categoris[categoryDataIndex];

        $.ajax({
            url: '/getCategory', data: {
                'name': categoryData['name']
            }, success: function (data) {
                var resp = app.api.responseHandle(data);
                data = resp.checkGetData();
                if (!!data) {
                    // 更新类目列表数据
                    app.data.categoris[categoryDataIndex] = data['categories'][0];
                    app.api.handleCategoryData(app.data.categoris[categoryDataIndex]);
                    onSuccess(data);
                } else {
                    onError();
                }
            }, error: function () {
                app.notify.error('网络错误，类目图书无法下载');
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