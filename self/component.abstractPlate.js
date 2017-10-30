var Component = window.Component || {};


(function(Component) {
	
	/**
	 *  面板基类
	 */
	function Plate() {
		
		this.fontColor = '3,13,247';
		this.font = '10pt 微软雅黑';
		this.borderColor = '170,170,170';
		this.fillColor = '225,225,225';
		this.borderWidth = 2;
		this.borderRadius = 10;
		
		//默认的node尺寸
		this.defaultWidth = 32;
		this.defaultHeight = 32;
		this.padding = 20;
		
		this.iconDir = "./icon/";
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
	 * 新增一个node到container中
	 */
	Plate.prototype.addNodeToContainer = function(x, y, img, text, container) {
		
		x =  this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
		y = this.height/2 - this.scene.translateY - (this.height/2 - y) / this.scene.scaleY;
        
        if (container!=null && container.isInContainer(x, y)) {
    		var node = new JTopo.Node();
    		node.font = this.font;
    		node.fontColor= this.fontColor;
    		node.setImage(img);
    		node.text = text;
    		node.dragable = true;
        	node.x = x - this.defaultWidth/2;
        	node.y = y - this.defaultHeight/2;
        	
			this.scene.add(node);
			container.add(node);
			return node;
		} else {
			return null;
		}
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
	 * 获取当前选中的组件个数
	 */
	Plate.prototype.getSelectedCount = function() {
		return this.scene.selectedElements.length;
	}
	
	/**
	 * 删除选中的组件
	 */
	Plate.prototype.deleteComponent = function() {
		var element = this.scene.selectedElements[0];
		if (element.elementType == "container") {
			for (var i=element.childs.length-1; i>=0; i--) {
				var child = element.childs[i];
				element.remove(child);
				this.scene.remove(child);
			}
		}
		element.parentContainer.remove(element);
		this.scene.remove(element);
		element.x = null;
		element.y = null;
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
	
})(Component);
