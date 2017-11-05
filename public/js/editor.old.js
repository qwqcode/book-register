app.editor1 = {
    isWorkStarted: false,
    currentCategoryIndex: null,
    currentCategoryObj: null,
    currentCategoryBooks: null,
    getCurrentCategoryName: function () {
        return !!this.currentCategoryObj ? this.currentCategoryObj['name'] || '' : '';
    },
    getLastNumbering: function () {
        return !!this.currentCategoryBooks ? this.currentCategoryBooks.length : 0;
    },
    isSaved: false,
    currentBookIndex: 0,
    getLocalData: function () {
        return JSON.parse(localStorage.getItem(this.localStorageKey) || '{}');
    },
    clearLocalData: function () {
        return localStorage.removeItem(this.localStorageKey);
    },
    setLocalData: function (obj) {
        window.localStorage ? localStorage.setItem(this.localStorageKey, JSON.stringify(obj)) : null;
    },
    getLocalDataBookTotal: function () {
        var localData = this.getLocalData(),
            localDataCount = 0;
        for (var i in localData) {
            localDataCount += !!localData[i] ? $.countObj(localData[i]) : 0;
        }
        return localDataCount;
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
    startWork: function (categoryDataIndex, startBookIndex) {
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
        this.updateToolBar();

        app.editor.syncLocalModified();
        this.refreshBookList();
        this.initInserter();
        this.bindKey();

        app.main.hide();
        this.wrapDom.show();

        // 跳转编辑
        if (typeof (startBookIndex) === 'number' && startBookIndex >= 0) {
            app.editor.redirectBook(startBookIndex, false);
        } else {
            // 跳转编辑最后一本书
            app.editor.redirectBook(this.getLastNumbering() - 1, false);
        }
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
            app.data.uploadBooks();
        });
    },
    updateToolBar: function () {
        this.toolBarDom.find('.local-data-count').text(this.getLocalDataBookTotal());
    },
    initInserter: function () {
        if (this.getLastNumbering() <= 0) // 如果一本书都没有
            this.addNewBook();

        // 图书焦点控制按钮
        this.preBookBtnDom.click(function () {
            app.editor.preBook();
        });
        this.inserterDom.submit(function () {
            app.editor.nxtBook();
        });

        // 快速跳转功能
        this.bookRedirectInputDom = this.currentBookInfoDom.find('.numbering');
        var bookRedirectInputDom = this.bookRedirectInputDom;
        var bookRedirectBlur = function () {
            var val = bookRedirectInputDom.val();
            if (!isNaN(val)) {
                app.editor.redirectBook((Number(val) >= 1) ? (Number(val) - 1) : 0);
            } else {
                bookRedirectInputDom.val(app.editor.currentBookIndex + 1);
            }
        };
        bookRedirectInputDom.focus(function () {
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
            for (var indexGroup in group.reverse()) {
                var optionText = group[indexGroup];
                $('<div class="panel-option-item" data-key="' + indexGroup + '"></div>')
                    .data('content', optionText)
                    .html(optionText.replace(val, function(matched) {
                        return '<span class="highlight">' + $.htmlEncode(matched) + '</span>'
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
        var itemDom = this.bookListItemRender(this.currentCategoryBooks[length - 1]);
        itemDom.prependTo(this.bookListContentDom);
    },
    saveCurrentBook: function () {
        var categoryName = this.getCurrentCategoryName();
        var rawBookData = this.currentCategoryBooks[this.currentBookIndex];
        if (!rawBookData) {
            app.notify.error('当前图书 index=' + this.currentBookIndex + ' 原始数据不存在，无法保存');
            return;
        }

        var bookNumbring = rawBookData.numbering;
        var inputName = $.trim(this.inputDoms.name.val());
        var inputPress = $.trim(this.inputDoms.press.val());
        var inputRemarks = $.trim(this.inputDoms.remarks.val());

        // 是否已修改
        var isNameModified = inputName !== rawBookData['name'],
            isPressModified = inputPress !== rawBookData['press'],
            isRemarksModified = inputRemarks !== rawBookData['remarks'];

        // 是否输入为空
        var isNameNull = inputName.length <= 0,
            isPressNull = inputPress.length <= 0,
            isRemarksNull = inputRemarks.length <= 0,
            isAllNull = isNameNull && isPressNull && isRemarksNull;

        if (!isNameModified && !isPressModified && !isRemarksModified)
            return;

        // 获取 "修改记录" 对象
        var localData = this.getLocalData();
        if (!localData[categoryName])
            localData[categoryName] = {};
        if (!localData[categoryName][bookNumbring])
            localData[categoryName][bookNumbring] = {};

        // "修改记录" 对象内容修改
        var values = localData[categoryName][bookNumbring];
        if (!!values) {
            if (isNameModified && !isNameNull) values.name = inputName;
            if (isNameModified && isNameNull) !!values.name ? delete values.name : null;

            if (isPressModified && !isPressNull) values.press = inputPress;
            if (isPressModified && isPressNull) !!values.press ? delete values.press : null;

            if (isRemarksModified && !isRemarksNull) values.remarks = inputRemarks;
            if (isRemarksModified && isRemarksNull) !!values.remarks ? delete values.remarks : null;

            if (!values.name && !values.press && !values.remarks) {
                delete localData[categoryName][bookNumbring];
            }
        }

        // 空对象清理
        if (!!localData[categoryName] && $.isEmptyObject(localData[categoryName])) {
            delete localData[categoryName];
        }

        // 修改源数据
        rawBookData.name = inputName;
        rawBookData.press = inputPress;
        rawBookData.remarks = inputRemarks;

        // 保存到浏览器
        this.setLocalData(localData);

        // 更新工具条
        this.updateToolBar();

        // 更新 BookList 中单个 item
        this.bookListItemUpdate(bookNumbring);
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
    redirectBook: function (bookIndex, saveCurrentBook) {
        if (isNaN(bookIndex) || bookIndex < 0)
            return;

        // 在跳转之前 保存当前图书
        if (saveCurrentBook === undefined)
            saveCurrentBook = true;
        if (typeof(saveCurrentBook) === 'boolean' && saveCurrentBook)
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
            this.bookListItemRender(this.currentCategoryBooks[i]).appendTo(dom);
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
    bookListItemRender: function (item) {
        var categoryName = this.getCurrentCategoryName();

        var numbering = item['numbering'],
            numberingFull = app.editor.getCurrentCategoryName() + ' ' + numbering,
            bookName = item['name'] || '',
            bookPress = item['press'] || '',
            bookRemarks = item['remarks'] || '';

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

        var localData = this.getLocalData();
        var bookModifieds = localData[categoryName];
        if (!!bookModifieds && !!bookModifieds[numbering]) {
            itemDom.addClass('is-modified');
        }

        return itemDom;
    },
    bookListItemUpdate: function (numbering) {
        if (numbering > this.currentCategoryBooks.length) {
            app.notify.error('bookListItemUpdate() 错误：Numbering 超出 currentCategoryBooks 长度');
            return;
        }

        var itemDom = this.getBookListItemDom(numbering);
        var book = this.currentCategoryBooks[numbering - 1];

        itemDom.replaceWith(this.bookListItemRender(book));
    },
    getBookListItemDom: function (numbering) {
        return this.bookListContentDom.find('[data-numbering=' + numbering + ']');
    },
    scrollToBookListItem: function (numbering) {
        var itemDom = this.getBookListItemDom(numbering <= this.getLastNumbering() ? numbering : this.getLastNumbering());
        if (!itemDom || itemDom.length <= 0) return;
        var scrollTop = (itemDom.offset().top - app.editor.bookListContentDom.offset().top);
        this.bookListDom.stop(true).animate({scrollTop: scrollTop}, 150);
        // this.bookListDom.stop(true).scrollTop(scrollTop);
    },
    updateBooksFromServer: function() {
        var categoryIndex = this.currentCategoryIndex;
        var currentEditingBookIndex = this.currentBookIndex;
        app.loadingLayer.show('正在更新图书数据');
        app.api.getCategoryBooks(categoryIndex, function () {
            app.loadingLayer.hide();
            app.editor.exit();
            app.editor.startWork(categoryIndex, currentEditingBookIndex);
            app.notify.success('更新完毕');
        }, function () {
            app.loadingLayer.hide();
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