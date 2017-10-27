/* Zneiat/library-register-server */
$(document).ready(function () {
    appUtils.checkLocalTime();

    app.data.register();
    app.main.register();
    app.editor.register();

    app.notify.info('程序初始化完毕');
    app.notify.setShowEnabled(true);

    app.pageLoader.hide();

    appHelp.init();
});

var app = {};

app.pageLoader = {
    sel: '#pageLoaderLayer',
    show: function (text) {
        text = text || '加载中...';
        var dom = $(this.sel);
        dom.find('.loading-text').html(text);
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
    categoryHandle: function (categoryName, handle) {
        for (var i in this.categoris) {
            if (this.categoris[i]['name'] === categoryName) {
                handle(this.categoris[i]);
                break;
            }
        }
    },
    categoryBookHandle: function (categoryName, booksNumbering, handle) {
        this.categoryHandle(categoryName, function (category) {
            for (var i in category['books']) {
                var book = category['books'][i];
                if (book['numbering'] === booksNumbering) {
                    handle(book);
                    break;
                }
            }
        });
    }
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
        this.categoryList.update();
    },

    toggleLogin: function () {
        this.loginDom.find('#yourName').val(app.data.getUser());
        this.dom.removeClass('large-size');
    },

    updateHead: function () {
        // Update User Info
        this.headDom.find('.user-name-text').text(app.data.getUser());

        if (!!app.data.getUser()) {
            var headBookTotalText = app.main.headDom.find('.book-total-text');
            headBookTotalText.text('加载中...');
            app.api.getUser(app.data.getUser(), function (data) {
                headBookTotalText.text(data['book_total'] + ' 本书');
            }, function () {
                headBookTotalText.text('获取失败...');
            });
        }
    },

    show: function () {
        this.wrap.show();
    },

    hide: function () {
        this.wrap.hide();
    },

    uploadBooks: function () {
        app.api.uploadCategory();
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
        '<span data-toggle="refresh-data"><i class="zmdi zmdi-refresh"></i> 刷新列表</span>' +
        '<span data-toggle="upload-books"><i class="zmdi zmdi-cloud-upload"></i> 上传数据</span>' +
        '<span><a href="/categoryExcel"><i class="zmdi zmdi-download"></i> 数据导出</a></span>' +
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

    // Upload Books
    dom.find('[data-toggle="upload-books"]').click(function () {
        app.main.uploadBooks();
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
                '<div class="item col-sm-6 col-md-3' + (item.isMine() ? ' is-mine' : '') + '' +
                (String(item['remarks']).indexOf('已完成') >= 0 ? ' is-completed' : '') +
                '" data-category-index="' + index + '">' +
                '<div class="item-inner">' +
                '<div class="item-head">' +
                '<span class="category-name">' +
                appUtils.htmlEncode(item['name'] || "未命名") +
                '</span>' +
                '</div>' +
                '<div class="item-desc">' +
                '<span title="登记员"><i class="zmdi zmdi-account"></i> ' + appUtils.htmlEncode(item['user'] || "未知") + '</span>' +
                '<span title="更新时间"><i class="zmdi zmdi-time"></i> ' + appUtils.timeAgo(item['updated_at']) + '</span>' +
                '<!--<span title="创建时间"><i class="zmdi zmdi-time"></i> ' + appUtils.timeAgo(item['created_at']) + '</span>-->' +
                '</div>' +
                '</div>' +
                '</div>'
            );
            itemDom.click(function () {
                obj.onItemClick($(this).attr('data-category-index'));
            });
            itemDom.appendTo(contentDom);

            // 滚动归零
            contentDom.scrollTop(0);
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
    isWorkStarted: false,
    currentCategoryIndex: null,
    currentCategoryObj: null,
    currentCategoryBooks: null,
    getCurrentCategoryName: function () {
        return !!this.currentCategoryObj ? this.currentCategoryObj['name'] || '' : '';
    },
    getLastNumbering: function () {
        return !!this.currentCategoryBooks ? this.currentCategoryBooks.length : '';
    },
    isSaved: false,
    currentBookIndex: 0,
    getLocalData: function () {
        return JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
    },
    setLocalData: function (obj) {
        window.localStorage ? localStorage.setItem(this.localStorageKey, JSON.stringify(obj)) : null;
    },
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
    bookRedirectInputDom: $(),
    preBookBtnDom: $(),
    nxtBookBtnDom: $(),
    bookListDom: $(),
    bookListContentDom: $(),

    toolBarDom: $(),

    register: function () {
        this.isWorkStarted = false;

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

        this.initToolBar();
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

        this.isWorkStarted = true;

        this.currentCategoryIndex = categoryDataIndex;
        this.currentCategoryObj = category;
        this.currentCategoryBooks = category['books'];
        this.isSaved = false;
        var bookCount = this.currentCategoryBooks.length;
        this.currentBookIndex = (bookCount > 0) ? bookCount - 1 : 0;

        // 同步本地的修改
        app.editor.syncLocalModified();

        this.refreshBookList();
        this.initInserter();
        this.bindKey();

        app.main.hide();
        this.wrapDom.show();
    },
    initToolBar: function () {
        this.toolBarDom = $('.editor-tool-bar');
        this.toolBarDom.find('[data-toggle="exit"]').click(function () {
            app.editor.exit();
        });
        this.toolBarDom.find('[data-toggle="updateBooks"]').click(function () {
            app.editor.updateBooksFromServer();
        });
        this.toolBarDom.find('[data-toggle="upload"]').click(function () {
            app.main.uploadBooks();
        });
    },
    initInserter: function () {
        if (this.getLastNumbering() <= 0) // 如果一本书都没有
            this.addNewBook();

        // 跳转编辑最后一本书
        app.editor.redirectBook(this.getLastNumbering() - 1);

        // 图书焦点控制按钮
        this.preBookBtnDom.click(function () {
            app.editor.preBook();
        });
        this.inserterDom.submit(function () {
            app.editor.nxtBook();
        });

        // 快速跳转功能
        var beforeVal = null;
        this.bookRedirectInputDom = this.currentBookInfoDom.find('.numbering');
        var bookRedirectInputDom = this.bookRedirectInputDom;
        var bookRedirectBlur = function () {
            var val = bookRedirectInputDom.val();
            if (!isNaN(val) && Number(val) >= 1) {
                app.editor.redirectBook(Number(val) - 1);
            } else {
                if (beforeVal !== null)
                    bookRedirectInputDom.val(beforeVal);
            }
            beforeVal = null;
        };
        bookRedirectInputDom.focus(function () {
            beforeVal = bookRedirectInputDom.val();
            bookRedirectInputDom.select();
        }).blur(function () {
            bookRedirectBlur();
        }).bind('keydown.editor_redirect_book', function(e) {
            if (e.which === 13) {
                bookRedirectBlur();
                e.preventDefault();
            }
        });

        // 自动填充
        this.enableInputAutoComplete(this.inputDoms.name);
        this.enableInputAutoComplete(this.inputDoms.press);
        this.enableInputAutoComplete(this.inputDoms.remarks);
    },
    uninitInserter: function () {
        this.clearInputs();
        this.preBookBtnDom.unbind('click');
        this.inserterDom.unbind('submit');
        this.currentBookInfoDom.find('.numbering')
            .unbind('onfocus')
            .unbind('onblur');
        this.bookRedirectInputDom = $();
    },
    refreshInserter: function () {
        var bookIndex = this.currentBookIndex;
        var bookNumbering = bookIndex + 1;
        this.currentBookInfoDom.find('.category-name')
            .text(this.getCurrentCategoryName());
        this.currentBookInfoDom.find('.numbering')
            .val((bookNumbering));
        this.clearInputs();
        var book = this.currentCategoryBooks[bookIndex];
        if (!!book) {
            var nameVal = !!book.name ? book.name : '',
                pressVal = !!book.press ? book.press : '',
                remarksVal = !!book.remarks ? book.remarks : '';
            this.setInputsVal(nameVal, pressVal, remarksVal);
        } else {
            this.setInputsVal('', '', '');
        }
        this.inputDoms.name.focus();
        // BookListItem Focus
        this.bookListContentDom.find('.edit-focused').removeClass('edit-focused');
        var itemDom = this.getBookListItemDom(bookNumbering);
        itemDom.addClass('edit-focused');
        // BookList Scroll
        var scrollTo = bookNumbering < this.getLastNumbering() ? bookNumbering + 4 : bookNumbering;
        this.scrollToBookListItem(scrollTo);
    },
    preBook: function () {
        if (this.currentBookIndex <= 0) {
            app.notify.info('没有上一本书了...');
            return;
        }

        this.redirectBook(this.currentBookIndex - 1);
    },
    nxtBook: function () {
        /*if (this.currentBookIndex >= this.getLastNumbering() - 1) {
            app.notify.info('没有下一本书了...');
            return;
        } // 怎么可能没有？不存在的！！无限！！ */

        this.redirectBook(this.currentBookIndex + 1);
    },
    setInputsVal: function (name, press, remarks) {
        this.inputDoms.name.val(name || '');
        this.inputDoms.press.val(press || '');
        this.inputDoms.remarks.val(remarks || '');
    },
    clearInputs: function () {
        this.inputDoms.name.val('');
        this.inputDoms.press.val('');
        this.inputDoms.remarks.val('');
    },
    enableInputAutoComplete: function (inputDom) {
        var parentDom = this.inserterDom;

        var inputKey = inputDom.attr('name');
        var books = app.editor.currentCategoryBooks;

        var remove = function () {
            parentDom.find('.input-auto-complete-panel').remove();
            inputDom.unbind('keydown.editor_input_auto_complete');
        };
        var searchVal = function () {
            remove();

            var val = $.trim(inputDom.val());
            if (val.length <= 0) return;

            var group = [];
            for (var i in books) {
                var itemVal = $.trim(books[i][inputKey]);
                if (itemVal.indexOf(val) > -1 && group.indexOf(itemVal) <= -1) {
                    group.push(itemVal);
                }
            }

            if (group.length <= 0 || (group.length === 1 && group[0] === val))
                return;

            var panelDom = $('<div class="input-auto-complete-panel">' +
                '<div class="panel-options"></div>' +
                '</div>');

            var inputPos = $.getPosition(inputDom);
            panelDom.css('left', inputPos['left'] + 'px')
                .css('top', inputPos['bottom'] + 'px')
                .css('width', inputPos['width'] + 'px');

            panelDom.on('mousedown', function(event) {
                event.preventDefault();
            });

            var optionsDom = panelDom.find('.panel-options');
            for (var indexGroup in group) {
                var optionText = group[indexGroup];
                $('<div class="panel-option-item" data-key="' + indexGroup + '"></div>')
                    .data('content', optionText)
                    .html(optionText.replace(val, function(matched) {
                        return '<span class="highlight">' + appUtils.htmlEncode(matched) + '</span>'
                    }))
                    .click(function () {
                        inputDom.val($(this).data('content'));
                        remove();
                    })
                    .appendTo(optionsDom);
            }

            panelDom.appendTo(parentDom);

            // 键盘控制
            var currentFocusedIndex = -1;
            var clearFocused = function () {
                optionsDom.find('.focused').removeClass('focused');
            };
            var setFocused = function () {
                clearFocused();
                var optionDom = optionsDom.find('[data-key="' + currentFocusedIndex + '"]');
                optionDom.addClass('focused');
                if (!!optionDom.offset())
                    panelDom.scrollTop(optionDom.offset().top - optionsDom.offset().top);
            };
            inputDom.bind('keydown.editor_input_auto_complete', function(e) {
                switch(e.which) {
                    case 13: // enter
                        if (currentFocusedIndex <= -1)
                            return; // allow raw enter

                        optionsDom.find('.focused').click();
                        break;
                    case 38: // up
                        if (currentFocusedIndex <= -1)
                            break;

                        currentFocusedIndex--;
                        setFocused();
                        break;
                    case 40: // down
                        if (currentFocusedIndex >= group.length - 1)
                            break;

                        currentFocusedIndex++;
                        setFocused();
                        break;

                    default: return;
                }
                e.preventDefault();
            });
        };
        inputDom.bind('input propertychange', function () {
            setTimeout(function () {
                searchVal();
            }, 20);
        });
        inputDom.focus(function () {
            setTimeout(function () {
                searchVal();
            }, 20);
        });
        inputDom.blur(function () {
            remove();
        });
    },
    addNewBooksFilling: function (lastNumbering) {
        // 补充数据
        if (lastNumbering <= this.getLastNumbering())
            return;

        for (var newBookNumbering = this.getLastNumbering() + 1; newBookNumbering <= lastNumbering; newBookNumbering++) {
            this.addNewBook();
        }
    },
    addNewBook: function () {
        var newBookNumbering = this.getLastNumbering() + 1;
        var length = this.currentCategoryBooks.push({numbering: newBookNumbering.toString(), name: '', press: '', remarks: ''});
        var index = length - 1;
        var itemDom = this.bookListItemRender(index, this.currentCategoryBooks[index]);
        itemDom.prependTo(this.bookListContentDom);
    },
    saveCurrentBook: function () {
        var inputName = $.trim(this.inputDoms.name.val());
        var inputPress = $.trim(this.inputDoms.press.val());
        var inputRemarks = $.trim(this.inputDoms.remarks.val());

        var categoryName = this.getCurrentCategoryName();
        var rawBookData = this.currentCategoryBooks[this.currentBookIndex];
        if (!rawBookData) {
            app.notify.error('当前图书 index=' + this.currentBookIndex + ' 原始数据不存在，无法保存');
            return;
        }

        var bookNumbring = rawBookData.numbering;
        var isNameModified = (inputName.length > 0 && inputName !== rawBookData['name']);
        var isPressModified = (inputPress.length > 0 && inputPress !== rawBookData['press']);
        var isRemarksModified = (inputRemarks.length > 0 && inputRemarks !== rawBookData['remarks']);
        if ((isNameModified || isPressModified || isRemarksModified)) {
            // 修改源数据
            rawBookData.name = inputName;
            rawBookData.press = inputPress;
            rawBookData.remarks = inputRemarks;

            // 存储修改记录
            var localData = this.getLocalData();
            if (!localData[categoryName])
                localData[categoryName] = {};
            var values = localData[categoryName][bookNumbring] || {};
            if (isNameModified) values.name = inputName;
            if (isPressModified) values.press = inputPress;
            if (isRemarksModified) values.remarks = inputRemarks;

            localData[categoryName][bookNumbring] = values;

            // 更新 BookList 中单个 item
            var itemDom = this.getBookListItemDom(bookNumbring);
            if (itemDom) {
                if (isNameModified) itemDom.find('.book-name').text(values.name);
                if (isPressModified) itemDom.find('.book-press').text(values.press);
                if (isRemarksModified) itemDom.find('.book-remarks').text(values.remarks);
            }

            // 保存到浏览器
            this.setLocalData(localData);
        }

        // console.log(this.getLocalData());
    },
    isInputsFocused: function () {
        var isFocused = this.inputDoms.name.is(':focus'),
            isFocused2 = this.inputDoms.press.is(':focus'),
            isFocused3 = this.inputDoms.remarks.is(':focus');

        return isFocused || isFocused2 || isFocused3;
    },
    bindKey: function() {
        $(document).bind('keydown.editor_keys', function(e) {
            if (e.ctrlKey && e.keyCode === 71) {
                // Ctrl + G
                app.editor.bookRedirectInputDom.focus();
                e.preventDefault();
            }
        });
    },
    unbindKey: function() {
        $(document).unbind('keydown.editor_keys');
    },
    redirectBook: function (bookIndex) {
        if (isNaN(bookIndex))
            return;

        // 在跳转之前 保存当前图书
        this.saveCurrentBook();

        bookIndex = Number(bookIndex);
        var bookNumbering = bookIndex + 1;

        // 补充数据
        this.addNewBooksFilling(bookNumbering);

        this.currentBookIndex = bookIndex;
        this.refreshInserter();
    },
    refreshBookList: function () {
        var dom = this.bookListContentDom;
        dom.html('');

        for (var i = this.currentCategoryBooks.length - 1; i >= 0; i--) {
            this.bookListItemRender(i, this.currentCategoryBooks[i]).appendTo(dom);
        }

        dom.unbind('click.editor_book_list');
        dom.bind('click.editor_book_list', function (e) {
            var dom = $(e.target);
            if (dom.is('.numbering') && !!dom.closest('.list-item').length) {
                var numbering = Number(dom.closest('.list-item').attr('data-numbering'));
                app.editor.redirectBook(numbering - 1);
            }
        });
    },
    bookListItemRender: function (index, item) {
        var numbering = item['numbering'],
            numberingFull = app.editor.getCurrentCategoryName() + ' ' + numbering,
            bookName = item['name'],
            bookPress = item['press'],
            bookRemarks = item['remarks'];

        var itemDom = $(
            '<div class="list-item" data-numbering="' + numbering + '">' +
            '<span class="numbering"></span>' +
            '<span class="book-name"></span>' +
            '<span class="book-press"></span>' +
            '<span class="book-remarks"></span>' +
            '</div>'
        );

        itemDom.find('.numbering').text(numberingFull);
        itemDom.find('.book-name').text(bookName);
        itemDom.find('.book-press').text(bookPress);
        itemDom.find('.book-remarks').text(bookRemarks);

        return itemDom;
    },
    getBookListItemDom: function (numbering) {
        return this.bookListContentDom.find('[data-numbering=' + numbering + ']');
    },
    scrollToBookListItem: function (numbering) {
        var itemDom = this.getBookListItemDom(numbering <= this.getLastNumbering() ? numbering : this.getLastNumbering());
        var scrollTop = (itemDom.offset().top - app.editor.bookListContentDom.offset().top);
        this.bookListDom.stop(true).animate({scrollTop: scrollTop}, 150);
        // this.bookListDom.stop(true).scrollTop(scrollTop);
    },
    updateBooksFromServer: function() {
        var index = this.currentCategoryIndex;
        app.pageLoader.show('正在更新图书数据');
        app.api.getCategoryBooks(index, function () {
            app.pageLoader.hide();
            app.editor.exit();
            app.editor.startWork(index);
            app.notify.success('已更新');
        }, function () {
            app.pageLoader.hide();
            app.notify.error('更新失败');
        });
    },
    syncLocalModified: function () {
        var categoryName = this.getCurrentCategoryName();
        var localData = this.getLocalData();
        var bookModifieds = localData[categoryName];
        if (!bookModifieds)
            return;

        var lastNumbering = (function () {
            var max = 0;
            for (var numbering in bookModifieds) {
                numbering = Number(numbering);
                if (numbering > max) max = numbering;
            }
            return max;
        })();

        if (lastNumbering <= 0)
            return;

        // 补充数据
        this.addNewBooksFilling(lastNumbering);

        for (var numbering in bookModifieds) {
            for (var key in bookModifieds[numbering]) {
                this.currentCategoryBooks[numbering - 1][key] = bookModifieds[numbering][key];
            }
        }
    },
    exit: function () {
        this.saveCurrentBook(); // 保存当前修改图书

        this.wrapDom.hide();
        app.main.show();

        this.uninitInserter();
        this.unbindKey();

        this.isWorkStarted = false;

        this.currentCategoryIndex = null;
        this.currentCategoryObj = null;
        this.currentCategoryBooks = null;
        this.isSaved = false;
        this.currentBookIndex = 0;
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

    uploadCategory: function () {
        if (app.editor.isWorkStarted) {
            // 保存当前编辑
            app.editor.saveCurrentBook();
        }

        var localData = app.editor.getLocalData();
        if (!localData || $.isEmptyObject(localData)) {
            app.notify.info('没有修改数据，无需上传');
            return;
        }

        app.pageLoader.show('正在上传数据<br/>请勿关闭浏览器');

        var json = JSON.stringify(localData);

        $.ajax({
            url: '/uploadCategory', method: 'POST', data: {
                'user': app.data.getUser(),
                'books': json
            }, success: function (data) {
                app.pageLoader.hide();
                var resp = app.api.responseHandle(data);
                if (resp.checkMakeNotify()) {
                    // 数据修改 清空
                    app.editor.setLocalData({});
                }
            }, error: function () {
                app.pageLoader.hide();
                app.notify.error('网络错误，图书数据无法上传');
            }
        });
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

$.extend({
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
    },
    sprintf: function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    }
});