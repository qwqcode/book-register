$(document).ready(function(){
    updateAll();

    // 不间断地测试 API 接口状态
    setInterval(function () {
        getStatus();
        getTime();
    }, 5000); // 5s once
});

function getTime() {
    var serverTimeDom = $('#ServerTime');
    $.ajax({ url: '/getTime', beforeSend: function(){
        serverTimeDom.html('获取中...');
    }, success: function (data) {
        console.log(data);
        if (!!data['success']) {
            serverTimeDom.html(data['data']['time'] + ' (' + data['data']['time_format'] + ')');
        }
    }, error: function () {
        showError(serverTimeDom);
    } });
}

function getCategories() {
    var categoryListDom = $('#CategoryList');
    var downloadGroup = $('#DownloadGroup');
    $.ajax({ url: '/getCategories', beforeSend: function(){
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
                    '<div id="CategoryContent" style="margin-top: 10px;height: 300px;width: 650px;' +
                    'overflow-y: scroll;padding: 10px;border: 1px solid #dedede;word-break: break-all"></div>' +
                    '<hr/></li>'
                );
                itemDom.find('#CategoryName').click(function () {
                    getGetBook($(this).parents('li').find('#CategoryContent'),
                        $(this).text());
                });
                itemDom.appendTo(categoryListDom);

                getGetBook(itemDom.find('#CategoryContent'), item['name']);

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
}

function getGetBook(dom, categoryName) {
    $.ajax({ url: '/getCategoryBooks', data: {'categoryName': categoryName}, beforeSend: function(){
        dom.html('获取中...');
    }, success: function (data) {
        console.log(data);
        if (!!data['success']) {
            var books = data['data']['books'];
            var csvContent = '';
            var csvHeadRow = '';
            for (var i in books) {
                var row = '';
                var bookItem = books[i];
                var tableHeadRow = '';
                for (var key in bookItem) {
                    tableHeadRow += escapeCSV(key) + ',';
                    row += escapeCSV(bookItem[key]) + ',';
                }
                if (csvHeadRow.length < 1)
                    csvHeadRow = tableHeadRow.substring(0, tableHeadRow.length - 1) + '<br/>';
                csvContent += row.substring(0, row.length - 1) + '<br/>';
            }
            dom.html(csvHeadRow + csvContent);
        }
    }, error: function () {
        showError(dom);
    } });
}

function showError(dom) {
    dom.html('<a style="color: red">API 异常，请在浏览器控制台查看详情</a>');
}

function updateAll() {
    getStatus();
    getTime();
    getCategories();
}

function getStatus() {
    var statusList = $('#StatusList');

    var reqInfoPool = [
        ['GET', '/getCategories'],
        ['GET', '/getCategoryBooks'],
        ['POST', '/uploadCategoryBooks']
    ];

    for (var i = 0; i < reqInfoPool.length; i++) {

        var method = reqInfoPool[i][0];
        var url = reqInfoPool[i][1];

        statusList.find('[data-path="'+url+'"]').remove();

        (function() {
            var dom = $('<li data-path="' + url + '">' + url + ' - <span class="status-tag" style="color: yellow">测试中...</span></li>')
                .appendTo(statusList);

            $.ajax({
                url: url + '?getStatusOnly=true', method: method, data: {}, success: function (data) {
                    if (data.hasOwnProperty('success')) {
                        dom.find('.status-tag').css('color', 'green').html('正常');
                    } else {
                        dom.find('.status-tag').css('color', 'red').html('异常');
                    }
                }, error: function () {
                    dom.find('.status-tag').css('color', 'red').html('异常');
                }
            });

        } ());
    }
}

function escapeCSV(input) {
    if (input.length < 1)
        return '""';

    var csv = String(input).replace(/"/g,'""');

    if(csv.charAt(0) != '"')
        csv = '"' + csv;

    if(csv.charAt(csv.length-1) != '"')
        csv = csv + '"';

    return csv;
}