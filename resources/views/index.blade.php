<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>書記 Online</title>
    <meta name="referrer" content="always">
    <meta name="renderer" content="webkit">
    <link href="/img/ingteresting.png" rel="shortcut icon" type="image/x-icon">
    <link href="/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/app.css" rel="stylesheet">
    <link href="/css/material-design-iconic-font.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/app.js"></script>
    <script src="/js/editor.js"></script>
    <script src="/js/app-help.js"></script>
    <script src="/js/CommentCoreLibrary.min.js"></script>
    <!--[if lte IE 9]><script>window.location.href='/upgrade-browser.html';</script><![endif]-->
</head>
<body>

    <!-- Loading Layer -->
    <div class="loading-layer">
        <div class="loading-spinner"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"></circle></svg></div>
        <div class="loading-layer-text"></div>
    </div>

    <!-- Main -->
    <div class="main-wrap anim-fade-in" style="display: none">
    <div class="main">

        <!-- Main Login -->
        <div class="main-login">
            <div class="main-login-head">
                <div class="big-title"><span class="project-name">書記</span><span class="version-info">Online</span></div>
            </div>
            <form class="main-login-form" onsubmit="return false;">
                <p class="input-hint">填入你的名字，成为一名名副其实的图书登记员吧！</p>
                <input type="text" id="yourName" class="form-control" placeholder="Your Name ? 填入你的真实名字." autofocus autocomplete="off" />
                <button class="login-submit">好的</button>
            </form>
        </div>

        <!-- Category List -->
        <div class="main-category-list">
            <div class="main-category-list-head">
                <span class="left-part">
                    <div class="title">書記 Online</div>
                    <div class="user">
                        <a class="username" data-toggle="user-logout"> $.htmlEncode(app.data.getUser() || 无名英雄) </a>
                        <a class="book-count"></a>
                        <a class="current-online">在线：加载中...</a>
                    </div>
                </span>
                <span class="right-part">
                    <span class="list-search">
                        <input type="text" class="form-control" placeholder="搜索类目..." autocomplete="off" spellcheck="false">
                    </span>
                    <span class="list-actions">
                        <a data-toggle="refresh-data"><i class="zmdi zmdi-refresh"></i> 刷新列表</a>
                        <a data-toggle="upload-books"><i class="zmdi zmdi-cloud-upload"></i> 上传图书</a>
                        <a data-toggle="create-category"><i class="zmdi zmdi-plus"></i> 创建类目</a>
                        <a href="/categoryExcel"><i class="zmdi zmdi-download"></i> 数据导出</a>
                    </span>
                </span>
            </div>
            <div class="main-category-list-body">
                <div class="main-category-list-content"></div>
                <div class="main-category-list-loading anim-fade-in" style="display: none;">
                    <div class="loading-spinner"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"></circle></svg></div>
                </div>
            </div>
        </div>

    </div>
    </div>

    <!-- Editor -->
    <div class="editor-wrap anim-fade-in" style="display: none"></div>
</body>
</html>