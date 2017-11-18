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
    register: function() {},
    show: function () {
        var layer = appHelp.newHelpLayer();
        layer.addNote($('.editor .editor-tool-bar .action-item'), '任务完成后，别忘了上传图书哟<br/>(～￣▽￣)～');
        layer.addNote($('.editor .editor-inserter .numbering'), '编号 快速跳转（Ctrl + G）<br/><br/>填入 编号，敲击 回车键<br/><br/>例：需登记 Z321，但表里没有，无需多次点下一本书按钮，在此输入 321 后，敲击回车键即可<br/><br/>您还可以点击 表中的编号 进行跳转');
        layer.addNote($('.editor .editor-inserter input[name="press"]'), '敲击 Tab 填 下一个 框<br/>敲击 Enter 录 下一本 书');
        layer.addNote($('.editor .editor-inserter .nxt-book-btn'), '点这里，登记下一本书');
    }
};