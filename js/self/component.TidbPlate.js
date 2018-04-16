var Component = window.Component || {};


(function(Component) {
	
	/**
	 * Tidb面板类
	 */
	function TidbPlate(url, id, name, canvas) {
		Util.showLoading();
		this.setRootUrl(url);
		
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

		this.PlateType = "DB";
		this.tikvStatusInterval = "";

		//图标(暂定)
		this.PDIcon = "db_pd_icon.png";
		this.TikvIcon = "db_tikv_icon.png";
		this.TidbIcon = "db_tidb_icon.png";
		this.collectdIcon = "db_collectd_icon.png";
		
		//常量
		this.PD_CONST = "DB_PD";
		this.TIKV_CONST = "DB_TIKV";
		this.TIDB_CONST = "DB_TIDB";
		this.COLLECTD_CONST = "DB_COLLECTD";
		
		this.PDContainer = null;
		this.TikvContainer = null;
		this.TidbContainer = null;
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
		/*this.plateMenu = $.contextMenu({
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
		});*/
		
		//初始化弹出表单
        var cancelFunction = function(){
        	if (self.popElement.status=="new") self.deleteComponent(self.popElement);
        	self.popElement = null;
        };
		this.PDForm = $.popupForm(this.PD_CONST, window['tidb.schema'], function(json){
			self.saveElementData(self.popElement, json, self.PDForm);
        }, cancelFunction);
		this.TikvForm = $.popupForm(this.TIKV_CONST, window['tidb.schema'], function(json){
			self.saveElementData(self.popElement, json, self.TikvForm);
        }, cancelFunction);
		this.TidbForm = $.popupForm(this.TIDB_CONST, window['tidb.schema'], function(json){
			self.saveElementData(self.popElement, json, self.TidbForm);
        }, cancelFunction);
		this.CollectdForm = $.popupForm(this.COLLECTD_CONST, window['tidb.schema'], function(json){
			self.saveElementData(self.popElement, json, self.CollectdForm);
        }, cancelFunction);
		this.getIpUser("DB", [this.PDForm, this.TikvForm, this.TidbForm, this.CollectdForm]);
		
		
		//-------------------------------- 以下是函数定义----------------------------------
		
		//初始化3个container：PD, Tikv, Tidb
		this.initContainer = function() {
			if (data!=null) {
				var deployFlag = data.DEPLOY_FLAG;
				data = data.DB_SERV_CONTAINER;
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
							this.iconDir+this.PDIcon, pd.PD_NAME, this.PD_CONST, this.nodeMenu, this.PDContainer, true, false);
					this.setMetaData(node, pd);
				}
					
				for (var i=0; i<DB_TIKV_CONTAINER.DB_TIKV.length; i++) {
					var tikv = DB_TIKV_CONTAINER.DB_TIKV[i];
					var node = this.addNodeToContainer(this.TikvContainer.x+1, this.TikvContainer.y+1, 
							this.iconDir+this.TikvIcon, tikv.TIKV_NAME, this.TIKV_CONST, this.nodeMenu, this.TikvContainer, true, false);
					this.setMetaData(node, tikv);
				}
					
				for (var i=0; i<DB_TIDB_CONTAINER.DB_TIDB.length; i++) {
					var tidb = DB_TIDB_CONTAINER.DB_TIDB[i];
					var node = this.addNodeToContainer(this.TidbContainer.x+1, this.TidbContainer.y+1, 
							this.iconDir+this.TidbIcon, tidb.TIDB_NAME, this.TIDB_CONST, this.nodeMenu, this.TidbContainer, true, false);
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
				this.needInitTopo = true;
				this.PDContainer = this.makeContainer(this.width*0.15, this.height*0.4, "PD集群", 1, 3, "node");
				this.TikvContainer = this.makeContainer(this.width*0.55, this.height*0.6, "TiKV集群", 1, 3, "node");
				this.TidbContainer = this.makeContainer(this.width*0.55, this.height*0.2, "TiDB集群", 1, 3, "node");
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

			Util.hideLoading();
		}
		
		//Tidb面板新增组件
		this.newComponent = function(x, y, datatype) {
			var container, img, text;
			switch(datatype) {
			case this.PD_CONST:
				container = this.PDContainer;
				img = this.iconDir+this.PDIcon;
				text = "PD";
				break;
			case this.TIKV_CONST:
				container = this.TikvContainer;
				img = this.iconDir+this.TikvIcon;
				text = "TIKV";
				break;
			case this.TIDB_CONST:
				container = this.TidbContainer;
				img = this.iconDir+this.TidbIcon;
				text = "TIDB";
				break;
			case this.COLLECTD_CONST:
				return this.addCollectd(x, y, this.iconDir+this.collectdIcon, "collectd", datatype, this.nodeMenu, false);
			}
			return this.addNodeToContainer(x, y, img, text, datatype, this.nodeMenu, container, false, true) != null;
		}
		
		//Tidb面板设置组件元数据
		this.setMetaData = function(element, data) {
			switch(element.type) {
			case this.PD_CONST:
				var id = data.PD_ID;
				var name = data.PD_NAME;
				delete data.PD_ID;
				delete data.PD_NAME;
				break;
			case this.TIKV_CONST:
				var id = data.TIKV_ID;
				var name = data.TIKV_NAME;
				delete data.TIKV_ID;
				delete data.TIKV_NAME;
				break;
			case this.TIDB_CONST:
				var id = data.TIDB_ID;
				var name = data.TIDB_NAME;
				delete data.TIDB_ID;
				delete data.TIDB_NAME;
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
		
		//提取组件元数据
		this.getMetaData = function(element) {
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
		}
		//tidb卸载元素
		this.undeployElement = function(element){
			var res = true;
			switch (element.type) {
				case 'DB_TIDB' :
					if(element.parentContainer.childs.length <= 1 ){
						Component.Alert("error", "TIDB的数量不能小于1！");
						res = false;
					}
					break;
				case 'DB_TIKV' :
					if(element.parentContainer.childs.length <= 3 ){
						Component.Alert("error", "TIKV的数量不能小于3！");
						res = false;
					}
					break;
				case 'DB_PD' :
					if(element.parentContainer.childs.length <= 3 ){
						Component.Alert("error", "PD的数量不能小于3！");
						res = false;
					}
					break;
			}
			if(res) {
				TidbPlate.prototype.undeployElement.call(this, element);
			}
		}
		
		//弹出窗口
		this.popupForm = function(element) {
			this.popElement = element; //存放目前正在填写信息的元素，表单窗口关闭时置为null
			switch(element.type) {
			case this.PD_CONST:
				this.PDForm.show(this.getMetaData(element));
				break;
			case this.TIKV_CONST:
				this.TikvForm.show(this.getMetaData(element));
				break;
			case this.TIDB_CONST:
				this.TidbForm.show(this.getMetaData(element));
				break;
			case this.COLLECTD_CONST:
				this.CollectdForm.show(this.getMetaData(element));
				break;
			}
		}
		
		//组件部署成功时的处理
		this.getElementDeployed = function(element) {
			if (element.elementType=="node") {
				element.status = "deployed";
				var self = this;
				element.removeEventListener('contextmenu');
				element.addEventListener('contextmenu', function(e) {
					self.deployedMenu.show(e);
				});
			}
		}
		
		//组件卸载成功时的处理
		this.getElementUndeployed = function(element) {
			if (element.elementType=="node") {
				//如果是tikv的卸载，特殊处理
				if(element.type == "DB_TIKV"){
					element.status = "waitFlash";
					var self = this;
					element.removeEventListener('contextmenu');
					//console.log(element);
					this.tikvStatusInterval = setInterval(this.tikvStatusCheck(id, element.meta.IP+":"+element.meta.PORT, element),1000);
					return;
				}
				element.status = "saved";
				var self = this;
				element.removeEventListener('contextmenu');
				element.addEventListener('contextmenu', function(e) {
					self.nodeMenu.show(e);
				});
			}
		}

		this.tikvStatusCheck = function(servId, instAdd, element, interval){
			var that = this;
			return function(){
				$.get(url + 'tidbsvr/tikvStatusService',{"SERV_ID":servId,"INST_ADD":instAdd},function(data){
					var store = data.RET_INFO;
					if(store == null || store == ""){
						//清除闪烁状态
						clearInterval(that.tikvStatusInterval);
						element.status = "saved";
						element.removeEventListener('contextmenu');
						element.addEventListener('contextmenu', function(e) {
							self.nodeMenu.show(e);
						});
					}
				});
			};
		}
		
		//保存面板拓扑信息(位置信息等)
		this.toPlateJson = function(needCollectd) {
			
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
//			this.TidbContainer.childs.forEach(function (tidb) {
//				DB_TIDB.push(self.getMetaData(tidb));
//			});
			DB_TIDB_CONTAINER.DB_TIDB = DB_TIDB;
			DB_SERV_CONTAINER.DB_TIDB_CONTAINER = DB_TIDB_CONTAINER;
			
			//TIKV集群
			var DB_TIKV_CONTAINER = {};
			DB_TIKV_CONTAINER.TIKV_CONTAINER_ID = this.TikvContainer._id;
			DB_TIKV_CONTAINER.TIKV_CONTAINER_NAME = this.TikvContainer.text;
			DB_TIKV_CONTAINER.POS = this.TikvContainer.getPosJson();
			var DB_TIKV = [];
//			this.TikvContainer.childs.forEach(function (tikv) {
//				DB_TIKV.push(self.getMetaData(tikv));
//			});
			DB_TIKV_CONTAINER.DB_TIKV = DB_TIKV;
			DB_SERV_CONTAINER.DB_TIKV_CONTAINER = DB_TIKV_CONTAINER;
			
			//PD集群
			var DB_PD_CONTAINER = {};
			DB_PD_CONTAINER.PD_CONTAINER_ID = this.PDContainer._id;
			DB_PD_CONTAINER.PD_CONTAINER_NAME = this.PDContainer.text;
			DB_PD_CONTAINER.POS = this.PDContainer.getPosJson();
			var DB_PD = [];
//			this.PDContainer.childs.forEach(function (pd) {
//				DB_PD.push(self.getMetaData(pd));
//			});
			DB_PD_CONTAINER.DB_PD = DB_PD;
			DB_SERV_CONTAINER.DB_PD_CONTAINER = DB_PD_CONTAINER;
			
			//collectd
			var collectd = {};
			if (needCollectd && this.collectd != null) {
				collectd.COLLECTD_ID = this.collectd._id;
				collectd.COLLECTD_NAME = this.collectd.text;
				var pos = {};
				pos.x = this.collectd.x+this.collectd.width/2;
				pos.y = this.collectd.y+this.collectd.height/2;
				collectd.POS = pos;
			}
			DB_SERV_CONTAINER.DB_COLLECTD = collectd;
			
			return {"DB_SERV_CONTAINER": DB_SERV_CONTAINER};
		}
		
		//初始化
		this.initContainer();
	}
	
	TidbPlate.prototype = new Component.Plate();
	Component.TidbPlate = TidbPlate;
})(Component);
