/* Editor */
"use strict";
app.editor = {
    _wrapElem: $(),
    instance: null,

    register: function () {
        this._wrapElem = $('.editor-wrap');
    },

    startWork: function (categoryIndex, opts) {
        // language=HTML
        this._wrapElem.html('<div class="editor">\n    <div class="editor-tool-bar">\n        <div class="left-part">\n            <span class="title">编辑</span>\n        </div>\n        <div class="right-part">\n            <span class="action-item" data-toggle="exit"><i class="zmdi zmdi-arrow-left"></i> 返回</span>\n            <span class="action-item" data-app-help="editor"><i class="zmdi zmdi-help"></i> 说明</span>\n            <span class="action-item" data-toggle="refresh"><i class="zmdi zmdi-refresh"></i> 更新</span>\n            <span class="action-item" data-toggle="upload"><i class="zmdi zmdi-cloud-upload"></i> 上传 <span class="local-data-count">0</span></span>\n        </div>\n    </div>\n    <form class="editor-inserter" onsubmit="return false;">\n        <div class="numbering-controller left-part">\n            <span class="current-book-info">\n                <span class="category-name">?</span>\n                <input type="text" class="numbering" autocomplete="off" spellcheck="false" />\n            </span>\n            <button type="button" class="pre-book-btn"></button>\n        </div>\n        <div class="fields-inputs">\n            <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="name" placeholder="书名" />\n            <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="press" placeholder="出版社" />\n            <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="remarks" placeholder="备注" />\n        </div>\n        <div class="numbering-controller right-part">\n            <button type="submit" class="nxt-book-btn"></button>\n        </div>\n    </form>\n    <div class="editor-book-list">\n        <div class="list-content"></div>\n    </div>\n</div>');

        this._wrapElem.find('[data-app-help="editor"]').click(function () {
            appHelp.editor.show();
        });

        var instance = this.instance = new this.work(categoryIndex, opts);
        instance.hooks.onExit = function () {
            app.editor.exitWork();
        };

        app.main.hide();
        this._wrapElem.show();
    },

    exitWork: function () {
        this.instance = null;
        this._wrapElem.hide();
        this._wrapElem.html('');

        app.main.show();
    }
};

