var appHelp = {
    init: function () {
        this.bind();
    },
    bind: function () {
        appHelp.editor.register();
    },
    newHelpLayer: function() {
        $('body > help-layer-wrap').remove();
        var wrapDom = $('<div class="help-layer-wrap anim-fade-in"></div>').appendTo('body');
        var helpLayerDom = $('<div class="help-layer"></div>').appendTo(wrapDom);
        var actionsDom = $(
            '<div class="help-layer-actions">' +
            '<span class="close-btn" data-app-help-toggle="close"><i class="zmdi zmdi-close"></i></span>' +
            '</div>'
        ).prependTo(helpLayerDom);
        helpLayerDom.find('[data-app-help-toggle="close"]').click(function() {
            wrapDom.remove();
        });

        var obj = {};
        obj.getDom = function () {
            return helpLayerDom;
        };
        obj.addNote = function(dom, msg) {
            var pos = $.getPosition(dom);
            var noteDom = $('<div class="help-layer-note"></div>');
            noteDom.html(msg);
            noteDom.appendTo(helpLayerDom);

            if (pos['bottom'] + noteDom.outerHeight() > helpLayerDom.height())
                pos['bottom'] = helpLayerDom.height() - noteDom.outerHeight() - 20;

            noteDom.css('left', pos['left'])
                .css('top', pos['bottom']);

            return helpLayerDom;
        };

        return obj;
    }
};

appHelp.editor = {
    editorHelpBtn: $(),
    register: function() {
        this.editorHelpBtn = $('[data-app-help="editor"]');
        this.editorHelpBtn.click(function() {
            appHelp.editor.show();
        })
    },
    show: function () {
        var layer = appHelp.newHelpLayer();
        layer.addNote(app.editor.currentBookInfoDom.find('.numbering'), '点击这里，输入 编号，按回车键，跳到 指定图书。<br/><br/>假如：你要登记 Z321，但列表里没有，不用多次按 “下一本书” 按钮，直接在这里输入 321');
        layer.addNote(app.editor.inputDoms.press, '键盘快捷键<br/><br/>按 Tab 输入下一个字段；<br/>按 Enter 跳到 下一本书');
        layer.addNote(app.editor.bookListContentDom, '点击 索引号 来编辑 指定图书');
        layer.addNote(app.editor.nxtBookBtnDom, '“下一本书” 按钮<br/><br/>点这里 跳到 下一本书');
    }
};