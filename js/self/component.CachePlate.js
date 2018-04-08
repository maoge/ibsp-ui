var Component = window.Component || {};


(function(Component) {
	
	/**
	 * 缓存面板类
	 */
	function CachePlate(url, id, name, canvas) {
		Util.showLoading();
		this.setRootUrl(url);
		this.PlateType = "CACHE";
		
		//调用父类方法初始化舞台
		var data = null;
		this.initStage(id, name, canvas);
		data = this.getTopoData(id);
		if (data == null) {
			Util.hideLoading();
			return;
		} else if (data == "init") {
			data = null;
		}

		//图标(暂定)
		this.ProxyIcon = "db_pd_icon.png";
		this.NodeIcon = "db_tikv_icon.png";
		this.collectdIcon = "db_collectd_icon.png";
		
		//常量
		this.PROXY_CONST = "CACHE_PROXY";
		this.CLUSTER_CONST = "CACHE_NODE_CLUSTER";
		this.NODE_CONST = "CACHE_NODE";
		this.COLLECTD_CONST = "CACHE_COLLECTD";
		
		this.ProxyContainer = null;
		this.ClusterContainer = null;
		Util.hideLoading();
		var self = this;
		
		//初始化右键菜单
		this.nodeMenu = $.contextMenu({
			items:[
			       {label:'部署组件', icon:'../images/console/icon_install.png', callback: function(e){
			    	   self.deployElement(e.target);
			       }},
			       {label:'修改信息', icon:'../images/console/icon_edit.png', callback: function(e){
			    	   self.popupForm(e.target);
			       }},
			       {label:'删除组件', icon:'../images/console/icon_delete.png', callback: function(e){
			    	   var element = e.target;
			    	   layer.confirm("确认删除组件吗？", {
			    		   btn: ['是','否'], //按钮
			    		   title: "确认"
			    	   }, function(){
				    	   layer.close(layer.index);
		    			   self.deleteComponentBackground(element);
			    	   });
			       }}]
		});
		this.deployedMenu = $.contextMenu({
			items:[
			       {label:'卸载(缩容)', icon:'../images/console/icon_delete.png', callback: function(e){
			    	   self.undeployElement(e.target);
			       }}]
		});
		this.plateMenu = $.contextMenu({
			items:[
			       {label:'保存面板结构', icon:'../images/console/icon_save.png', callback: function(e){
			    	   self.saveTopoData();
			       }},
			       {label:'部署面板', icon:'../images/console/icon_install.png', callback: function(e){
			    	   layer.confirm('确认要部署集群“'+self.name+'”吗？', {
			    		   btn: ['是','否'], //按钮
			    		   title: "确认"
			    	   }, function(){
			    		   layer.close(layer.index);
			    		   self.deployElement(e.target);
			    	   });
			       }}]
		});
		this.scene.addEventListener('contextmenu', function(e) {
			self.plateMenu.show(e);
		});
		
		//初始化弹出表单
        var cancelFunction = function(){
        	if (self.popElement.status=="new") self.deleteComponent(self.popElement);
        	self.popElement = null;
        };
		this.ProxyForm = $.popupForm(this.PROXY_CONST, window['cache.schema'], function(json){
			self.saveElementData(self.popElement, json, self.ProxyForm);
        }, cancelFunction);
		this.ClusterForm = $.popupForm(this.CLUSTER_CONST, window['cache.schema'], function(json){
			self.saveElementData(self.popElement, json, self.ClusterForm);
        }, cancelFunction);
		this.NodeForm = $.popupForm(this.NODE_CONST, window['cache.schema'], function(json){
			self.saveElementData(self.popElement, json, self.NodeForm);
        }, cancelFunction);
		this.CollectdForm = $.popupForm(this.COLLECTD_CONST, window['cache.schema'], function(json){
			self.saveElementData(self.popElement, json, self.CollectdForm);
        }, cancelFunction);
		this.getIpUser("CACHE", [this.ProxyForm, this.ClusterForm, this.NodeForm, this.CollectdForm]);
		
		//初始化Container
		this.initContainer(data);
	}
	
	CachePlate.prototype = new Component.Plate();
	Component.CachePlate = CachePlate;
	
	/**
	 * 初始化接入机、redis集群container
	 */
	CachePlate.prototype.initContainer = function(data) {
		if (data!=null) {
			var deployFlag = data.DEPLOY_FLAG;
			data = data.CACHE_SERV_CONTAINER;
			this.needInitTopo = false;
			
			var CACHE_PROXY_CONTAINER = data.CACHE_PROXY_CONTAINER;
			var CACHE_NODE_CONTAINER = data.CACHE_NODE_CONTAINER;
			var collectd = data.CACHE_COLLECTD;
			
			this.ProxyContainer = this.makeContainer(
					CACHE_PROXY_CONTAINER.POS.x, CACHE_PROXY_CONTAINER.POS.y,
					CACHE_PROXY_CONTAINER.CACHE_PROXY_CONTAINER_NAME,
					CACHE_PROXY_CONTAINER.POS.row, CACHE_PROXY_CONTAINER.POS.col, "node");
			this.ProxyContainer._id = CACHE_PROXY_CONTAINER.CACHE_PROXY_CONTAINER_ID;
			
			this.ClusterContainer = this.makeContainer(
					CACHE_NODE_CONTAINER.POS.x, CACHE_NODE_CONTAINER.POS.y, 
					CACHE_NODE_CONTAINER.CACHE_NODE_CONTAINER_NAME, 
					CACHE_NODE_CONTAINER.POS.row, CACHE_NODE_CONTAINER.POS.col, "container");
			this.ClusterContainer._id = CACHE_NODE_CONTAINER.CACHE_NODE_CONTAINER_ID;
			
			for (var i=0; i<CACHE_PROXY_CONTAINER.CACHE_PROXY.length; i++) {
				var proxy = CACHE_PROXY_CONTAINER.CACHE_PROXY[i];
				var node = this.addNodeToContainer(this.ProxyContainer.x+1, 
						this.ProxyContainer.y+1, this.iconDir+this.ProxyIcon, 
						proxy.CACHE_PROXY_NAME, this.PROXY_CONST, this.nodeMenu, 
						this.ProxyContainer, true);
				this.setMetaData(node, proxy);
			}
				
			for (var i=0; i<CACHE_NODE_CONTAINER.CACHE_NODE_CLUSTER.length; i++) {
				var cluster = CACHE_NODE_CONTAINER.CACHE_NODE_CLUSTER[i];
				var container = this.addContainerToContainer(this.ClusterContainer.x+1, 
						this.ClusterContainer.y+1, cluster.CACHE_NODE_CLUSTER_CONTAINER_NAME, 
						this.CLUSTER_CONST, 1, 2, this.nodeMenu, 
						this.ClusterContainer, true);
				this.setMetaData(container, cluster);
				for (var j=0; j<cluster.CACHE_NODE.length; j++) {
					var cacheNode = cluster.CACHE_NODE[j];
					var node = this.addNodeToContainer(container.x+1, container.y+1,
							this.iconDir+this.NodeIcon, cacheNode.CACHE_NODE_NAME,
							this.NODE_CONST, this.nodeMenu, container, true);
					this.setMetaData(node, cacheNode);
				}
			}

			if (collectd && !$.isEmptyObject(collectd)) {
				var x = collectd.POS ? collectd.POS.x : 0;
				var y = collectd.POS ? collectd.POS.y : 0;
				this.addCollectd(x, y, this.iconDir+this.collectdIcon, 
						collectd.COLLECTD_NAME, this.COLLECTD_CONST, this.nodeMenu, true),
				this.setMetaData(this.collectd, collectd);
			}
			
			this.getDeployFlag(deployFlag);
		} else {
			this.needInitTopo = true;
			this.ProxyContainer = this.makeContainer(
					this.width*0.5, this.height*0.2, "接入机集群", 1, 2, "node");
			this.ClusterContainer = this.makeContainer(
					this.width*0.5, this.height*0.6, "Redis实例集群", 1, 2, "container");
		}
			
		//添加container连接
		link = new JTopo.Link(this.ProxyContainer, this.ClusterContainer);
		link.direction = 'vertical';
		this.scene.add(link);
	}
	
	/**
	 * 保存面板拓扑信息(位置信息等)
	 */
	CachePlate.prototype.toPlateJson = function(needCollectd) {
		
		var CACHE_SERV_CONTAINER = {};
		CACHE_SERV_CONTAINER.CACHE_SVC_CONTAINER_ID = this.id;
		CACHE_SERV_CONTAINER.CACHE_SVC_CONTAINER_NAME = this.name;
		
		//接入机集群
		var CACHE_PROXY_CONTAINER = {};
		CACHE_PROXY_CONTAINER.CACHE_PROXY_CONTAINER_ID = this.ProxyContainer._id;
		CACHE_PROXY_CONTAINER.CACHE_PROXY_CONTAINER_NAME = this.ProxyContainer.text;
		CACHE_PROXY_CONTAINER.POS = this.ProxyContainer.getPosJson();
		var CACHE_PROXY = [];
		CACHE_PROXY_CONTAINER.CACHE_PROXY = CACHE_PROXY;
		CACHE_SERV_CONTAINER.CACHE_PROXY_CONTAINER = CACHE_PROXY_CONTAINER;
		
		//redis集群
		var CACHE_NODE_CONTAINER = {};
		CACHE_NODE_CONTAINER.CACHE_NODE_CONTAINER_ID = this.ClusterContainer._id;
		CACHE_NODE_CONTAINER.CACHE_NODE_CONTAINER_NAME = this.ClusterContainer.text;
		CACHE_NODE_CONTAINER.POS = this.ClusterContainer.getPosJson();
		var CACHE_NODE_CLUSTER = [];
		CACHE_NODE_CONTAINER.CACHE_NODE_CLUSTER = CACHE_NODE_CLUSTER;
		CACHE_SERV_CONTAINER.CACHE_NODE_CONTAINER = CACHE_NODE_CONTAINER;
		
		//当第一次保存面板或collectd为空时，不需要传collectd信息
		var collectd = {};
		if (needCollectd && this.collectd != null) {
			collectd.COLLECTD_ID = this.collectd._id;
			collectd.COLLECTD_NAME = this.collectd.text;
			var pos = {};
			pos.x = this.collectd.x+this.collectd.width/2;
			pos.y = this.collectd.y+this.collectd.height/2;
			collectd.POS = pos;
		}
		CACHE_SERV_CONTAINER.CACHE_COLLECTD = collectd;
		
		return {"CACHE_SERV_CONTAINER": CACHE_SERV_CONTAINER};
	};
	
	/**
	 * 缓存面板新增组件
	 */
	CachePlate.prototype.newComponent = function(x, y, datatype) {
		var container, img, text;
		switch(datatype) {
		case this.PROXY_CONST:
			return this.addNodeToContainer(x, y, this.iconDir+this.ProxyIcon, 
					"proxy", datatype, this.nodeMenu, this.ProxyContainer, false) != null;
		case this.CLUSTER_CONST:
			return this.addContainerToContainer(x, y, "cluster", 
					datatype, 1, 2, this.nodeMenu, this.ClusterContainer, false) != null;
			break;
		case this.NODE_CONST:
			var success = false, childs = this.ClusterContainer.childs, img = this.iconDir+this.NodeIcon;
			for (var i=0; i<childs.length; i++) {
				if (this.addNodeToContainer(x, y, img, "cache_node", 
						datatype, this.nodeMenu, childs[i], false) != null) {
					success = true;
					break;
				}
			}
			return success;
			break;
		case this.COLLECTD_CONST:
			return this.addCollectd(x, y, this.iconDir+this.collectdIcon, "collectd", datatype, this.nodeMenu, false);
		}
	};
	
	/**
	 * 弹出窗口
	 */
	CachePlate.prototype.popupForm = function(element) {
		this.popElement = element; //存放目前正在填写信息的元素，表单窗口关闭时置为null
		switch(element.type) {
		case this.PROXY_CONST:
			this.ProxyForm.show(this.getMetaData(element));
			break;
		case this.CLUSTER_CONST:
			this.ClusterForm.show(this.getMetaData(element));
			var nodeList = "",
				self = this;
			element.childs.forEach(function (node) {
				var meta = self.getMetaData(node);
				nodeList += "<option value='"+meta["CACHE_NODE_ID"]+"'>"+meta["IP"]+":"+meta["PORT"]+"</option>";
			});
			this.ClusterForm.setMasterSelect(nodeList);
			break;
		case this.NODE_CONST:
			this.NodeForm.show(this.getMetaData(element));
			break;
		case this.COLLECTD_CONST:
			this.CollectdForm.show(this.getMetaData(element));
			break;
		}
	};
	
	/**
	 * Tidb面板设置组件元数据
	 */
	CachePlate.prototype.setMetaData = function(element, data) {
		switch(element.type) {
		case this.PROXY_CONST:
			var id = data.CACHE_PROXY_ID;
			var name = data.CACHE_PROXY_NAME;
			delete data.CACHE_PROXY_ID;
			delete data.CACHE_PROXY_NAME;
			break;
		case this.CLUSTER_CONST:
			var id = data.CACHE_NODE_CLUSTER_CONTAINER_ID;
			var name = data.CACHE_NODE_CLUSTER_CONTAINER_NAME;
			delete data.CACHE_NODE_CLUSTER_CONTAINER_ID;
			delete data.CACHE_NODE_CLUSTER_CONTAINER_NAME;
			break;
		case this.NODE_CONST:
			var id = data.CACHE_NODE_ID;
			var name = data.CACHE_NODE_NAME;
			delete data.CACHE_NODE_ID;
			delete data.CACHE_NODE_NAME;
			break;
		case this.COLLECTD_CONST:
			var id = data.COLLECTD_ID;
			var name = data.COLLECTD_NAME;
			delete data.COLLECTD_ID;
			delete data.COLLECTD_NAME;
			delete data.POS;
			break;
		}
		element._id = id;
		element.text = name;
		element.meta = data; //metadata
	}
	
	/**
	 * 提取组件元数据
	 */
	CachePlate.prototype.getMetaData = function(element) {
		var data = {};
		switch(element.type) {
		case this.PROXY_CONST:
			data.CACHE_PROXY_ID = element._id;
			data.CACHE_PROXY_NAME = element.text;
			break;
		case this.CLUSTER_CONST:
			data.CACHE_NODE_CLUSTER_CONTAINER_ID = element._id;
			data.CACHE_NODE_CLUSTER_CONTAINER_NAME = element.text;
			break;
		case this.NODE_CONST:
			data.CACHE_NODE_ID = element._id;
			data.CACHE_NODE_NAME = element.text;
			break;
		case this.COLLECTD_CONST:
			data.COLLECTD_ID = element._id;
			data.COLLECTD_NAME = element.text;
			var pos = {};
			pos.x = this.collectd.x;
			pos.y = this.collectd.y;
			data.POS = pos;
			break;
		}
		for (var i in element.meta) {
			data[i] = element.meta[i];
		}
		return data;
	}
	
	/**
	 * 组件部署成功时的处理
	 */
	CachePlate.prototype.getElementDeployed = function(element) {
		var self = this;
		if (element.elementType=="node") {
			element.status = "deployed";
			element.removeEventListener('contextmenu');
			element.addEventListener('contextmenu', function(e) {
				self.deployedMenu.show(e);
			});
		} else if (element.elementType=="container") {
			if (element.parentContainer!=undefined && element.parentContainer!=null) {
				element.removeEventListener('contextmenu');
				element.addEventListener('contextmenu', function(e) {
					self.deployedMenu.show(e);
				});
			}
		}
	};
	
	/**
	 * 缓存面板卸载
	 */
	CachePlate.prototype.undeployElement = function(element){
		if(element.parentContainer.childs.length <= 1 ){
			Component.Alert("error", "已经是最后一个组件！");
		} else {
			Component.Plate.prototype.undeployElement.call(this, element);
		}
	};
	
	/**
	 * 组件卸载成功时的处理
	 */
	CachePlate.prototype.getElementUndeployed = function(element) {
		if (element.elementType=="node") {
			element.status = "saved";
			var self = this;
			element.removeEventListener('contextmenu');
			element.addEventListener('contextmenu', function(e) {
				self.nodeMenu.show(e);
			});
		}
	};
	
})(Component);
