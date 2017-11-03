var Component = window.Component || {};


(function(Component) {
	
	/**
	 *  面板基类
	 */
	function Plate() {
		
		//常量放在这里
		this.fontColor = '3,13,247';
		this.font = '10pt 微软雅黑';
		this.borderColor = '170,170,170';
		this.fillColor = '225,225,225';
		this.borderWidth = 2;
		this.borderRadius = 10;
		this.defaultWidth = 32; //默认的node尺寸
		this.defaultHeight = 32;
		this.padding = 20;
//		this.url = "http://192.168.37.175:9991/tidbsvr/saveTiDBTopo"; //后台地址（暂定）
		this.url = "http://192.168.37.175:9991/tidbsvr/ahahahaha";
		this.iconDir = "./icon/"; //图标路径（暂定）
	}
	Component.Plate = Plate;
	
	/**
	 * 初始化舞台
	 */
	Plate.prototype.initStage = function(name, canvas) {
		this.id = JTopo.util.guid();
		this.name = name;
		
		this.canvas = canvas.getContext("2d");
        this.canvas.font = this.font;
		//默认的子container尺寸（通常包含两个node）
		this.defaultContainerW = this.defaultWidth*3+this.padding;
		this.defaultContainerH = this.defaultHeight*2+this.canvas.measureText("田").width;
        
		this.stage = new JTopo.Stage(canvas);
		this.stage.wheelZoom = 0.85;
		this.scene = new JTopo.Scene();
		this.scene.mode = "normal";
		this.stage.add(this.scene);
		
		this.width = $(canvas).attr("width");
		this.height = $(canvas).attr("height");

		this.collectd = null;
	}
	
	/**
	 * 创建一个container容器
	 */
	Plate.prototype.makeContainer = function(x, y, text, rows, cols, type) {
		
		var container = null;
		if (type == "container") {
			container = new Component.FlexibleContainer(rows, cols, this.padding, this.canvas.measureText("田").width);
			container.height = (rows+1)*this.defaultContainerH+rows*this.canvas.measureText("田").width+(rows-1)*this.padding;
			container.width = (cols+1)*this.defaultContainerW+(cols-1)*this.padding;
		} else {
			container = new Component.FlexibleContainer(rows, cols, this.padding, this.canvas.measureText("田").width);
			container.height = (rows+1)*this.defaultHeight+rows*this.canvas.measureText("田").width+(rows-1)*this.padding;
			container.width = (cols+1)*this.defaultWidth+(cols-1)*this.padding;
		}
		
		container.fontColor = this.fontColor;
		container.font = this.font;
		container.borderColor = this.borderColor;
		container.fillColor = this.fillColor;
		container.borderWidth = this.borderWidth;
		container.borderRadius = this.borderRadius;

		container.x = x;
		container.y = y;
		container.dragable = true;
		container.text = text;
		container.textPosition='Top_Left';
		
		this.scene.add(container);
		return container;
	}
	
	/**
	 * 创建一个node
	 */
	Plate.prototype.makeNode = function(x, y, img, text, type, menu) {
		var node = new JTopo.Node();
		node.font = this.font;
		node.fontColor= this.fontColor;
		node.setImage(img);
		node.text = text;
		node.dragable = true;
    	node.x = x - this.defaultWidth/2;
    	node.y = y - this.defaultHeight/2;
    	node.type = type; //组件类型
    	
    	node.addEventListener('contextmenu', function(e) {
    		menu.show(e);
    		});
		return node;
	}
	
	/**
	 * 新增一个node到container中
	 */
	Plate.prototype.addNodeToContainer = function(x, y, img, text, type,menu, container) {
		
		x =  this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
		y = this.height/2 - this.scene.translateY - (this.height/2 - y) / this.scene.scaleY;
        
        if (container!=null && container.isInContainer(x, y)) {
    		var node = this.makeNode(x - this.defaultWidth/2, y - this.defaultHeight/2, img, text, type, menu);
			this.scene.add(node);
			container.add(node);
			//TODO 弹出录信息的面板
			return node;
		} else {
			//TODO 暂时用jAlert
        	jAlert("请将组件拖放到对应的容器中！", "提示");
        	return null;
		}
	}
	
	/**
	 * 新增collectd
	 */
	Plate.prototype.addCollectd = function(x, y, img, text, type, menu) {
		if (this.collectd!=null) {
			//TODO 暂时用jAlert
        	jAlert("集群中只能有一个collectd！", "提示");
			return false;
		}
		x =  this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
		y = this.height/2 - this.scene.translateY - (this.height/2 - y) / this.scene.scaleY;
		var node = this.makeNode(x - this.defaultWidth/2, y - this.defaultHeight/2, img, text, type, menu);
		this.scene.add(node);
		this.collectd = node;
		return true;
	}
	
	/**
	 * 新增一个container到container中
	 */
	Plate.prototype.addContainerToContainer = function(x, y, text, rows, cols, container) {
		
		x = this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
		y = this.width/2 - this.scene.translateY - (this.width/2 - y) / this.scene.scaleY;
		
		if (container!=null && container.isInContainer(x, y)) {
    		var newContainer = this.makeContainer(x - this.defaultContainerW/2, y - this.defaultContainerH/2, text, 1, 2, "node");
    		container.add(newContainer);
			return newContainer;
		} else {
			return null;
		}
	}

	/**
	 * 删除选中的组件
	 */
	Plate.prototype.deleteComponent = function(element) {
		if (element.elementType == "container") {
			for (var i=element.childs.length-1; i>=0; i--) {
				var child = element.childs[i];
				element.remove(child);
				this.scene.remove(child);
			}
		}
		if (element.parentContainer) {
			element.parentContainer.remove(element);
		}
		this.scene.remove(element);
		if (element.type.indexOf("COLLECTD") != -1) {
			this.collectd = null;
		}
	}
	
	/**
	 * 告警指定的节点
	 */
	Plate.prototype.alarmNode = function(name, info) {
		var nodes = this.scene.findElements(function(e) {
			return e.elementType =="node" && e.text == name;
		});
		$.each(nodes, function(index, node) {
			node.alarm = info;
			node.alarmStyle = "flash";
		});
	}
	
	/**
	 * 全屏显示
	 */
	Plate.prototype.showInFullScreen = function() {
		var method = "RequestFullScreen";
		var usablePrefixMethod;
		["webkit", "moz", "ms", "o", ""].forEach(function (prefix) {
			if (usablePrefixMethod) return;
			if (prefix === "") {
				// 无前缀，方法首字母小写
				method = method.slice(0, 1).toLowerCase() + method.slice(1);
			}
			var typePrefixMethod = typeof this.canvas[prefix + method];
			if (typePrefixMethod + "" !== "undefined") {
				if (typePrefixMethod === "function") {
					usablePrefixMethod = this.canvas[prefix + method]();
				} else {
					usablePrefixMethod = this.canvas[prefix + method];
				}
			}
		});
		return usablePrefixMethod;
	}
	
	/**
	 * 保存拓扑数据到后台
	 */
	Plate.prototype.saveTopoData = function() {
		console.log(JSON.stringify(plate.toPlateJson()));
		$.ajax({
			url: this.url,
			type: "post",
			dataType: "json",
			data: {"TIDB_JSON": JSON.stringify(plate.toPlateJson())},
			timeout: 3000,
			error: function(result) {
				//TODO 暂时用JAlert，可以换成别的
				jAlert("保存失败！", "提示");
			},
			success:function(result) {
				if (result.RET_CODE==0) {
					jAlert("保存成功！", "提示");
				} else {
					jAlert("保存失败！"+result.RET_INFO, "提示");
				}
			}
		});
	}

	/**
	 * 保存组件（单个）数据到后台
	 */
	Plate.prototype.saveElementData = function() {
		//TODO 保存单个组件数据（录完信息之后）
	}
})(Component);
