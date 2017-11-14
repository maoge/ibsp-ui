var Component = window.Component || {};


(function(Component) {
	
	/**
	 *  面板基类
	 */
	function Plate() {
		
		//常量
		this.fontColor = '3,13,247';
		this.font = '10pt 微软雅黑';
		this.borderColor = '170,170,170';
		this.fillColor = '225,225,225';
		this.borderWidth = 2;
		this.borderRadius = 10;
		this.defaultWidth = 32; //默认的node尺寸
		this.defaultHeight = 32;
		this.padding = 15;
		this.iconDir = "./img/"; //图标路径（暂定）
		
		//服务
		this.url = "http://192.168.37.175:9991/configsvr/"; //后台地址（暂定）
		this.saveTopoServ = "saveServiceTopoSkeleton"; //保存拓扑结构的服务
		this.getTopoServ = "loadServiceTopoByInstID"; //获取拓扑结构的服务（包括里面的组件）
		this.saveElementServ = "saveServiceNode"; //保存组件信息的服务
		this.delElementServ = "delServiceNode"; //删除组件信息的服务
		this.deployServ = "cureuprapapa"; //部署组件
		this.undeployServ = "cureuprapapa"; //卸载组件
		
		//初始化舞台
		this.initStage = function(name, canvas) {
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
			
			//暂时放在这里，应该从后台获取
			if (window.schema == undefined) {
				window.schema = '{"$schema":"http://json-schema.org/draft-03/schema#","type":"object","properties":{"DB_SERV_CONTAINER":{"type":"object","required":true,"properties":{"DB_SVC_CONTAINER_ID":{"type":"string","required":true,"minLength":36,"description":"DB服务容器ID"},"DB_SVC_CONTAINER_NAME":{"type":"string","required":true,"description":"DB服务容器名字"},"DB_TIDB_CONTAINER":{"type":"object","required":true,"properties":{"TIDB_CONTAINER_ID":{"type":"string","required":true,"minLength":36,"description":"TIDB容器ID"},"TIDB_CONTAINER_NAME":{"type":"string","required":true,"description":"TIDB容器名字"},"POS":{"type":"object","required":true,"properties":{"x":{"type":"integer","required":true},"y":{"type":"integer","required":true},"width":{"type":"integer"},"height":{"type":"integer"},"row":{"type":"integer"},"col":{"type":"integer"}}},"DB_TIDB":{"type":"array","required":true,"items":{"type":"object","properties":{"TIDB_ID":{"type":"string","required":true,"minLength":36,"description":"TIDBID","inputDisabled":true},"TIDB_NAME":{"type":"string","required":true,"description":"TIDBName"},"IP":{"type":"string","required":true,"description":"IP"},"PORT":{"type":"string","required":true,"description":"服务端口"},"STAT_PORT":{"type":"string","required":true,"description":"统计数据端口"},"OS_USER":{"type":"string","required":true,"description":"系统账户"},"OS_PWD":{"type":"string","required":true,"description":"系统密码"}},"minItems":2}}}},"DB_TIKV_CONTAINER":{"type":"object","required":true,"properties":{"TIKV_CONTAINER_ID":{"type":"string","required":true,"minLength":36,"description":"TIKV容器ID"},"TIKV_CONTAINER_NAME":{"type":"string","required":true,"description":"TIKV容器名字"},"POS":{"type":"object","required":true,"properties":{"x":{"type":"integer","required":true},"y":{"type":"integer","required":true},"width":{"type":"integer"},"height":{"type":"integer"},"row":{"type":"integer"},"col":{"type":"integer"}}},"DB_TIKV":{"type":"array","required":true,"items":{"type":"object","properties":{"TIKV_ID":{"type":"string","required":true,"minLength":36,"description":"TIKVID","inputDisabled":true},"TIKV_NAME":{"type":"string","required":true,"description":"TIKVName"},"IP":{"type":"string","required":true,"description":"IP"},"PORT":{"type":"string","required":true,"description":"服务端口"},"OS_USER":{"type":"string","required":true,"description":"系统账户"},"OS_PWD":{"type":"string","required":true,"description":"系统密码"}},"minItems":3}}}},"DB_PD_CONTAINER":{"type":"object","required":true,"properties":{"PD_CONTAINER_ID":{"type":"string","required":true,"minLength":36,"description":"PD容器ID"},"PD_CONTAINER_NAME":{"type":"string","required":true,"description":"PD容器名字"},"POS":{"type":"object","required":true,"properties":{"x":{"type":"integer","required":true},"y":{"type":"integer","required":true},"width":{"type":"integer"},"height":{"type":"integer"},"row":{"type":"integer"},"col":{"type":"integer"}}},"DB_PD":{"type":"array","required":true,"items":{"type":"object","properties":{"PD_ID":{"type":"string","required":true,"minLength":36,"description":"PDID","inputDisabled":true},"PD_NAME":{"type":"string","required":true,"description":"PDName"},"IP":{"type":"string","required":true,"description":"IP"},"PORT":{"type":"string","required":true,"description":"服务端口"},"CLUSTER_PORT":{"type":"string","required":true,"description":"集群端口"},"OS_USER":{"type":"string","required":true,"description":"系统账户"},"OS_PWD":{"type":"string","required":true,"description":"系统密码"}},"minItems":3}}}},"DB_COLLECTD":{"type":"object","required":true,"properties":{"COLLECTD_ID":{"type":"string","required":true,"minLength":36,"description":"COLLECTDID","inputDisabled":true},"COLLECTD_NAME":{"type":"string","required":true,"description":"COLLECTDNAME"},"IP":{"type":"string","required":true,"description":"IP"},"PORT":{"type":"string","required":true,"description":"服务端口"},"OS_USER":{"type":"string","required":true,"description":"系统账户"},"OS_PWD":{"type":"string","required":true,"description":"系统密码"},"POS":{"type":"object","required":true,"properties":{"x":{"type":"integer","required":true},"y":{"type":"integer","required":true},"width":{"type":"integer"},"height":{"type":"integer"},"row":{"type":"integer"},"col":{"type":"integer"}}}}}}}}}';
				window.schema = JSON.parse(window.schema);
			}
		}
		
		//创建一个container容器
		this.makeContainer = function(x, y, text, rows, cols, type) {
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
		
		//创建一个node
		this.makeNode = function(x, y, img, text, type, menu, isSaved) {
			var node = new JTopo.Node();
			node.font = this.font;
			node.fontColor= this.fontColor;
			node.setImage(img);
			node.text = text;
			node.dragable = true;
	    	node.x = x - this.defaultWidth/2;
	    	node.y = y - this.defaultHeight/2;
	    	node.type = type; //组件类型
	    	node.isDeployed = false; //是否已部署
	    	node.isSaved = isSaved; //信息是否已保存(从后台得到的节点数据为true，而新拖的节点为false)
	    	
	    	node.addEventListener('contextmenu', function(e) {
	    		menu.show(e);
	    		});
			return node;
		}
		
		/**
		 * 新增一个node到container中
		 */
		this.addNodeToContainer = function(x, y, img, text, type,menu, container, isSaved) {
			
			x =  this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
			y = this.height/2 - this.scene.translateY - (this.height/2 - y) / this.scene.scaleY;
	        
	        if (container!=null && container.isInContainer(x, y)) {
	    		var node = this.makeNode(x - this.defaultWidth/2, y - this.defaultHeight/2, img, text, type, menu, isSaved);
				this.scene.add(node);
				container.add(node);
				this.popupForm(node); //弹出信息窗
				return node;
			} else {
	        	warningAlert("提示", "请将组件拖放到对应的容器中！");
	        	return null;
			}
		}

		//新增collectd
		this.addCollectd = function(x, y, img, text, type, menu, isSaved) {
			if (this.collectd!=null) {
	        	warningAlert( "提示", "集群中只能有一个collectd！");
				return false;
			}
			x =  this.width/2 - this.scene.translateX - (this.width/2 - x) / this.scene.scaleX;
			y = this.height/2 - this.scene.translateY - (this.height/2 - y) / this.scene.scaleY;
			var node = this.makeNode(x - this.defaultWidth/2, y - this.defaultHeight/2, img, text, type, menu, isSaved);
			this.scene.add(node);
			this.collectd = node;
			this.popupForm(node);
			return true;
		}
		
		//新增一个container到container中
		this.addContainerToContainer = function(x, y, text, rows, cols, container) {
			
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

		//从界面上删除选中的组件
		this.deleteComponent = function(element) {
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
		
		//后台删除选中的组件
		this.deleteComponentBackground = function(element) {
			
			var parentID = (element.parentContainer!=undefined && element.parentContainer!=null) ? element.parentContainer._id : this.id;
			var self = this;
			
			$.ajax({
				url: this.url+this.delElementServ,
				type: "post",
				dataType: "json",
				data: {"PARENT_ID":parentID, "INST_ID": element._id},
				timeout: 3000,
				error: function(xhr) {
					errorAlert("提示", "删除组件信息失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "删除组件信息成功！");
						self.deleteComponent(element);
					} else {
						errorAlert("提示", "删除组件信息失败！"+result.RET_INFO);
					}
				}
			});
		}
		
		//告警指定的节点
		this.alarmNode = function(name, info) {
			var nodes = this.scene.findElements(function(e) {
				return e.elementType =="node" && e.text == name;
			});
			$.each(nodes, function(index, node) {
				node.alarm = info;
				node.alarmStyle = "flash";
			});
		}
		
		//保存拓扑数据到后台
		this.saveTopoData = function(callback) {
			console.log(JSON.stringify(this.toPlateJson()));
			$.ajax({
				url: this.url+this.savetTopoServ,
				type: "post",
				dataType: "json",
				data: {"TOPO_JSON": JSON.stringify(plate.toPlateJson()), "SERV_TYPE":"DB"},
				timeout: 3000,
				error: function(xhr) {
					errorAlert("提示", "保存面板信息失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "保存面板信息成功！");
						if (this.needInitTopo) {
							this.needInitTopo = false;
							callback();
						}
					} else {
						errorAlert("提示", "保存面板信息失败！"+result.RET_INFO);
					}
				}
			});
		}

		//获取集群拓扑数据
		this.getTopoData = function(id) {
			//测试数据
			return  {"DB_SERV_CONTAINER":{"DB_SVC_CONTAINER_ID":"0a161eb3-3434-06a2-45d0-02b1ed7122e8","DB_SVC_CONTAINER_NAME":"集群","DB_TIDB_CONTAINER":{"TIDB_CONTAINER_ID":"e0a56059-780b-ba2d-5df0-d33a51809732","TIDB_CONTAINER_NAME":"TiDB集群","POS":{"x":600,"y":103,"row":1,"col":3},"DB_TIDB":[{"TIDB_ID":"6a607072-0d26-ceac-bd4f-04120e6446f2","TIDB_NAME":"TiDB","IP":"","PORT":"","STAT_PORT":""},{"TIDB_ID":"0e8cfcbd-aaa3-b5b0-8066-f27c53b7b806","TIDB_NAME":"TiDB","IP":"","PORT":"","STAT_PORT":""}]},"DB_TIKV_CONTAINER":{"TIKV_CONTAINER_ID":"a395f9de-9074-a3d1-258a-fa12d5c07a41","TIKV_CONTAINER_NAME":"TiKV集群","POS":{"x":600,"y":309,"row":1,"col":3},"DB_TIKV":[{"TIKV_ID":"51d152a8-8f7b-a296-b233-446d9ee6ac77","TIKV_NAME":"TiKV","IP":"","PORT":""},{"TIKV_ID":"93ec410c-f94f-c3ff-9156-170ed2a939e1","TIKV_NAME":"TiKV","IP":"","PORT":""},{"TIKV_ID":"5091bb19-e8e6-2aa9-f189-f5519ed9a4aa","TIKV_NAME":"TiKV","IP":"","PORT":""}]},"DB_PD_CONTAINER":{"PD_CONTAINER_ID":"7cea12fb-b1fe-7046-1842-9853780ca329","PD_CONTAINER_NAME":"PD集群","POS":{"x":144,"y":200,"row":1,"col":3},"DB_PD":[{"PD_ID":"a4b10cd4-f7d4-da32-48ae-1ea68ea89e56","PD_NAME":"PD","IP":"","PORT":"","CLUSTER_PORT":""},{"PD_ID":"9c59c674-668c-4d79-5007-c2e43e7f14cb","PD_NAME":"PD","IP":"","PORT":"","CLUSTER_PORT":""},{"PD_ID":"c3403a0a-e1ac-3b7a-56f2-e94a214f8f74","PD_NAME":"PD","IP":"","PORT":"","CLUSTER_PORT":""}]},"DB_COLLECTD":{"COLLECTD_ID":"d3a9c6dd-d945-fa9b-8515-c6aef37b7c58","COLLECTD_NAME":"collectd","IP":"","PORT":"","POS":{"x":393,"y":84}}}};
			var value = null;
			$.ajax({
				url: this.url+this.getTopoServ,
				type: "post",
				dataType: "json",
				async: false,
				data: {"INST_ID": id},
				error: function(xhr) {
					errorAlert("提示", "获取组件信息失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						value = result.RET_INFO;
					} else {
						errorAlert("提示", "获取组件信息失败！"+result.RET_INFO);
					}
				}
			});
			return value;
		}
		
		//保存组件（单个）数据到后台
		this.saveElementData = function(element, jsonString, popupForm) {
			if (this.needInitTopo) {
				this.saveTopoData(function() {
					this.saveElementData(element, jsonString, popupForm);
				});
				return;
			}
			var parentID = (element.parentContainer!=undefined && element.parentContainer!=null) ? element.parentContainer._id : this.id;
			var data = {};
			var type = element.isSaved ? 2 : 1;
			
			var json = JSON.parse(jsonString);
			data[element.type] = [];
			data[element.type].push(json); //单个组件，如果有需要也可以多个
			var self = this;
			
			$.ajax({
				url: this.url+this.saveElementServ,
				type: "post",
				dataType: "json",
				data: {"NODE_JSON": JSON.stringify(data), "PARENT_ID":parentID, "OP_TYPE": type},
				timeout: 3000,
				error: function(xhr) {
					errorAlert("提示", "保存组件信息失败！"+xhr.status+":"+xhr.statusText);
//					self.setMetaData(element, json);
					popupForm.clearLoading();
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "保存组件信息成功！");
						self.setMetaData(element, json);
						element.isSaved = true;
						popupForm.clearLoading();
						popupForm.hide();
						self.popElement = null;
					} else {
						errorAlert("提示", "保存组件信息失败！"+result.RET_INFO);
						popupForm.clearLoading();
					}
				}
			});
		}
		
		//部署组件（一个组件或一个面板）
		this.deployElement = function(element) {
			//TODO 部署组件
			var id = element ? element._id : this.id;
			var self = this;

			successAlert("提示", "组件部署成功！");
			if (element) {
				this.getElementDeployed(element);
			} else {
				this.scene.childs.forEach(function(e) {
					if (e.elementType != "link") {
						self.getElementDeployed(e);
					}
				});
			}
		}
		
		//卸载组件（只能一个组件）
		this.undeployElement = function(element) {
	 	   //TODO 卸载组件
	 	   successAlert("提示", "组件卸载成功！");
	 	   element.isDeployed = false;
	 	   var self = this;
	 	   element.removeEventListener('contextmenu');
	 	   element.addEventListener('contextmenu', function(e) {
	 		   self.nodeMenu.show(e);
	 		   });
		}
	}
	
	Component.Plate = Plate;
})(Component);
