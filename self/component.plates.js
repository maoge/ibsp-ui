var Component = window.Component || {};


(function(Component) {
	
	/**
	 * Tidb面板类
	 */
	function TidbPlate(data, canvas) {
		this.PDIcon = "tpIcon_7.png";
		this.TikvIcon = "tpIcon_8.png";
		this.TidbIcon = "tpIcon_9.png";
		
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
		this.PDContainer = null;
		this.TikvContainer = null;
		this.TidbContainer = null;
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
			var DB_TIDB_CONTAINER = data.DB_TIDB_CONTAINER;
			var DB_TIKV_CONTAINER = data.DB_TIKV_CONTAINER;
			var DB_PD_CONTAINER = data.DB_PD_CONTAINER;
			
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
				var node = this.addNodeToContainer(this.PDContainer.x+1, this.PDContainer.y+1, this.iconDir+this.PDIcon, pd.PD_NAME, this.PDContainer);
				node._id = pd.PD_ID;
				if (pd.IP!=undefined) node.ip = pd.IP;
				if (pd.PORT!=undefined) node.port = pd.PORT;
			}
			
			for (var i=0; i<DB_TIKV_CONTAINER.DB_TIKV.length; i++) {
				var tikv = DB_TIKV_CONTAINER.DB_TIKV[i];
				var node = this.addNodeToContainer(this.TikvContainer.x+1, this.TikvContainer.y+1, this.iconDir+this.TikvIcon, tikv.TIKV_NAME, this.TikvContainer);
				node._id = tikv.TIKV_ID;
				if (tikv.IP!=undefined) node.ip = tikv.IP;
				if (tikv.PORT!=undefined) node.port = tikv.PORT;
			}
			
			for (var i=0; i<DB_TIDB_CONTAINER.DB_TIDB.length; i++) {
				var tidb = DB_TIDB_CONTAINER.DB_TIDB[i];
				var node = this.addNodeToContainer(this.TidbContainer.x+1, this.TidbContainer.y+1, this.iconDir+this.TidbIcon, tidb.TIDB_NAME, this.TidbContainer);
				node._id = tidb.TIDB_ID;
				if (tidb.IP!=undefined) node.ip = tidb.IP;
				if (tidb.PORT!=undefined) node.port = tidb.PORT;
				if (tidb.STAT_PORT!=undefined) node.statport = tidb.STAT_PORT;
			}
			//TODO collectd
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
	TidbPlate.prototype.newComponent = function(x, y, img, text, datatype) {
        return this.addNodeToContainer(x, y, img, text, this.getContainerByType(datatype)) != null;
	}
	
	/**
	 * 根据组件类型返回container
	 */
	TidbPlate.prototype.getContainerByType = function(type) {
		switch(type) {
		case "PD": return this.PDContainer;
		case "TIKV": return this.TikvContainer;
		case "TIDB": return this.TidbContainer;
		default: return null;
		}
	}
	
	/**
	 * 转json
	 */
	TidbPlate.prototype.toPlateJson = function(type) {
		
		var DB_SERV_CONTAINER = {};
		DB_SERV_CONTAINER.DB_SVC_CONTAINER_ID = this.id;
		DB_SERV_CONTAINER.DB_SVC_CONTAINER_NAME = this.name;
		
		//TIDB集群
		var DB_TIDB_CONTAINER = {};
		DB_TIDB_CONTAINER.TIDB_CONTAINER_ID = this.TidbContainer._id;
		DB_TIDB_CONTAINER.TIDB_CONTAINER_NAME = this.TidbContainer.text;
		DB_TIDB_CONTAINER.POS = this.TidbContainer.getPosJson();
		var DB_TIDB = [];
		this.TidbContainer.childs.forEach(function (tidb) {
			var json = {};
			json.TIDB_ID = tidb._id;
			json.TIDB_NAME = tidb.text;
			json.IP = tidb.ip!=undefined ? tidb.ip : ""; 
			json.PORT = tidb.port!=undefined ? tidb.port : "";
			json.STAT_PORT = tidb.statport!=undefined ? tidb.statport : "";
			DB_TIDB.push(json);
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
			var json = {};
			json.TIKV_ID = tikv._id;
			json.TIKV_NAME = tikv.text;
			json.IP = tikv.ip!=undefined ? tikv.ip : ""; 
			json.PORT = tikv.port!=undefined ? tikv.port : "";
			DB_TIKV.push(json);
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
			var json = {};
			json.PD_ID = pd._id;
			json.PD_NAME = pd.text;
			json.IP = pd.ip!=undefined ? pd.ip : ""; 
			json.PORT = pd.port!=undefined ? pd.port : "";
			DB_PD.push(json);
		});
		DB_PD_CONTAINER.DB_PD = DB_PD;
		DB_SERV_CONTAINER.DB_PD_CONTAINER = DB_PD_CONTAINER;
		
		//TODO collectd信息
		var collectd = {};
		collectd.COLLECTD_ID = "";
		collectd.COLLECTD_NAME = "";
		collectd.IP = "";
		collectd.PORT = "";
		var pos = {};
		pos.x = 1;
		pos.y = 1;
		pos.width = 1;
		pos.height = 1;
		collectd.POS = pos;
		DB_SERV_CONTAINER.DB_COLLECTD = collectd;
		
		return {"DB_SERV_CONTAINER": DB_SERV_CONTAINER};
	}
	
	
	/**
	 * MQ面板类
	 */
	function MQPlate(name, canvas, data) {
		//调用父类方法初始化舞台
		this.initStage(name, canvas);
		this.SwitchContainer = null;
		this.VBrokerContainer = null;
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
	        return this.addNodeToContainer(x, y, img, text, this.SwitchContainer) != null;
			
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
