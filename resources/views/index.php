<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>書記 Online</title>
    <!--<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">-->
    <meta name="referrer" content="always">
    <meta name="renderer" content="webkit">
    <link href="/img/ingteresting.png" rel="shortcut icon" type="image/x-icon">
    <link href="/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/app.css" rel="stylesheet">
    <link href="/css/material-design-iconic-font.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/app.js"></script>
    <script src="/js/app-help.js"></script>
    <!--[if lt IE 9]>你正在使用的浏览器版本过低，请<a href="/upgrade-browser.html"><strong>升级你的浏览器</strong></a>，获得最佳的浏览体验！<![endif]-->
</head>
<body>
    <!-- PageLoaderLayer -->
    <div class="page-loader-layer" id="pageLoaderLayer">
        <div class="page-loader-spinner">
            <svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"></circle></svg>
        </div>
        <div class="loading-text"></div>
    </div>

    <!-- Main -->
    <div class="main-wrap anim-fade-in" style="display: none">
        <div class="main">
            
            <div class="main-head">
                <div class="big-title">
                    <span class="project-name">書記</span><span class="version-info">Online</span>
                </div>
            </div>
            
            <form class="main-login" onsubmit="return false;">
                <p class="input-hint">填入你的名字，成为一名名副其实的图书登记员吧！</p>
                <input type="text" id="yourName" class="form-control" placeholder="Your Name ? 填入你的真实名字." autofocus autocomplete="off" />
                <button class="login-submit">好的</button>
            </form>
            
            <div class="main-category-list-wrap"></div>
        </div>
    </div>

    <!-- Editor -->
    <div class="editor-wrap anim-fade-in" style="display: none">
        <div class="editor">
            <div class="editor-tool-bar">
                <div class="left-part">
                    <span class="title">编辑</span>
                </div>
                <div class="right-part">
                    <span class="action-item" data-toggle="exit"><i class="zmdi zmdi-arrow-left"></i> 返回</span>
                    <span class="action-item" data-app-help="editor"><i class="zmdi zmdi-help"></i> 说明</span>
                    <span class="action-item" data-toggle="updateBooks"><i class="zmdi zmdi-refresh"></i> 更新</span>
                    <span class="action-item" data-toggle="upload"><i class="zmdi zmdi-cloud-upload"></i> 上传 <span class="local-data-count">0</span></span>
                </div>
            </div>
            <form class="editor-inserter" onsubmit="return false;">
                <div class="numbering-controller left-part">
                    <span class="current-book-info">
                        <span class="category-name">?</span>
                        <input type="text" class="numbering" autocomplete="off" spellcheck="false" />
                    </span>
                    <button type="button" class="pre-book-btn"></button>
                </div>
                <div class="fields-inputs">
                    <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="name" placeholder="书名" />
                    <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="press" placeholder="出版社" />
                    <input type="text" class="form-control" spellcheck="false" autocomplete="off" name="remarks" placeholder="备注" />
                </div>
                <div class="numbering-controller right-part">
                    <button type="submit" class="nxt-book-btn"></button>
                </div>
            </form>
            <div class="editor-book-list">
                <div class="list-content"></div>
            </div>
        </div>
    </div>
</body>
</html>