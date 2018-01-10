var plate;
var canvasW = getContextWidth();
var canvasH = getContextHeight();

function init(id, name, type) {
	$('#service_name').text(name);
	
	$("#canvas").attr("height",canvasH);
	$("#canvas").attr("width",canvasW);	

	//初始化面板
	switch(type) {
	case "DB":
		$('#service_type').text("TiDB集群管理");
		plate = new Component.TidbPlate(rootUrl, id, name, $("#canvas")[0]);
		break;
	}
	
	drag();
}

/**
 * 初始化组件拖动事件
 */
function drag() {
	
    //为每一个部署组件绑定拖动事件
	$("div[draggable='true']").each(function() {
		this.ondragstart = function (e) {
			e = e || window.event;
			var dragSrc = this;
			var datatype = $(this).attr("id");

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
        	var x = e.offsetX;
        	var y = e.offsetY;
        	plate.newComponent(x, y, datatype);
        }
        if (e.preventDefault()) {
            e.preventDefault();
        }
        if (e.stopPropagation()) {
            e.stopPropagation();
        }
    }
}