app.editor.work = function (categoryIndex, opts) {
    var _editorElem = $('.editor');
    var _work = this;

    _work.category =  app.data.categoris[categoryIndex];
    _work.books = _work.category.books;

    var _categoryName = _work.category.name;

    var _isCategorySaved = false;
    var _getLastBookNum = function () {
        return Object.keys(_work.books).length;
    };

    var _currentBook = _work._currentBook = {
        _currentBookNumbering: 0,
        getNum: function () { return this._currentBookNumbering; },
        setNum: function (numbering) { this._currentBookNumbering = Number(numbering); }
    };

    /**
     * Basic Methods
     */
    (function basicMethods() {
        // Reload
        _work.refresh = function (softRefresh) {
            _work.mergeBookLocal();
            _work.bookList.refresh();

            if (!softRefresh) {
                var lastBookNumbering = _getLastBookNum();
                if (lastBookNumbering > 0) {
                    _work.redirectBook(lastBookNumbering);
                } else {
                    _work.addEmptyBook();
                    _work.redirectBook(1);
                }
            } else {
                // Refresh inserter for current book show
                _work.inserter.refresh();
            }
        };

        // Exit
        _work.exit = function () {
            // 保存当前图书
            _work.inserter.saveInputs();
            _work.hooks.onExit();
        };

        // 跳转到指定 numbering 图书
        _work.redirectBook = function (numbering) {
            if (isNaN(numbering) || numbering < 0) return;
            numbering = Number(numbering);

            _work.fillBooks(numbering);
            _work.inserter.saveInputs();

            _currentBook.setNum(numbering);
            _work.inserter.refresh();
        };

        // 补充图书直到指定 numbering
        _work.fillBooks = function (lastNumbering) {
            var rawLastNumbering = _getLastBookNum();
            if (lastNumbering <= rawLastNumbering)
                return;

            for (var i = rawLastNumbering + 1; i <= lastNumbering; i++)
                _work.addEmptyBook();
        };

        // 新增一个新的空图书
        _work.addEmptyBook = function () {
            var numbering = _getLastBookNum() + 1;
            _work.books[numbering] = {
                numbering: String(numbering),
                name: '',
                press: '',
                remarks: ''
            };

            _work.bookList.insertRow(_work.books[numbering]);
        };

        // 用 local 覆盖原有的图书数据
        _work.mergeBookLocal = function () {
            if (!app.editor.local.isExist(_categoryName))
                return;

            var bookModifieds = app.editor.local.get(_categoryName);
            var lastNumbering = (function () {
                var max = 0;
                for (var numbering in bookModifieds) {
                    numbering = Number(numbering);
                    numbering > max ? max = numbering : null;
                }
                return max;
            })();

            if (lastNumbering <= 0) return;
            _work.fillBooks(lastNumbering);

            for (var numbering in bookModifieds) {
                for (var key in bookModifieds[numbering]) {
                    _work.books[numbering][key] = bookModifieds[numbering][key];
                }
            }
        };

        // 从远程刷新本地数据
        _work.refreshFromServer = function (onSuccess, onError) {
            onSuccess = onSuccess || function () {};
            onError = onError || function () {};

            _work.inserter.saveInputs();
            app.loadingLayer.show('正在更新图书数据');
            app.api.getCategoryBooks(categoryIndex, function () {
                app.loadingLayer.hide();
                _work.category = app.data.categoris[categoryIndex];
                _work.books = _work.category.books;
                _work.refresh(true);
                app.notify.success('更新完毕');
                onSuccess();
            }, function () {
                app.loadingLayer.hide();
                app.notify.error('更新失败');
                onError();
            });
        };
    })();

    /**
     * Toolbar
     */
    _work.toolbar = new (function toolbar() {
        var toolbarElem = _editorElem.find('.editor-tool-bar');

        toolbarElem.find('.title').text('编辑 类目 ' + _categoryName);
        toolbarElem.find('[data-toggle="exit"]').click(function () {
            _work.exit();
        });
        toolbarElem.find('[data-toggle="refresh"]').click(function () {
            _work.refreshFromServer();
        });
        toolbarElem.find('[data-toggle="upload"]').click(function () {
            _work.inserter.saveInputs();
            app.data.uploadBooks(function () {
                // 上传成功
                _work.refresh(true);
            });
        });
    })();

    /**
     * Inserter
     */
    _work.inserter = new (function inserter() {
        var inserter = this;
        var inserterElem = _editorElem.find('.editor-inserter');

        var numberingElem = inserterElem.find('.numbering');
        var categoryNameElem = inserterElem.find('.category-name');
        var preBtnElem = inserterElem.find('.pre-book-btn');
        var nxtBtnElem = inserterElem.find('.nxt-book-btn');

        var fieldInputElems = {
            name: inserterElem.find('[name="name"]'),
            press: inserterElem.find('[name="press"]'),
            remarks: inserterElem.find('[name="remarks"]')
        };

        // Refresh The Inserter
        inserter.refresh = function () {
            var numbering = _currentBook.getNum();

            categoryNameElem.text(_categoryName);
            numberingElem.val(numbering);

            var book = _work.books[numbering];
            if (!!book) {
                var nameVal = book.name || '';
                var pressVal = book.press || '';
                var remarksVal = book.remarks || '';
                inserter.setInputs(nameVal, pressVal, remarksVal);
            } else {
                inserter.setInputs('', '', '');
            }
            fieldInputElems.name.focus();

            // Book List Item Focus
            _work.bookList.focusItem(numbering);
        };

        (function numberingInput() {
            numberingElem.focus(function () {
                numberingElem.select();
            });

            numberingElem.blur(function () {
                var numebring = Number($.trim(numberingElem.val()));
                if (!isNaN(numebring))
                    _work.redirectBook(numebring > 1 ? numebring : 1);
                else
                    numberingElem.val(_currentBook.getNum());
            });

            numberingElem.bind('keydown.editor_redirect_book', function (e) {
                var numebring = Number($.trim(numberingElem.val()));
                switch (e.which) {
                    case 13:
                        numberingElem.blur();
                        break;
                    case 38:
                        if (!isNaN(numebring))
                            numberingElem.val(numebring + 1);
                        break;
                    case 40:
                        if (!isNaN(numebring))
                            numberingElem.val(numebring - 1);
                        break;
                    default: return;
                }
                e.preventDefault();
            });
        })();

        (function bookNavigation() {
            inserter.preBook = function () {
                var bookNumbering = _currentBook.getNum();
                if (bookNumbering <= 1) {
                    app.notify.info('没有上一本书了...');
                    return;
                }

                _work.redirectBook(bookNumbering - 1);
            };
            inserter.nxtBook = function () {
                _work.redirectBook(_currentBook.getNum() + 1);
            };

            preBtnElem.click(function () { _work.inserter.preBook(); });
            nxtBtnElem.click(function () { _work.inserter.nxtBook(); });
        })();

        (function bookFieldInputs() {
            inserter.setInputs = function (name, press, remarks) {
                fieldInputElems.name.val(name || '');
                fieldInputElems.press.val(press || '');
                fieldInputElems.remarks.val(remarks || '');
            };

            inserter.saveInputs = function () {
                var numbering = _currentBook.getNum();
                if (numbering <= 0 || numbering > _getLastBookNum()) return;

                var rawBook = _work.books[numbering];
                if (!rawBook) throw new Error('原始图书数据不存在 [numbering=' + numbering + ']');

                var saveBookToLocal = {}; // waiting for adding...
                for (var fieldName in fieldInputElems) {
                    if (!fieldInputElems.hasOwnProperty(fieldName)) continue;
                    if (!rawBook.hasOwnProperty(fieldName)) continue;
                    var value = $.trim(fieldInputElems[fieldName].val());
                    var isNull = value.length <= 0;
                    var isChanged = value !== rawBook[fieldName];

                    if (isChanged && !isNull) {
                        rawBook[fieldName] = value;
                        saveBookToLocal[fieldName] = value;
                    }

                    if (isChanged && isNull) {
                        // check remove from local
                        app.editor.local.remove(_categoryName, numbering, fieldName);
                        rawBook[fieldName] = '';
                    }
                }

                if (Object.keys(saveBookToLocal).length > 0) {
                    app.editor.local.put(_categoryName, numbering, saveBookToLocal);
                }

                // update book list item ui
                _work.bookList.notifyItemChanged(numbering);
            };

            var enableInputAutocomplete = function (fieldName) {
                var inputElem = fieldInputElems[fieldName];

                var hidePanel = function () {
                    inserterElem.find('.input-auto-complete-panel').remove();
                    inputElem.unbind('keydown.editor_input_auto_complete');
                };
                var showPanel = function () {
                    hidePanel();

                    var val = $.trim(inputElem.val());
                    if (val.length <= 0) return;

                    var group = [];
                    for (var i in _work.books) {
                        var itemVal = $.trim(_work.books[i][fieldName]);
                        if (itemVal.indexOf(val) > -1 && group.indexOf(itemVal) <= -1) group.push(itemVal);
                    }

                    if (group.length <= 0 || (group.length === 1 && group[0] === val)) return;

                    var panelElem = $('<div class="input-auto-complete-panel"><div class="panel-options"></div></div>');
                    var inputPos = $.getPosition(inputElem);
                    panelElem.css('left', inputPos['left'] + 'px')
                        .css('top', inputPos['bottom'] + 'px')
                        .css('width', inputPos['width'] + 'px');
                    panelElem.on('mousedown', function (event) { event.preventDefault(); });

                    var optionsDom = panelElem.find('.panel-options');
                    for (var indexGroup in group.reverse()) {
                        var optionText = group[indexGroup];
                        $('<div class="panel-option-item" data-key="' + indexGroup + '"></div>')
                            .data('content', optionText)
                            .html(optionText.replace(val, function(matched) {
                                return '<span class="highlight">' + $.htmlEncode(matched) + '</span>'
                            }))
                            .click(function () {
                                inputElem.val($(this).data('content'));
                                hidePanel();
                            })
                            .appendTo(optionsDom);
                    }

                    panelElem.appendTo(inserterElem);

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
                            panelElem.scrollTop(optionDom.offset().top - optionsDom.offset().top);
                    };
                    inputElem.bind('keydown.editor_input_auto_complete', function(e) {
                        switch(e.which) {
                            case 13: // enter
                                if (currentFocusedIndex <= -1) return; // allow raw enter
                                optionsDom.find('.focused').click();
                                break;
                            case 38: // up
                                if (currentFocusedIndex <= -1) break;
                                currentFocusedIndex--;
                                setFocused();
                                break;
                            case 40: // down
                                if (currentFocusedIndex >= group.length - 1) break;
                                currentFocusedIndex++;
                                setFocused();
                                break;

                            default: return;
                        }
                        e.preventDefault();
                    });
                };

                inputElem.bind('input propertychange', function () {
                    setTimeout(function () { showPanel(); }, 20);
                }).focus(function () {
                    setTimeout(function () { showPanel(); }, 20);
                }).blur(function () {
                    hidePanel();
                });
            };

            enableInputAutocomplete('name');
            enableInputAutocomplete('press');
            enableInputAutocomplete('remarks');
        })();
    });

    /**
     * Book List
     */
    _work.bookList = new (function bookList() {
        var bookList = this;
        var bookListElem = _editorElem.find('.editor-book-list');
        var bookListContentElem = bookListElem.find('.list-content');

        // Refresh the book list
        bookList.refresh = function () {
            bookListContentElem.html('');

            for (var i = _getLastBookNum(); i >= 1; i--) {
                var bookItem = _work.books[i];

                bookList.itemRender(bookItem)
                    .appendTo(bookListContentElem);
            }

            bookListContentElem
                .unbind('click.editor_book_list')
                .bind('click.editor_book_list', function (e) {
                    var element = $(e.target);
                    if (element.is('.numbering') && !!element.closest('.list-item').length) {
                        var numbering = element.closest('.list-item').attr('data-numbering');
                        _work.redirectBook(numbering);
                    }
                });

            // Book List Item Focus
            bookList.focusItem(_currentBook.getNum());
        };

        bookList.itemRender = function (book) {
            var numbering = book['numbering'],
                numberingFull = _categoryName + ' ' + numbering,
                bookName = book['name'] || '',
                bookPress = book['press'] || '',
                bookRemarks = book['remarks'] || '';

            var itemElem = $(
                '<div class="list-item" data-numbering="' + numbering + '">' +
                '<span class="numbering"></span>' +
                '<span class="book-name"></span>' +
                '<span class="book-press"></span>' +
                '<span class="book-remarks"></span>' +
                '</div>'
            );

            itemElem.find('.numbering').text(numberingFull);
            itemElem.find('.book-name').text(bookName);
            itemElem.find('.book-press').text(bookPress);
            itemElem.find('.book-remarks').text(bookRemarks);

            // whether is modified
            if (app.editor.local.isExist(_categoryName, numbering))
                itemElem.addClass('is-modified');

            return itemElem;
        };

        bookList.insertRow = function (book) {
            if (bookList.getItemElem(book['numbering']).length > 0)
                return;

            var itemElem = bookList.itemRender(book);
            itemElem.prependTo(bookListContentElem);
        };

        bookList.notifyItemChanged = function (numbering) {
            if (numbering > _getLastBookNum()) return;

            var itemElem = bookList.getItemElem(numbering);
            var book = _work.books[numbering];

            itemElem.replaceWith(bookList.itemRender(book));
        };

        bookList.getItemElem = function (numbering) {
            return bookListContentElem.find('[data-numbering=' + numbering + ']');
        };

        bookList.focusItem = function (numbering) {
            if (numbering <= 0 || numbering > _getLastBookNum()) return;
            var itemElem = bookList.getItemElem(numbering);
            if (itemElem.hasClass('edit-focused')) return;
            bookListContentElem.find('.edit-focused').removeClass('edit-focused');
            itemElem.addClass('edit-focused');
            bookList.scrollToItem(numbering);
        };

        bookList.scrollToItem = function (numbering) {
            var offset = 4;
            var lastBookNumbering = _getLastBookNum();
            numbering = numbering + offset <= lastBookNumbering ? numbering + offset : lastBookNumbering;

            var itemElem = bookList.getItemElem(numbering);
            if (!itemElem || itemElem.length <= 0) return;

            var scrollTop = (itemElem.offset().top - bookListContentElem.offset().top);
            bookListElem.stop(true).animate({scrollTop: scrollTop}, 150);
            // bookListElem.stop(true).scrollTop(scrollTop);
        };
    })();

    /**
     * Hooks
     */
    _work.hooks = new (function initHooks() {
        this.onExit = function () {};
    })();

    _work.refresh();
};

