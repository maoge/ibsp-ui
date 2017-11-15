var canvasW = $("#contextBody").width()-$("#leftContent").width();
var canvasH = $("#contextBody").height();

var plate;
var count = 0;
var id = "af23fb55-bda1-9bcd-6dc3-c5afefc942d7";

$(function() {
	$("#canvas").attr("height",canvasH);
	$("#canvas").attr("width",canvasW);	
	console.log(canvasH);

	//初始化面板
	plate = new Component.TidbPlate("exist", id, $("#canvas")[0]);
//	plate = new Component.TidbPlate("new", "cureuprapapa", $("#canvas")[0]);
//	plate = new Component.MQPlate("MQ集群", $("#canvas")[0]);
//	plate = new Component.CachePlate("Cache集群", $("#canvas")[0]);
	drag();
});

/**
 * 初始化组件拖动事件
 */
function drag() {
	
    //为每一个部署组件绑定拖动事件
	$("div[draggable='true']").each(function() {
		this.ondragstart = function (e) {
			e = e || window.event;
			var dragSrc = this;
			var datatype = $(this).attr("datatype");

			try {
				//IE只允许KEY为text和URL
				e.dataTransfer.setData('text', datatype);
			} catch (ex) {
				console.log(ex);
			}
		};
	});
    
    //阻止默认事件
    $("#contextBody")[0].ondragover = function (e) {
        e.preventDefault();
        return false;
    };
    
    //创建节点
    $("#contextBody")[0].ondrop = function (e) {
        e = e || window.event;
        var datatype = e.dataTransfer.getData("text");
        if (datatype) {
        	plate.newComponent(e.layerX ? e.layerX : e.offsetX, e.layerY ? e.layerY : e.offsetY, datatype);
        }
        if (e.preventDefault()) {
            e.preventDefault();
        }
        if (e.stopPropagation()) {
            e.stopPropagation();
        }
    }
}
