/**
 * Created by guozh on 2018/3/1.
 */
var Util = window.Util = {
    initLoading : function(){
        if(!this.$backuDrop){
            this.initBackuDrop();
        }
        if(!this.$loading){
            this.$loading = $('<div style="background:url(../images/loading.gif) center center no-repeat #fff;' +
                'width:56px;height:56px;' +
                'position: absolute;' +
                'top:calc(50% - 28px);' +
                'left:calc(50% - 28px);' +
                'line-height:56px;' +
                'font-size:15px;' +
                'opacity: 0.5;' +
                'z-index:2000;' +
                '"></div>').appendTo(this.$backuDrop);
        }
    },
    initBackuDrop : function(){
        if(!this.$backuDrop){
            this.$backuDrop = $('<div class="modal-backdrop fade show"></div>').appendTo(document.body);
        }
    },
    msg:function(){
        layer.msg.apply(null,arguments);
    },
    alert:function(type, content) {
        var options = {};

        //这里可以扩展皮肤等
        switch(type) {
            case "error":
                options.icon = 2;
                options.title = "错误";
                break;
            case "warn":
                options.icon = 0;
                options.title = "提示";
                break;
            case "success":
                options.icon = 1;
                options.title = "提示";
                break;
        }

        var index = layer.alert(content, options);
        return index;
    },
    confirm : function(){
        layer.confirm.apply(null,arguments)
    },
    showBackuDrop : function(){
        this.initBackuDrop();
        this.$backuDrop.show();
    },
    hideBackuDrop : function(){
        this.initBackuDrop();
        this.$backuDrop.hide();
    },
    showLoading : function(){
        this.showBackuDrop();
        this.initLoading();
        this.$loading.show();
    },
    hideLoading : function(){
        this.hideBackuDrop();
        this.initLoading();
        this.$loading.hide();
    },
    drag : function(title,body,range){
        var w=window,win=body||title,x,y,_left,_top,range=range||function(x){return x};
        title.style.cursor='move';
        title.onmousedown=function (e){
            e=e||event;
            x=e.clientX,y=e.clientY,_left=win.offsetLeft,_top=win.offsetTop;
            this.ondragstart=function(){return false};
            document.onmousemove=e_move;
            document.onmouseup=undrag
        };
        function e_move(e){
            e=e||event;
            var cl=range(_left+e.clientX-x,'x'),ct=range(_top+e.clientY-y,'y');
            win.style.left=cl+'px';
            win.style.top=ct+'px';
            w.getSelection?w.getSelection().removeAllRanges():
                document.selection.empty();
        };
        function undrag(){this.onmousemove=null};
    },
    strToDate : function(str){
        str = str.replace("/-/g", "/");
        return new Date(str);
    }
};
/*原生函數扩展*/
//
Date.prototype.simpleFormat = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};