app.editor.local = {
    _key: 'editor_local_data',
    get: function (categoryName, bookNumbering) {
        if (!this.isExist(categoryName, bookNumbering))
            return null;

        var localCategoris = this.getAll();
        if (categoryName === undefined)
            return localCategoris;
        if (bookNumbering === undefined)
            return localCategoris[categoryName];
        else
            return localCategoris[categoryName][bookNumbering];
    },
    put: function (categoryName, bookNumbering, book) {
        if (!categoryName || !bookNumbering || typeof book !== 'object' || $.isEmptyObject(book))
            throw new Error('参数残缺！');
        if (!book['name'] && !book['press'] && !book['remarks'])
            return;

        var localCategoris = this.getAll();
        if (!localCategoris.hasOwnProperty(categoryName))
            localCategoris[categoryName] = {};

        if (!localCategoris[categoryName].hasOwnProperty(bookNumbering))
            localCategoris[categoryName][bookNumbering] = {};

        var localBook = localCategoris[categoryName][bookNumbering];
        if (!!book['name']) localBook.name = book['name'];
        if (!!book['press']) localBook.press = book['press'];
        if (!!book['remarks']) localBook.remarks = book['remarks'];

        this.setAll(localCategoris);
    },
    remove: function (categoryName, bookNumbering, key) {
        if (categoryName === undefined || bookNumbering === undefined || key === undefined)
            throw new Error('参数残缺！');

        if (!this.isExist(categoryName, bookNumbering))
            return;

        var localCategoris = this.getAll();
        if (localCategoris[categoryName][bookNumbering].hasOwnProperty(key))
            delete localCategoris[categoryName][bookNumbering][key];

        this.setAll(localCategoris);
    },
    isExist: function (categoryName, bookNumbering) {
        if (categoryName === undefined) return false;
        var localCategoris = this.getAll();

        for (var itemCategoryName in localCategoris) {
            if (!localCategoris.hasOwnProperty(itemCategoryName)) continue;

            var categoryBooks = localCategoris[itemCategoryName];
            if ($.isEmptyObject(categoryBooks)) {
                // delete the null object
                delete localCategoris[itemCategoryName];
                continue;
            }

            if (String(itemCategoryName) === String(categoryName)) {
                if (bookNumbering === undefined) return true;

                for (var bookIndex in categoryBooks) {
                    if (!categoryBooks.hasOwnProperty(bookIndex)) continue;
                    if ($.isEmptyObject(categoryBooks[bookIndex])) {
                        delete localCategoris[itemCategoryName][bookIndex];
                        continue;
                    }

                    if (String(bookIndex) === String(bookNumbering)) return true;
                }
            }
        }

        this.setAll(localCategoris);
        return false;
    },
    getAll: function () {
        return JSON.parse(localStorage.getItem(this._key) || '{}');
    },
    setAll: function (obj) {
        localStorage.setItem(this._key, JSON.stringify(obj));
    },
    clearAll: function () {
        localStorage.removeItem(this._key);
    },
    count: function () {
        var localData = this.get(), localDataCount = 0;
        for (var i in localData) localDataCount += Object.keys(localData[i]).length;
        return localDataCount;
    }
};