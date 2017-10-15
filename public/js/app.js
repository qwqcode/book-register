/* Zneiat/library-register-server */
$(document).ready(function () {
    app.helloScreen.init();
    app.category.init();
    app.work.init();
    app.notify.info('程序初始化完毕');
});

var app = {};

app.data = {
    categoris: {},
    categoryBooks: {}
};

app.current = {
    registrarName: null,
    categoryDataIndex: null,
    categoryIsSaved: false
};

app.helloScreen = {
    dom: $(),
    headDom: $(),
    formDom: $(),
    init: function () {
        this.dom = $('#helloScreen');
        this.headDom = $('#helloHead');
        this.formDom = $('#helloForm');
        this.formDom.submit(function () {
            var yourName = $(this).find('#yourName');
            var yourNameVal = $.trim(yourName.val());
            if (yourNameVal.length < 1) {
                app.notify.error('请填入你的姓名');
                return false;
            }

            app.helloScreen.startWork(yourNameVal);

            return false;
        });
    },
    startWork: function (registrarName) {
        app.current.registrarName = registrarName;

        var thisObj = this;
        this.formDom.addClass('form-hide');

        var catSelectorWrap = $('#helloCategorySelectorWrap').addClass('show');
        var catSelector = app.category.newSelector(catSelectorWrap, false);
        catSelector.show();

        setTimeout(function () {
            thisObj.dom.addClass('large-size');
            thisObj.headDom.find('.big-title').addClass('left-part');
            var rightPart = thisObj.headDom.find('.right-part');
            rightPart.find('#registrarName').text(app.current.registrarName);
            rightPart.show();
        }, 200);
    },
    hide: function () {
        this.dom.hide();
    }
};

