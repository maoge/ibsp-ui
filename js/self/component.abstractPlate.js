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
		this.defaultWidth = 36; //默认的node尺寸
		this.defaultHeight = 36;
		this.padding = 15;
		
		//一些与html及外部有关的参数
		this.iconDir = "./img/"; //图标路径
		this.loadingDiv = $("#loading"); //正在后台操作的提示框
		this.url = "http://127.0.0.1:9991/"; //后台地址
		
		//服务
		this.saveTopoServ = "configsvr/saveServiceTopoSkeleton"; //保存拓扑结构的服务
		this.getTopoServ = "configsvr/loadServiceTopoByInstID"; //获取拓扑结构的服务（包括里面的组件）
		this.saveElementServ = "configsvr/saveServiceNode"; //保存组件信息的服务
		this.delElementServ = "configsvr/delServiceNode"; //删除组件信息的服务
		this.deployServ = "deploy/deployService"; //部署组件
		this.undeployServ = "undeployService"; //卸载组件
		this.ajaxTimeout = 5000; //超时时间5秒
		
		//状态图标
		this.deployedIcon = new Image();
		this.deployedIcon.src = this.iconDir+"status_deployed.png";
		this.savedIcon = new Image();
		this.savedIcon.src = this.iconDir+"status_saved.png";
		
		//初始化舞台
		this.initStage = function(name, canvas) {
			this.id = JTopo.util.guid();
			this.name = name;
			
			this.canvas = canvas.getContext("2d");
	        this.canvas.font = this.font;
			//默认的子container尺寸（通常包含两个node，一主一从）
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
			this.isDeployed = false; //是否已部署（集群）
			
			if (window.schema == undefined) {
				$.ajax({
						url: "/schema/tidb.schema",
						type: "get",
						async: false,
						success: function(data){
							schema = JSON.parse(data); 
							window.schema = schema;
						}
				});
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
			var node = new Component.StatusNode();
			node.font = this.font;
			node.fontColor= this.fontColor;
			node.setImage(img);
			node.text = text;
			node.dragable = true;
	    	node.x = x - this.defaultWidth/2;
	    	node.y = y - this.defaultHeight/2;
	    	node.width = this.defaultWidth;
	    	node.height = this.defaultHeight;
	    	node.type = type; //组件类型
	    	node.status = isSaved ? "saved" : "new";
	    	node.statusIcons = {"deployed": this.deployedIcon, "saved": this.savedIcon}; //状态图标
	    	
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
				timeout: this.ajaxTimeout,
				beforeSend: function() {
					self.loadingDiv.show();
				},
				complete: function() {
					self.loadingDiv.hide();
				},
				error: function(xhr) {
					errorAlert("提示", "删除组件信息失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "删除组件信息成功！");
						self.deleteComponent(element); //从jtopo图上删除组件
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
		
		//获取集群拓扑数据
		this.getTopoData = function(id) {
			//测试数据
			var value = null;
			$.ajax({
				url: this.url+this.getTopoServ,
				type: "post",
				dataType: "json",
				timeout: 30000,
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
		
		//设置组件是否已部署
		this.getDeployFlag = function(flag) {
			var self = this;
			var deployed = [];
			flag.forEach(function(obj) {
				for(var id in obj) {
					if (obj[id] == "1") {
						if (id == self.id) {
							self.isDeployed = true;
						} else {
							deployed.push(id);
						}
					}
				}
			});
			self.scene.childs.forEach(function(element) {
				deployed.forEach(function(id) {
					if (element._id == id) {
						self.getElementDeployed(element);
					}
				});
			});
		}
		
		//保存拓扑数据到后台
		this.saveTopoData = function(params) {
			var self = this;
			
			$.ajax({
				url: this.url+this.saveTopoServ,
				type: "post",
				dataType: "json",
				data: {"TOPO_JSON": JSON.stringify(plate.toPlateJson()), "SERV_TYPE":"DB"},
				timeout: this.ajaxTimeout,
				beforeSend: function() {
					self.loadingDiv.show();
				},
				complete: function() {
					self.loadingDiv.hide();
				},
				error: function(xhr) {
					errorAlert("提示", "保存面板信息失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						self.needInitTopo = false;
						//如果有传入参数，代表是从saveElement过来的，需要调用saveElement保存组件信息
						if (params) {
							self.saveElementData(params[0], params[1], params[2]);
						} else {
							successAlert("提示", "保存面板信息成功！");
						}
					} else {
						errorAlert("提示", "保存面板信息失败！"+result.RET_INFO);
					}
				}
			});
		}
		
		//保存组件（单个）数据到后台
		this.saveElementData = function(element, jsonString, popupForm) {
			
			//如果还没有保存拓扑结构，需要先保存拓扑结构
			if (this.needInitTopo) {
				this.saveTopoData([element, jsonString, popupForm]);
				return; //不需要再往下走了，由saveTopoData成功时调用
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
				timeout: this.ajaxTimeout,
				beforeSend: function() {
					self.loadingDiv.show();
				},
				complete: function() {
					self.loadingDiv.hide();
				},
				error: function(xhr) {
					errorAlert("提示", "保存组件信息失败！"+xhr.status+":"+xhr.statusText);
					popupForm.clearLoading();
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "保存组件信息成功！");
						self.setMetaData(element, json);
						element.status = "saved";
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
			var id = element ? element._id : undefined;
			var self = this;
			$.ajax({
				url: this.url+this.deployServ,
				type: "post",
				dataType: "json",
				data: {"INST_ID": id, "SERV_ID": this.id, "SESSION_KEY": this.randomStr(20, 'k')},
				timeout: 30000,
				beforeSend: function() {
					self.loadingDiv.show();
				},
				complete: function() {
					self.loadingDiv.hide();
				},
				error: function(xhr) {
					errorAlert("提示", "组件部署失败！"+xhr.status+":"+xhr.statusText);
				},
				success:function(result) {
					if (result.RET_CODE==0) {
						successAlert("提示", "组件部署成功！");
						if (element) {
							self.getElementDeployed(element);
						} else {
							self.scene.childs.forEach(function(e) {
								if (e.elementType != "link") {
									self.getElementDeployed(e);
								}
							});
						}
					} else {
						errorAlert("提示", "组件部署失败！"+result.RET_INFO);
					}
				}
			});
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
		
		//随机串
		this.randomStr = function(len,radix) {
		    radix = radix ? 10 : 36;
		    var rdmString = "";
		    for (; rdmString.length < len; rdmString += Math.random().toString(radix).substr(2));
		    return rdmString.substr(0, len);
		}
	}
	
	Component.Plate = Plate;
})(Component);
