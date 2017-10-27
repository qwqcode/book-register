var appHelp = {
    init: function () {
        this.bind();
    },
    bind: function () {
        appHelp.editor.register();
    },
    newHelpLayer: function() {
        $('body > .help-layer-wrap').remove();
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
            var noteDom = $('<div class="help-layer-note display-left"></div>');
            noteDom.html(msg);
            noteDom.appendTo(helpLayerDom);

            if (pos['bottom'] + noteDom.outerHeight() > helpLayerDom.height()) {
                pos['bottom'] = helpLayerDom.height() - noteDom.outerHeight() - 20;
                noteDom.css('display-top');
            }

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
        layer.addNote(app.editor.currentBookInfoDom.find('.numbering'), '快速跳转 到指定图书<br/><br/>点击并输入 编号，按回车键，跳到 指定图书。<br/><br/>栗子：登记 Z321，但列表里没有，在这里输入 321 回车即可。无需多次点下一本书按钮');
        layer.addNote(app.editor.inputDoms.press, '键盘快捷键<br/><br/>Tab 填下一个框<br/>Enter 下一本书<br/>Ctrl + G 快速跳转');
        layer.addNote(app.editor.nxtBookBtnDom, '下一本书 按钮<br/><br/>点击这里，登记下一本书');
    }
};