window.getTime = function () {
    var serverTimeDom = $('#ServerTime');
    $.ajax({ url: './getTime', beforeSend: function(){
        serverTimeDom.html('获取中...');
    }, success: function (data) {
        console.log(data);
        if (!!data['success']) {
            serverTimeDom.html(data['data']['time'] + ' (' + data['data']['time_format'] + ')');
        }
    }, error: function () {
        showError(serverTimeDom);
    } });
};

window.getCategories = function () {
    var categoryListDom = $('#CategoryList');
    var downloadGroup = $('#DownloadGroup');
    $.ajax({ url: './getCategories', beforeSend: function(){
        categoryListDom.html('获取中...');
    }, success: function (data) {
        console.log(data);
        if (!!data['success']) {
            categoryListDom.html('');
            downloadGroup.html('');
            var categories = data['data']['categories'];
            for (var i in categories) {
                var item = categories[i];
                var itemDom = $(
                    '<li>' +
                    '<b id="CategoryName" style="cursor: pointer">' + item['name'] + '</b><br/>' +
                    ' (' +
                    '负责人 = ' + item['registrar_name'] + ', ' +
                    '最后更新 = ' + item['update_at_format'] + ', ' +
                    '创建于 = ' + item['created_at_format'] +
                    ')' +
                    '<hr/></li>'
                );
                itemDom.find('#CategoryName').click(function () {
                    getGetBook($(this).text());
                });
                itemDom.appendTo(categoryListDom);

                // downloads
                $('<li><a href="downloadExcel?categoryName=' +
                    encodeURIComponent(item['name']) +
                    '">下载 仅类目 ' + item['name'] + ' 电子表格</a></li>')
                    .appendTo(downloadGroup);
            }
        }
    }, error: function () {
        showError(categoryListDom);
    } });
};

window.getGetBook = function (categoryName) {
    var queryResultDom = $('#QueryResult');
    $.ajax({ url: './get-book', data: {'category_name': categoryName}, success: function (data) {
        console.log(data);
        if (!!data['success']) {
            queryResultDom.html('<p>类目：' + categoryName + '</p><code>' + JSON.stringify(data['data']) + '</code>');
        }
    }, error: function () {
        showError(queryResultDom);
    } });
};

window.showError = function (dom) {
    dom.html('<a style="color: red">API 异常，请在浏览器控制台查看详情</a>');
};

$(document).ready(function(){
    updateAll();
});

window.updateAll = function () {
    getTime();
    getCategories();
};