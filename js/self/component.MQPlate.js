var Component = window.Component || {};


(function(Component) {
	
	/**
	 * MQ面板类
	 */
	function MQPlate(url, id, name, canvas) {
		//调用父类方法初始化舞台
		this.initStage(name, canvas);
		this.SwitchContainer = null;
		this.VBrokerContainer = null;
		this.data = this.getTopoData(id);
		this.initContainers(data);

	}
	MQPlate.prototype = new Component.Plate();
	Component.MQPlate = MQPlate;
	
	/**
	 * 初始化container
	 */
	MQPlate.prototype.initContainers = function(data) {
		if (data!=null) {
			//TODO 有数据时的初始化
		} else {
			//初始化2个container：MQSwitch、VBrokerContainer
			this.SwitchContainer = this.makeContainer(
					this.width*0.5-this.defaultWidth*2-this.padding, this.height*0.15, "MQ Switch集群", 1, 3, "node");
			this.VBrokerContainer = this.makeContainer(
					this.width*0.5-this.defaultContainerW*2-this.padding, this.height*0.5, "MQ集群", 1, 3, "container");
			
			var link = new JTopo.Link(this.SwitchContainer, this.VBrokerContainer);
			link.direction = 'vertical';
			this.scene.add(link);
		}
	}
	
	/**
	 * MQ面板新增组件
	 */
	MQPlate.prototype.newComponent = function(x, y, img, text, datatype) {
		
		switch(datatype) {
		
		case "Switch":
				Util.alert("warn","暂时不支持！");
				return false;
	        /*return this.addNodeToContainer(x, y, img, text, this.SwitchContainer) != null;*/
			
		case "VBroker":
			return this.addContainerToContainer(x, y, text, 1, 2, this.VBrokerContainer) != null;

		case "Broker":
			var success = false;
			var childs = this.VBrokerContainer.childs;
			//逐个地判断是否落在VBroker容器中
			for (var i = 0; i<childs.length; i++) {
				if (this.addNodeToContainer(x, y, img, text, childs[i]) != null) {
					success = true;
					break;
				}
			}
			return success;
			
		default: 
			return false;
		}
	}
})(Component);
