var plate;

function init(id, name, type) {
	var $canvas = $("#canvas");
	$('#service_name').text(name);

	$canvas.attr("width",$canvas.width());
	$canvas.attr("height",$canvas.height());
	//初始化面板
	switch(type) {
		case "DB":
			$('#service_type').text("TiDB集群管理");
			plate = new Component.TidbPlate(rootUrl, id, name, $("#canvas")[0]);
			break;
		case "MQ" :
			$('#service_type').text("MQ集群管理");
			plate = new Component.MQPlate(rootUrl, id, name, $("#canvas")[0]);
			$("#tidb-deploy").hide();
			$("#mq-deploy").show();
			break;
		case "CACHE" :
			$('#service_type').text("Cache集群管理");
			plate = new Component.CachePlate(rootUrl, id, name, $("#canvas")[0]);
			$("#tidb-deploy").hide();
			$("#cache-deploy").show();
			break;
        case "SequoiaDB" :
            $('#service_type').text("SequoiaDB集群管理");
            plate = new Component.SequoiaDBPlate(rootUrl, id, name, $("#canvas")[0]);
            $("#tidb-deploy").hide();
            $("#sdb-deploy").show();
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
	$("#mainContent")[0].ondragover = function (e) {
        e.preventDefault();
        return false;
    };
    
    //创建节点
    $("#mainContent")[0].ondrop = function (e) {
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
