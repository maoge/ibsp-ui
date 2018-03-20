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

		this.imgRootUrl = "../images/console/";
		this.brokerIcon = this.imgRootUrl + "db_collectd_icon.png";

		var data = this.getTopoData(id),
			self = this;

		if (data == null) {
			Util.hideLoading();
			return;
		} else if (data == "init") {
			data = null;
		}
		this.initContainers(data);


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
	MQPlate.prototype.initContainers = function(data) {
		if (data!=null) {
			//TODO 有数据时的初始化
		} else {
			//初始化2个container：MQSwitch、VBrokerContainer
			/*this.SwitchContainer = this.makeContainer(
					this.width*0.5-this.defaultWidth*2-this.padding, this.height*0.15, "MQ Switch集群", 1, 3, "node");*/
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
			case this.PD_CONST:
				data.PD_ID = element._id;
				data.PD_NAME = element.text;
				break;
			case this.TIKV_CONST:
				data.TIKV_ID = element._id;
				data.TIKV_NAME = element.text;
				break;
			case this.TIDB_CONST:
				data.TIDB_ID = element._id;
				data.TIDB_NAME = element.text;
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


})(Component);
