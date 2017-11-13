var Component = window.Component || {};


(function(Component) {
	
	/**
	 * cache面板类
	 */
	function CachePlate(name, canvas, data) {
		//调用父类方法初始化舞台
		this.initStage(name, canvas);
		this.proxyContainer = null;
		this.cacheContainer = null;
		this.initContainers(data);
	}
	CachePlate.prototype = new Component.Plate();
	Component.CachePlate = CachePlate;
	
	/**
	 * 初始化container
	 */
	CachePlate.prototype.initContainers = function(data) {
		if (data!=null) {
			//TODO 有数据时的初始化
		} else {
			//初始化2个container：proxyContainer, cacheContainer
			this.proxyContainer = this.makeContainer(
					this.width*0.5-this.defaultWidth*1.5-this.padding*2, this.height*0.15, "cache proxy集群", 1, 3, "node");
			this.cacheContainer = this.makeContainer(
					this.width*0.5-this.defaultContainerW*1.5-this.containerPadding*2, this.height*0.5, "cache集群", 1, 3, "container");
			
			var link = new JTopo.Link(this.proxyContainer, this.cacheContainer);
			link.direction = 'vertical';
			this.scene.add(link);
		}
	}
	
	/**
	 * cache面板新增组件
	 */
	CachePlate.prototype.newComponent = function(x, y, img, text, datatype) {
		
		switch(datatype) {
		
		case "Proxy":
	        return this.addNodeToContainer(x, y, img, text, this.proxyContainer) != null;
			
		case "CacheGroup":
			return this.addContainerToContainer(x, y, text, 1, 2, this.cacheContainer) != null;
			
		case "Cache":
			var success = false;
			var childs = this.cacheContainer.childs;
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
