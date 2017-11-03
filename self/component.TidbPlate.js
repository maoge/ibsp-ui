var Component = window.Component || {};


(function(Component) {
	
	/**
	 * Tidb面板类
	 */
	function TidbPlate(data, canvas) {
		//调用父类方法初始化舞台
		if (typeof(data) == "object") {
			data = data.DB_SERV_CONTAINER;
			this.initStage(data.DB_SVC_CONTAINER_NAME, canvas);
			this.id = data.DB_SVC_CONTAINER_ID;
		} else if (typeof(data) == "string") {
			this.initStage(data, canvas);
			data = null;
		} else {
			throw "invalid parameter";
		}
		
		//图标(暂定)
		this.PDIcon = "tpIcon_7.png";
		this.TikvIcon = "tpIcon_8.png";
		this.TidbIcon = "tpIcon_9.png";
		this.collectdIcon = "tpIcon_10.png";
		
		this.PDContainer = null;
		this.TikvContainer = null;
		this.TidbContainer = null;
		self = this;
		
		//定制菜单
		this.nodeMenu = $.contextMenu({
			items:[
			       {label:'部署组件', callback: function(e){
			    	   //TODO 部署组件
			       }},
			       {label:'修改信息', callback: function(e){
			    	   //TODO 修改信息
			       }},
			       {label:'删除组件(缩容)', callback: function(e){
			    	   self.deleteComponent(e.target);
			       }},
			       ]
		});
		this.plateMenu = $.contextMenu({
			items:[
			       {label:'保存面板', callback: function(e){
			    	   self.saveData();
			       }},
			       {label:'修改信息', callback: function(e){
			    	   //TODO 面板改名
			       }},
			       {label:'全屏显示', callback: function(e){
			    	   self.showInFullScreen();
			       }},
			       ]
		});
		this.scene.addEventListener('contextmenu', function(e) {
    		self.plateMenu.show(e)
    		});
		
		//初始化
		this.initContainers(data);
	}
	TidbPlate.prototype = new Component.Plate();
	Component.TidbPlate = TidbPlate;
	
	/**
	 * 初始化container
	 */
	TidbPlate.prototype.initContainers = function(data) {
		//初始化3个container：PD, Tikv, Tidb
		if (data!=null) {
			this.needInitTopo = false;
			var DB_TIDB_CONTAINER = data.DB_TIDB_CONTAINER;
			var DB_TIKV_CONTAINER = data.DB_TIKV_CONTAINER;
			var DB_PD_CONTAINER = data.DB_PD_CONTAINER;
			var collectd = data.DB_COLLECTD;
			
			this.PDContainer = this.makeContainer(DB_PD_CONTAINER.POS.x, DB_PD_CONTAINER.POS.y, 
					DB_PD_CONTAINER.PD_CONTAINER_NAME, DB_PD_CONTAINER.POS.row, DB_PD_CONTAINER.POS.col, "node");
			this.PDContainer._id = DB_PD_CONTAINER.PD_CONTAINER_ID;
			this.TikvContainer = this.makeContainer(DB_TIKV_CONTAINER.POS.x, DB_TIKV_CONTAINER.POS.y, 
					DB_TIKV_CONTAINER.TIKV_CONTAINER_NAME, DB_TIKV_CONTAINER.POS.row, DB_TIKV_CONTAINER.POS.col, "node");
			this.TikvContainer._id = DB_TIKV_CONTAINER.TIKV_CONTAINER_ID;
			this.TidbContainer = this.makeContainer(DB_TIDB_CONTAINER.POS.x, DB_TIDB_CONTAINER.POS.y, 
					DB_TIDB_CONTAINER.TIDB_CONTAINER_NAME, DB_TIDB_CONTAINER.POS.row, DB_TIDB_CONTAINER.POS.col, "node");
			this.TidbContainer._id = DB_TIDB_CONTAINER.TIDB_CONTAINER_ID;
			
			for (var i=0; i<DB_PD_CONTAINER.DB_PD.length; i++) {
				var pd = DB_PD_CONTAINER.DB_PD[i];
				var node = this.addNodeToContainer(this.PDContainer.x+1, this.PDContainer.y+1, 
						this.iconDir+this.PDIcon, pd.PD_NAME, "DB_PD", this.nodeMenu, this.PDContainer);
				this.setMetaData(node, pd);
			}
			
			for (var i=0; i<DB_TIKV_CONTAINER.DB_TIKV.length; i++) {
				var tikv = DB_TIKV_CONTAINER.DB_TIKV[i];
				var node = this.addNodeToContainer(this.TikvContainer.x+1, this.TikvContainer.y+1, 
						this.iconDir+this.TikvIcon, tikv.TIKV_NAME, "DB_TIKV", this.nodeMenu, this.TikvContainer);
				this.setMetaData(node, tikv);
			}
			
			for (var i=0; i<DB_TIDB_CONTAINER.DB_TIDB.length; i++) {
				var tidb = DB_TIDB_CONTAINER.DB_TIDB[i];
				var node = this.addNodeToContainer(this.TidbContainer.x+1, this.TidbContainer.y+1, 
						this.iconDir+this.TidbIcon, tidb.TIDB_NAME, "DB_TIDB", this.nodeMenu, this.TidbContainer);
				this.setMetaData(node, tidb);
			}

			this.addCollectd(collectd.POS.x, collectd.POS.y, this.iconDir+this.collectdIcon, collectd.COLLECTD_NAME, "DB_COLLECTD", this.nodeMenu);
			this.setMetaData(this.collectd, collectd);
			
		} else {
			this.PDContainer = this.makeContainer(this.width*0.12, this.height*0.35, "PD集群", 2, 3, "node");
			this.TikvContainer = this.makeContainer(this.width*0.5, this.height*0.6, "TiKV集群", 1, 5, "node");
			this.TidbContainer = this.makeContainer(this.width*0.5, this.height*0.2, "TiDB集群", 1, 5, "node");
		}
		
		//添加container连接
		var link = new JTopo.FlexionalLink(this.PDContainer, this.TikvContainer);
		link.direction = 'horizontal';
		this.scene.add(link);
		link = new JTopo.FlexionalLink(this.PDContainer, this.TidbContainer);
		link.direction = 'horizontal';
		this.scene.add(link);
		link = new JTopo.Link(this.TidbContainer, this.TikvContainer);
		link.direction = 'vertical';
		this.scene.add(link);
	}
	
	/**
	 * Tidb面板新增组件
	 */
	TidbPlate.prototype.newComponent = function(x, y, datatype) {
		var container, img, text;
		switch(datatype) {
		case "DB_PD":
			container = this.PDContainer;
			img = this.iconDir+this.PDIcon;
			text = "PD";
			break;
		case "DB_TIKV":
			container = this.TikvContainer;
			img = this.iconDir+this.TikvIcon;
			text = "TIKV";
			break;
		case "DB_TIDB":
			container = this.TidbContainer;
			img = this.iconDir+this.TidbIcon;
			text = "TIDB";
			break;
		case "DB_COLLECTD":
			return this.addCollectd(x, y, this.iconDir+this.collectdIcon, "collectd", datatype, this.nodeMenu);
		}
		return this.addNodeToContainer(x, y, img, text, datatype, this.nodeMenu, container) != null;
	}
	
	/**
	 * Tidb面板设置组件元数据
	 */
	TidbPlate.prototype.setMetaData = function(element, data) {
		switch(element.type) {
		case "DB_PD":
			var id = data.PD_ID;
			var name = data.PD_NAME;
			delete data.PD_ID;
			delete data.PD_NAME;
			break;
		case "DB_TIKV":
			var id = data.TIKV_ID;
			var name = data.TIKV_NAME;
			delete data.TIKV_ID;
			delete data.TIKV_NAME;
			break;
		case "DB_TIDB":
			var id = data.TIDB_ID;
			var name = data.TIDB_NAME;
			delete data.TIDB_ID;
			delete data.TIDB_NAME;
			break;
		case "DB_COLLECTD":
			var id = data.COLLECTD_ID;
			var name = data.COLLECTD_NAME;
			delete data.COLLECTD_ID;
			delete data.COLLECTD_NAME;
			break;
		}
		element._id = id;
		element.text = name;
		element.meta = data; //metadata
	}
	
	/**
	 * 提取组件元数据
	 */
	TidbPlate.prototype.getMetaData = function(element) {
		var data = {};
		switch(element.type) {
		case "DB_PD":
			data.PD_ID = element._id;
			data.PD_NAME = element.text;
			break;
		case "DB_TIKV":
			data.TIKV_ID = element._id;
			data.TIKV_NAME = element.text;
			break;
		case "DB_TIDB":
			data.TIDB_ID = element._id;
			data.TIDB_NAME = element.text;
			break;
		case "DB_COLLECTD":
			data.COLLECTD_ID = element._id;
			data.COLLECTD_NAME = element.text;
			break;
		}
		for (var i in element.meta) {
			data[i] = element.meta[i];
		}
		return data;
	}
	
	/**
	 * 转json
	 */
	TidbPlate.prototype.toPlateJson = function(type) {
		
		var DB_SERV_CONTAINER = {};
		DB_SERV_CONTAINER.DB_SVC_CONTAINER_ID = this.id;
		DB_SERV_CONTAINER.DB_SVC_CONTAINER_NAME = this.name;
		var self = this;
		
		//TIDB集群
		var DB_TIDB_CONTAINER = {};
		DB_TIDB_CONTAINER.TIDB_CONTAINER_ID = this.TidbContainer._id;
		DB_TIDB_CONTAINER.TIDB_CONTAINER_NAME = this.TidbContainer.text;
		DB_TIDB_CONTAINER.POS = this.TidbContainer.getPosJson();
		var DB_TIDB = [];
		this.TidbContainer.childs.forEach(function (tidb) {
			DB_TIDB.push(self.getMetaData(tidb));
		});
		DB_TIDB_CONTAINER.DB_TIDB = DB_TIDB;
		DB_SERV_CONTAINER.DB_TIDB_CONTAINER = DB_TIDB_CONTAINER;
		
		//TIKV集群
		var DB_TIKV_CONTAINER = {};
		DB_TIKV_CONTAINER.TIKV_CONTAINER_ID = this.TikvContainer._id;
		DB_TIKV_CONTAINER.TIKV_CONTAINER_NAME = this.TikvContainer.text;
		DB_TIKV_CONTAINER.POS = this.TikvContainer.getPosJson();
		var DB_TIKV = [];
		this.TikvContainer.childs.forEach(function (tikv) {
			DB_TIKV.push(self.getMetaData(tikv));
		});
		DB_TIKV_CONTAINER.DB_TIKV = DB_TIKV;
		DB_SERV_CONTAINER.DB_TIKV_CONTAINER = DB_TIKV_CONTAINER;
		
		//PD集群
		var DB_PD_CONTAINER = {};
		DB_PD_CONTAINER.PD_CONTAINER_ID = this.PDContainer._id;
		DB_PD_CONTAINER.PD_CONTAINER_NAME = this.PDContainer.text;
		DB_PD_CONTAINER.POS = this.PDContainer.getPosJson();
		var DB_PD = [];
		this.PDContainer.childs.forEach(function (pd) {
			DB_PD.push(self.getMetaData(pd));
		});
		DB_PD_CONTAINER.DB_PD = DB_PD;
		DB_SERV_CONTAINER.DB_PD_CONTAINER = DB_PD_CONTAINER;
		
		//collectd
		if (this.collectd != null) {
			var collectd = this.getMetaData(this.collectd);
			var pos = {};
			pos.x = this.collectd.x;
			pos.y = this.collectd.y;
			collectd.POS = pos;
		}
		DB_SERV_CONTAINER.DB_COLLECTD = collectd;
		
		return {"DB_SERV_CONTAINER": DB_SERV_CONTAINER};
	}
	
})(Component);
