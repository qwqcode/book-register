$(document).ready(function () {
    app.helloScreen.init();
    app.categoryList.init();
    app.work.init();
});

var app = {
    data: {
        categoris: {}
    },

    current: {
        registrarName: null,

        categoryName: '',
        categoryIsSaved: false
    },

    helloScreen: {
        dom: $(),
        formDom: $(),
        init: function () {
            this.dom = $('#helloScreen');
            this.formDom = $('#helloForm');
            this.formDom.find('#yourName').focus(function () {
                $(this).attr('placeholder', '我的 Name 是达康，我要当书记.');
            }).blur(function () {
                $(this).attr('placeholder', 'Your Name ? 填入你的真实名字.');
            });
            this.formDom.submit(function () {
                var yourName = $(this).find('#yourName');
                var yourNameVal = $.trim(yourName.val());
                if (yourNameVal.length < 1) {
                    alert('请填入你的姓名');
                    return false;
                }

                app.current.registrarName = $.trim(yourName.val());

                // 开始工作
                app.work.startWork();

                return false;
            });
        }
    },

    categoryList: {
        layerDom: $(),
        dom: $(),
        contentDom: $(),
        contentLoadingDom: $(),
        init: function () {
            this.layerDom = $('#categoryListLayer');
            this.dom = $('#categoryList');
            this.contentDom = $('#categoryListContent');
            this.contentLoadingDom = $('#categoryListLoading');

            this.downloadCategoryList();
        },
        show: function () {
            this.layerDom.show();
        },
        hide: function () {
            this.layerDom.hide();
        },
        downloadCategoryList: function () {
            $.ajax({url: '/getCategories', beforeSend: function(){
                app.categoryList.contentLoadingDom.show();
            }, success: function (data) {
                app.categoryList.contentLoadingDom.hide();
                var contentDom = app.categoryList.contentDom;

                if (!!data['success']) {
                    contentDom.html('');
                    var categories = data['data']['categories'];
                    for (var i in categories) {
                        var item = categories[i];
                        var itemDom = $(
                            '<div class="category-item" data-category-name="'+ item['name'] +'">' +
                            '<b id="CategoryName" style="cursor: pointer">' + item['name'] + '</b><br/>' +
                            '负责人：' + item['registrar_name'] + ', ' +
                            '最后更新：' + item['update_at_format'] + ', ' +
                            '创建于：' + item['created_at_format'] +
                            '</div>'
                        );
                        itemDom.click(function () {
                            app.categoryList.hide();
                            app.work.downloadData($(this).attr('data-category-name'));
                        });
                        itemDom.appendTo(contentDom);
                    }
                } else {
                    alert('服务器程序错误，类目获取失败');
                }
            }, error: function () {
                app.categoryList.contentLoadingDom.hide();
                alert('网络错误，类目获取失败');
            }});
        },
        createCategory: function () {
            var categoryName = window.prompt('填入类目名，例如：Z', '');
            if (categoryName) {
                app.work.uploadData(categoryName, [{"numbering": "1","name": "","press": "","remarks": ""}]);
            } else {

            }
        }
    },

    work: {
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
            app.helloScreen.dom.hide();
            app.categoryList.show();
            this.dom.show();
            this.newTable();
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
                minSpareRows: 1000,
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
                    items: {'cut': {name: '剪切'}, 'copy': {name: '复制'}, 'paste': {name: '粘贴'}, 'undo': {name: '撤销'}, 'redo': {name: '重做'}}
                }
            });
        },
        downloadData: function (categoryName) {
            $.ajax({ url: '/getCategoryBooks', data: {'categoryName': categoryName}, beforeSend: function(){

            }, success: function (data) {
                console.log(data);
                if (!!data['success']) {
                    var books = data['data']['books'];
                    var tableData = [];
                    for (var i in books) {
                        var bookItem = books[i];
                        tableData.push({ category: categoryName, numbering: bookItem['numbering'],
                            name: bookItem['name'], press: bookItem['press'], remarks: bookItem['remarks']});
                    }
                    app.work.hot.loadData(tableData);
                }
            }, error: function () {
                alert('类目数据加载错误...');
            } });
        },
        saveCurrent: function () {

        },
        uploadData: function (categoryName, categoryBooksArr) {
            var data = {};
            data[categoryName] = categoryBooksArr;
            var json = JSON.stringify(data);
            $.ajax({url: '/uploadCategoryBooks', method: 'POST', data: {
                'registrarName': app.current.registrarName,
                'booksInCategoriesJson': json
            }, beforeSend: function(){
                console.log('数据保存中...');
            }, success: function (data) {
                if (!!data['success']) {
                    alert(data['msg']);
                    app.categoryList.downloadCategoryList();
                } else {
                    alert('服务器程序错误，数据保存获取失败');
                }
            }, error: function () {
                alert('网络错误，无法保存数据');
            }});
        }
    }
};