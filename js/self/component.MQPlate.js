var Component = window.Component || {};


(function(Component) {
	
	/**
	 * MQ面板类
	 */
	function MQPlate(url, id, name, canvas) {
		//调用父类方法初始化舞台
		this.url = rootUrl;
		this.initStage(id, name, canvas);
		this.SwitchContainer = null;
		this.VBrokerContainer = null;
		this.PlateType = "MQ";

		//图标(暂定)
		this.imgRootUrl = "../images/console/";
		this.brokerIcon = this.imgRootUrl + "db_collectd_icon.png";
		this.switchIcon = this.imgRootUrl + "db_collectd_icon.png";

		var data = this.getTopoData(id),
			self = this;

		if (data == null) {
			Util.hideLoading();
			return;
		} else if (data == "init") {
			data = null;
		}
		this.initContainer(data);


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

		this.VBROKER_CONST = "MQ_VBROKER_CONTAINER";
		this.BROKER_CONST = "MQ_VBROKER";
		this.COLLECTD_CONST = "MQ_COLLECTD";

		//初始化弹出表单
		var cancelFunction = function(){
			if (self.popElement.status=="new") self.deleteComponent(self.popElement);
			self.popElement = null;
		};
		this.VBokerForm = $.popupForm(this.VBROKER_CONST, window["mq.schema"], function(json){
			self.saveElementData(self.popElement, json, self.PDForm);
		}, cancelFunction);
		this.BrokerForm = $.popupForm(this.BROKER_CONST, window["mq.schema"], function(json){
			self.saveElementData(self.popElement, json, self.TikvForm);
		}, cancelFunction);
		this.CollectdForm = $.popupForm(this.COLLECTD_CONST, window["mq.schema"], function(json){
			self.saveElementData(self.popElement, json, self.CollectdForm);
		}, cancelFunction);

	}
	MQPlate.prototype = new Component.Plate();
	Component.MQPlate = MQPlate;

	/**
	 * 初始化container
	 */
	MQPlate.prototype.initContainer = function(data) {
		if (data!=null) {
			data = data.MQ_SERV_CONTAINER;
			this.needInitTopo = false;

			var deployFlag = data.DEPLOY_FLAG,
				MQ_SWITCH_CONTAINER = data.MQ_SWITCH_CONTAINER,
				MQ_VBROKER_CONTAINER = data.MQ_VBROKER_CONTAINER,
				collectd = data.DB_COLLECTD;

			if(MQ_SWITCH_CONTAINER){
				this.SwitchContainer = this.makeContainer(MQ_SWITCH_CONTAINER.POS.x,MQ_SWITCH_CONTAINER.POS.y,
					MQ_SWITCH_CONTAINER.MQ_SWITCH_CONTAINER_NAME,MQ_SWITCH_CONTAINER.POS.row,MQ_SWITCH_CONTAINER.POS.col,"node");
				for (var _switch in MQ_SWITCH_CONTAINER.MQ_SWITCH) {
					var node = this.addNodeToContainer(this.SwitchContainer.x+1, this.SwitchContainer.y+1,
						this.switchIcon, _switch.MQ_SWITCH_NAME, this.SW_CONST, this.nodeMenu, this.PDContainer, true);
					this.setMetaData(node, _switch);
				}
			}
			if (collectd) {
				var x = collectd.POS ? collectd.POS.x : 0;
				var y = collectd.POS ? collectd.POS.y : 0;
				this.addCollectd(x, y, this.iconDir+this.collectdIcon,
					collectd.COLLECTD_NAME, this.COLLECTD_CONST, this.nodeMenu, true),
					this.setMetaData(this.collectd, collectd);
			}

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
					this.iconDir+this.PDIcon, pd.PD_NAME, this.PD_CONST, this.nodeMenu, this.PDContainer, true);
				this.setMetaData(node, pd);
			}

			for (var i=0; i<DB_TIKV_CONTAINER.DB_TIKV.length; i++) {
				var tikv = DB_TIKV_CONTAINER.DB_TIKV[i];
				var node = this.addNodeToContainer(this.TikvContainer.x+1, this.TikvContainer.y+1,
					this.iconDir+this.TikvIcon, tikv.TIKV_NAME, this.TIKV_CONST, this.nodeMenu, this.TikvContainer, true);
				this.setMetaData(node, tikv);
			}

			for (var i=0; i<DB_TIDB_CONTAINER.DB_TIDB.length; i++) {
				var tidb = DB_TIDB_CONTAINER.DB_TIDB[i];
				var node = this.addNodeToContainer(this.TidbContainer.x+1, this.TidbContainer.y+1,
					this.iconDir+this.TidbIcon, tidb.TIDB_NAME, this.TIDB_CONST, this.nodeMenu, this.TidbContainer, true);
				this.setMetaData(node, tidb);
			}

			if (collectd) {
				var x = collectd.POS ? collectd.POS.x : 0;
				var y = collectd.POS ? collectd.POS.y : 0;
				this.addCollectd(x, y, this.iconDir+this.collectdIcon,
					collectd.COLLECTD_NAME, this.COLLECTD_CONST, this.nodeMenu, true),
					this.setMetaData(this.collectd, collectd);
			}

			this.getDeployFlag(deployFlag);
		} else {
			//初始化2个container：MQSwitch、VBrokerContainer
			/*this.SwitchContainer = this.makeContainer(
					this.width*0.5-this.defaultWidth*2-this.padding, this.height*0.15, "MQ Switch集群", 1, 3, "node");*/
			this.needInitTopo = true;
			this.VBrokerContainer = this.makeContainer(
					this.width*0.5-this.defaultContainerW*2-this.padding, this.height*0.5, "VBroker容器", 1, 3, "container");
			
			/*var link = new JTopo.Link(this.SwitchContainer, this.VBrokerContainer);
			link.direction = 'vertical';
			this.scene.add(link);*/
		}
	}

	//提取组件元数据
	MQPlate.prototype.getMetaData = function(element) {
		var data = {};
		switch(element.type) {
			case this.VBROKER_CONST:
				data.VBROKER_CONTAINER_ID = element._id;
				data.VBROKER_CONTAINER_NAME = element.text;
				break;
			case this.BROKER_CONST:
				data.BROKER_ID = element._id;
				data.BROKER_NAME = element.text;
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
	};

	//Tidb面板设置组件元数据
	this.setMetaData = function(element, data) {
		switch(element.type) {
			case this.VBROKER_CONST:
				var id = data.VBROKER_CONTAINER_ID,
					name = data.VBROKER_CONTAINER_NAME;
				delete data.VBROKER_CONTAINER_ID;
				delete data.VBROKER_CONTAINER_NAME;
				break;
			case this.BROKER_CONST:
				var id = data.BROKER_ID;
				var name = data.BROKER_NAME;
				delete data.BROKER_ID;
				delete data.BROKER_NAME;
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

	//弹出 根据schema生成的输入框
	MQPlate.prototype.popupForm = function(element) {
		debugger;
		this.popElement = element; //存放目前正在填写信息的元素，表单窗口关闭时置为null
		switch(element.type) {
			case this.VBROKER_CONST:
				this.VBokerForm.show(this.getMetaData(element));
				break;
			case this.BROKER_CONST:
				this.BrokerForm.show(this.getMetaData(element));
				break;
			case this.COLLECTD_CONST:
				this.CollectdForm.show(this.getMetaData(element));
				break;
		}
	}
	
	/**
	 * MQ面板新增组件
	 */
	MQPlate.prototype.newComponent = function(x, y, datatype) {
		switch(datatype) {
		
		case "Switch":
				Util.alert("warn","暂时不支持！");
				return false;
	        /*return this.addNodeToContainer(x, y, img, text, this.SwitchContainer) != null;*/
			
		case "VBroker":
			var text = "VBroker",
				container = this.addContainerToContainer(x, y, text, 1, 2, this.VBrokerContainer, this.VBROKER_CONST),
				success =  container!= null;
			success && this.popupForm(container);
			return success;

		case "Broker":
			var success = false,
				childs = this.VBrokerContainer.childs,
				img = this.brokerIcon;
			//逐个地判断是否落在VBroker容器中
			for (var i = 0; i<childs.length; i++) {
				if (this.addNodeToContainer(x, y, img, datatype, datatype, this.nodeMenu,childs[i] ,true) != null) {
					success = true;
					break;
				}
			}
			return success;
			
		default: 
			return false;
		}
	};

	//保存面板拓扑信息(位置信息等)
	MQPlate.prototype.toPlateJson = function(needCollectd) {

		var MQ_SERV_CONTAINER = {};
		MQ_SERV_CONTAINER.MQ_SVC_CONTAINER_ID = this.id;
		MQ_SERV_CONTAINER.MQ_SVC_CONTAINER_NAME = this.name;
		var self = this;

		//SWITCH_CONTAINER
		if(this.SwitchContainer){
			var MQ_SWITCH_CONTAINER = {};
			MQ_SWITCH_CONTAINER.MQ_SWITCH_CONTAINER_ID = this.TidbContainer._id;
			MQ_SWITCH_CONTAINER.MQ_SWITCH_CONTAINER_NAME = this.TidbContainer.text;
			MQ_SWITCH_CONTAINER.POS = this.SwitchContainer.getPosJson();
			var MQ_SWITCH = [];
			MQ_SWITCH_CONTAINER.MQ_SWITCH = MQ_SWITCH;
			MQ_SERV_CONTAINER.MQ_SWITCH_CONTAINER = MQ_SWITCH_CONTAINER;
		}

		//VBROKER_CONTAINER
		var MQ_VBROKER_CONTAINER = {};
		MQ_VBROKER_CONTAINER.VBROKER_CONTAINER_ID = this.VBrokerContainer._id;
		MQ_VBROKER_CONTAINER.VBROKER_CONTAINER_NAME = this.VBrokerContainer.text;
		MQ_VBROKER_CONTAINER.POS = this.VBrokerContainer.getPosJson();
		var MQ_VBROKER = [];
		MQ_VBROKER_CONTAINER.MQ_VBROKER = MQ_VBROKER;
		MQ_SERV_CONTAINER.MQ_VBROKER_CONTAINER = MQ_VBROKER_CONTAINER;

		//collectd
		var collectd = {};
		if (needCollectd && this.collectd != null) {
			collectd.COLLECTD_ID = this.collectd._id;
			collectd.COLLECTD_NAME = this.collectd.text;
			var pos = {};
			pos.x = this.collectd.x+this.collectd.width/2;
			pos.y = this.collectd.y+this.collectd.height/2;
			collectd.POS = pos;
			MQ_SERV_CONTAINER.DB_COLLECTD = collectd;
		}

		return {"MQ_SERV_CONTAINER": MQ_SERV_CONTAINER};
	}

})(Component);