app.category = {
    init: function () {
        this.categoriesDownload();
    },
    currentSelector: null,
    newSelector: function (appendingDom, showCloseBtn) {
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
        obj.update = function () {
            var contentDom = dom.find('.list-content');
            var categories = app.data.categoris;
            contentDom.html('');
            for (var i in categories) {
                var item = categories[i];
                var itemDom = $(
                    '<div class="item" data-category-index="' + i + '">' +
                    '<div class="item-head">' +
                    '<span class="category-name">' + appUtils.htmlEncode(item['name'] || "未命名") + '</span>' +
                    '</div>' +
                    '<div class="item-desc">' +
                    '<span title="登记员"><i class="zmdi zmdi-account"></i> ' + appUtils.htmlEncode(item['registrar_name'] || "未知") + '</span>' +
                    '<span title="更新时间"><i class="zmdi zmdi-cloud-upload"></i> ' + appUtils.timeAgo(item['update_at'] || "未知") + '</span>' +
                    '<span title="创建时间"><i class="zmdi zmdi-plus-square"></i> ' + appUtils.timeAgo(item['created_at'] || "未知") + '</span>' +
                    '</div>' +
                    '</div>'
                );
                itemDom.click(function () {
                    app.category.startWork($(this).attr('data-category-index'));
                });
                itemDom.appendTo(contentDom);
            }
            return true;
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
        obj.update();

        return obj;
    },
    startWork: function (categoryDataIndex) {
        var categoryData = app.data.categoris[categoryDataIndex];
        if (!categoryData) {
            app.notify.error('不存在的类目，Index=' + categoryDataIndex);
            return;
        }
        var categoryName = categoryData['name'];
        if (!categoryName) {
            app.notify.error('不知名的类目名称...');
            return;
        }
        this.booksDownload(categoryData, function () {
            if (!app.data.categoryBooks.hasOwnProperty(categoryName)) {
                app.notify.error('真是奇怪呐... 未找到 app.data.categories 中的该类目数据');
                return;
            }

            app.current.categoryDataIndex = categoryDataIndex;
            // 正式开始工作
            app.work.startWork();
        }, function () {
            app.notify.error('无法打开该类目');
        });
    },
    create: function () {
        var categoryName = window.prompt('填入类目名，例如：Z', '');
        if (!!categoryName && typeof(categoryName) === 'string' && $.trim(categoryName).length > 0) {
            this.uploadData($.trim(categoryName), [{"numbering": "1", "name": "", "press": "", "remarks": ""}]);
        }
    },
    categoriesDownload: function (onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/getCategories', success: function (data) {
                if (!!data['success']) {
                    app.data.categoris = data['data']['categories'];
                    if (app.category.currentSelector !== null)
                        app.category.currentSelector.update();
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
    },
    booksDownload: function (categoryData, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        $.ajax({
            url: '/getCategoryBooks', data: {'categoryName': categoryData['name']}, beforeSend: function () {
                if (app.category.currentSelector !== null)
                    app.category.currentSelector.setLoading(true);
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
    },
    uploadData: function (categoryName, categoryBooksArr, onSuccess, onError) {
        onSuccess = onSuccess || function () {};
        onError = onError || function () {};

        var data = {};
        data[categoryName] = categoryBooksArr;
        var json = JSON.stringify(data);
        $.ajax({
            url: '/uploadCategoryBooks', method: 'POST', data: {
                'registrarName': app.current.registrarName,
                'booksInCategoriesJson': json
            }, beforeSend: function () {

            }, success: function (data) {
                if (!!data['success']) {
                    app.notify.success(data['msg']);
                    onSuccess();
                    // 更新类目列表
                    app.category.categoriesDownload();
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

app.work = {
    hot: null,
    dom: $(),
    workTableDom: $(),
    init: function () {
        this.dom = $('#workArea');
        this.workTableDom = $('#workTable');
        $('.floater-block').mouseover(function () {
            $(this).removeClass('block-hide');
        }).mouseout(function () {
            $(this).addClass('block-hide');
        })
    },
    startWork: function () {
        var categoryDataIndex = app.current.categoryDataIndex;
        var categoryData = app.data.categoris[categoryDataIndex];
        var categoryBooks = app.data.categoryBooks[categoryData['name']];
        app.helloScreen.hide();
        app.work.dom.show();
        app.work.newTable();
        app.work.hot.loadData(categoryBooks);
    },
    newTable: function () {
        if (this.hot !== null) {
            this.hot.destroy();
        }

        this.workTableDom.html('<div id="handsontable"></div>');
        this.hot = new Handsontable($('#handsontable')[0], {
            colHeaders: ['类目', '索引号', '书名', '出版社', '备注'],
            colWidths: [5, 10, 30, 20, 30],
            rowHeaders: true,
            filters: true,
            // dropdownMenu: true,
            contextMenu: ['cut', 'copy', 'paste', 'undo', 'redo'],
            //minSpareRows: 500,
            manualColumnResize: true,
            manualRowResize: true,
            stretchH: 'all',
            enterMoves: function () {
                return {
                    row: 1,
                    col: -app.work.hot.getSelected()[1] + 2
                }
            },
            columns: [
                {data: 'category', readOnly: true},
                {data: 'numbering', readOnly: true},
                {data: 'name'},
                {data: 'press'},
                {data: 'remarks'}
            ]
        });
        this.hot.updateSettings({
            contextMenu: {
                items: {
                    'cut': {name: '剪切'},
                    'copy': {name: '复制'},
                    'paste': {name: '粘贴'},
                    'undo': {name: '撤销'},
                    'redo': {name: '重做'}
                }
            }
        });

        var tableHeightFit = function () {
            app.work.hot.updateSettings({
                height: app.work.dom.innerHeight()
            });
        };

        tableHeightFit();
        $(window).resize(function () {
            tableHeightFit();
        });

        Handsontable.hooks.add('afterSetDataAtCell', function (changes, source) {
            // 当编辑了最后一行的数据
            if (changes[0][0] + 1 >= app.work.hot.getData().length) {
                // 创建新行

            }
        });
    },
    handleBooksTableUse: function (booksData) {
        var total = booksData.length() + 500; // 预留 500 个空行
        var data = [];
        for (var i = 0; i < booksData; i++) {
            for (var itemBooks in booksData) {
                if (booksData['numbering']) {

                }
            }
            app.work.hot.setDataAtCell(187, 0, '2');
        }
    },
    handleBooksUploadUse: function (booksData) {

    },
    saveCurrent: function () {

    }
};

app.notify = {
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
    }
};

var appUtils = {
    delay: function (ms) {
        var cur_d = new Date();
        var cur_ticks = cur_d.getTime();
        var ms_passed = 0;
        while (ms_passed < ms) {
            var d = new Date();  // Possible memory leak?
            var ticks = d.getTime();
            ms_passed = ticks - cur_ticks;
            // d = null;  // Prevent memory leak?
        }
    },
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