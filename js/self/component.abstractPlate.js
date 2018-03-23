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
		this.fillColor = '245,245,245';
		this.borderWidth = 2;
		this.borderRadius = 10;
		this.defaultWidth = 36; //默认的node尺寸
		this.defaultHeight = 36;
		this.padding = 15;
		this.shortTimeout = 5000; //超时时间(短)
		this.longTimeout = 60000; //超时时间(长，如安装部署等)

		//一些与html及外部有关的参数
		this.iconDir = "../images/console/"; //图标路径

		//服务
		this.saveTopoServ = "configsvr/saveServiceTopoSkeleton"; //保存拓扑结构的服务
		this.getTopoServ = "configsvr/loadServiceTopoByInstID"; //获取拓扑结构的服务（包括里面的组件）
		this.saveElementServ = "configsvr/saveServiceNode"; //保存组件信息的服务
		this.delElementServ = "configsvr/delServiceNode"; //删除组件信息的服务
		this.deployServ = "deploy/deployService"; //部署服务
		this.deployLogServ = "deploy/getDeployLog"; //部署日志
		this.deployInstanceServ = "deploy/deployInstance"; //部署实例
		this.undeployServ = "deploy/undeployInstance"; //卸载组件
		this.getUserServ = "resourcesvr/getUserByServiceType" //获取服务器IP及操作系统用户信息

		//状态图标
		this.deployedIcon = new Image();
		this.deployedIcon.src = this.iconDir + "status_deployed.png";
		this.savedIcon = new Image();
		this.savedIcon.src = this.iconDir + "status_saved.png";

		this.setRootUrl = function (url) {
			this.url = url;
		}
		this.PlateType = null;
		//初始化舞台
		this.initStage = function (id, name, canvas) {
			this.id = id;
			this.name = name;

			this.canvas = canvas.getContext("2d");
			this.canvas.font = this.font;
			//默认的子container尺寸（通常包含两个node，一主一从）
			this.defaultContainerW = this.defaultWidth * 3 + this.padding;
			this.defaultContainerH = this.defaultHeight * 2 + this.canvas.measureText("田").width;

			this.stage = new JTopo.Stage(canvas);
			this.stage.wheelZoom = 0.85;
			this.scene = new JTopo.Scene();
			this.scene.mode = "normal";
			this.stage.add(this.scene);

			this.width = $(canvas).attr("width");
			this.height = $(canvas).attr("height");

			this.collectd = null;

			function loadSchema(schemaName) {
				if (!window[schemaName]) {
					var url = "./schema/" + schemaName;
					$.ajax({
						url: url,
						type: "get",
						async: false,
						success: function (data) {
							window[schemaName] = JSON.parse(data);
						}
					});
				}
			};
			loadSchema("tidb.schema");
			loadSchema("mq.schema");
			loadSchema("cache.schema");
		}
	}

	//创建一个container容器
	Plate.prototype.makeContainer = function (x, y, text, rows, cols, type, eleType) {
		var container = null;
		if (type == "container") {
			container = new Component.FlexibleContainer(rows, cols, this.padding, this.canvas.measureText("田").width);
			container.height = (rows + 1) * this.defaultContainerH + rows * this.canvas.measureText("田").width + (rows - 1) * this.padding;
			container.width = (cols + 1) * this.defaultContainerW + (cols - 1) * this.padding;
		} else {
			container = new Component.FlexibleContainer(rows, cols, this.padding, this.canvas.measureText("田").width);
			container.height = (rows + 1) * this.defaultHeight + rows * this.canvas.measureText("田").width + (rows - 1) * this.padding;
			container.width = (cols + 1) * this.defaultWidth + (cols - 1) * this.padding;
		}
		if (eleType) {
			container.type = eleType;
		}
		container.fontColor = this.fontColor;
		container.font = this.font;
		container.borderColor = this.borderColor;
		container.fillColor = this.fillColor;
		container.borderWidth = this.borderWidth;
		container.borderRadius = this.borderRadius;

		container.x = x - container.width / 2;
		container.y = y - container.height / 2;
		container.dragable = true;
		container.text = text;
		container.textPosition = 'Top_Left';

		this.scene.add(container);
		return container;
	}

	//创建一个node
	Plate.prototype.makeNode = function (x, y, img, text, type, menu, isSaved) {
		var node = new Component.StatusNode();
		node.font = this.font;
		node.fontColor = this.fontColor;
		node.setImage(img);
		node.text = text;
		node.dragable = true;
		node.x = x;
		node.y = y;
		node.width = this.defaultWidth;
		node.height = this.defaultHeight;
		node.type = type; //组件类型
		node.status = isSaved ? "saved" : "new";
		node.statusIcons = {"deployed": this.deployedIcon, "saved": this.savedIcon}; //状态图标

		node.addEventListener('contextmenu', function (e) {
			menu.show(e);
		});
		return node;
	}

	/**
	 * 新增一个node到container中
	 */
	Plate.prototype.addNodeToContainer = function (x, y, img, text, type, menu, container, isSaved) {
		x = this.width / 2 - this.scene.translateX - (this.width / 2 - x) / this.scene.scaleX;
		y = this.height / 2 - this.scene.translateY - (this.height / 2 - y) / this.scene.scaleY;

		if (container != null && container.isInContainer(x, y)) {
			var node = this.makeNode(x - this.defaultWidth / 2, y - this.defaultHeight / 2, img, text, type, menu, isSaved);
			this.scene.add(node);
			container.add(node);
			if (!isSaved) {
				this.popupForm(node); //弹出信息窗
			}
			return node;
		} else {
			Component.Alert("warn", "请将组件拖放到对应的容器中！");
			return null;
		}
	}

	//新增collectd
	Plate.prototype.addCollectd = function (x, y, img, text, type, menu, isSaved) {
		if (this.collectd != null) {
			Component.Alert("warn", "集群中只能有一个collectd！");
			return false;
		}
		x = this.width / 2 - this.scene.translateX - (this.width / 2 - x) / this.scene.scaleX;
		y = this.height / 2 - this.scene.translateY - (this.height / 2 - y) / this.scene.scaleY;
		var node = this.makeNode(x - this.defaultWidth / 2, y - this.defaultHeight / 2, img, text, type, menu, isSaved);
		this.scene.add(node);
		this.collectd = node;
		if (!isSaved) {
			this.popupForm(node); //弹出信息窗
		}
		return true;
	}

	//新增一个container到container中
	Plate.prototype.addContainerToContainer = function (x, y, text, type, rows, cols, menu, container, isSaved) {

		x = this.width / 2 - this.scene.translateX - (this.width / 2 - x) / this.scene.scaleX;
		y = this.width / 2 - this.scene.translateY - (this.width / 2 - y) / this.scene.scaleY;

		if (container != null && container.isInContainer(x, y)) {
			var newContainer = this.makeContainer(x - this.defaultContainerW / 2, y - this.defaultContainerH / 2, text, 1, 2, "node");
			container.add(newContainer);
			newContainer.type = type;
			newContainer.addEventListener('contextmenu', function (e) {
				menu.show(e);
			});
			debugger;
			if (!isSaved) {
				newContainer.status = "new";
				this.popupForm(newContainer); //弹出信息窗
			} else {
				newContainer.status = "saved";
			}

			return newContainer;
		} else {
			return null;
		}
	}

	//从界面上删除选中的组件
	Plate.prototype.deleteComponent = function (element) {
		if (element.elementType == "container") {
			for (var i = element.childs.length - 1; i >= 0; i--) {
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
	Plate.prototype.deleteComponentBackground = function (element) {

		var parentID = (element.parentContainer != undefined && element.parentContainer != null) ? element.parentContainer._id : this.id;
		var self = this;

		$.ajax({
			url: this.url + this.delElementServ,
			type: "post",
			dataType: "json",
			data: {"PARENT_ID": parentID, "INST_ID": element._id},
			timeout: this.shortTimeout,
			beforeSend: function () {
				Util.showLoading();
			},
			complete: function () {
				Util.hideLoading();
			},
			error: function (xhr) {
				Component.Alert("error", "删除组件信息失败！" + xhr.status + ":" + xhr.statusText);
			},
			success: function (result) {
				if (result.RET_CODE == 0) {
					Component.Alert("success", "删除组件信息成功！");
					self.deleteComponent(element); //从jtopo图上删除组件
				} else {
					Component.Alert("error", "删除组件信息失败！" + result.RET_INFO);
				}
			}
		});
	}

	//告警指定的节点
	Plate.prototype.alarmNode = function (name, info) {
		var nodes = this.scene.findElements(function (e) {
			return e.elementType == "node" && e.text == name;
		});
		$.each(nodes, function (index, node) {
			node.alarm = info;
			node.alarmStyle = "flash";
		});
	}

	//获取集群拓扑数据
	Plate.prototype.getTopoData = function (id) {
		var self = this;
		var value = null;
		$.ajax({
			url: this.url + this.getTopoServ,
			type: "post",
			dataType: "json",
			async: false,
			data: {"INST_ID": id},
			error: function (xhr) {
				Component.Alert("error", "获取组件信息失败！" + xhr.status + ":" + xhr.statusText);
			},
			success: function (result) {
				if (result.RET_CODE == 0) {
					value = result.RET_INFO;
				} else if (result.RET_CODE == -5) {
					value = "init";
				} else {
					Component.Alert("error", "获取组件信息失败！" + result.RET_INFO);
				}
			}
		});
		return value;
	}

	//设置组件是否已部署
	Plate.prototype.getDeployFlag = function (flag) {
		var self = this;
		var deployed = [];
		flag.forEach(function (obj) {
			for (var id in obj) {
				if (obj[id] == "1") {
					deployed.push(id);
				}
			}
		});
		self.scene.childs.forEach(function (element) {
			deployed.forEach(function (id) {
				if (element._id == id) {
					self.getElementDeployed(element);
				}
			});
		});
	}

	//保存拓扑数据到后台
	Plate.prototype.saveTopoData = function (params, serverType) {
		var self = this,
			json = params ? plate.toPlateJson(false) : plate.toPlateJson(true),
			type = serverType ? serverType : this.PlateType;

		$.ajax({
			url: this.url + this.saveTopoServ,
			type: "post",
			dataType: "json",
			data: {"TOPO_JSON": JSON.stringify(json), "SERV_TYPE": type},
			timeout: this.shortTimeout,
			beforeSend: function () {
				Util.showLoading();
			},
			complete: function () {
				Util.hideLoading();
			},
			error: function (xhr) {
				Component.Alert("error", "保存面板信息失败！" + xhr.status + ":" + xhr.statusText);
			},
			success: function (result) {
				if (result.RET_CODE == 0) {
					self.needInitTopo = false;
					//如果有传入参数，代表是从saveElement过来的，需要调用saveElement保存组件信息
					if (params) {
						self.saveElementData(params[0], params[1], params[2]);
					} else {
						Component.Alert("success", "保存面板信息成功！");
					}
				} else {
					Component.Alert("error", "保存面板信息失败！" + result.RET_INFO);
				}
			}
		});
	}

	//保存组件（单个）数据到后台
	Plate.prototype.saveElementData = function (element, jsonString, popupForm) {
		//如果还没有保存拓扑结构，需要先保存拓扑结构
		if (this.needInitTopo) {
			this.saveTopoData([element, jsonString, popupForm]);
			return; //不需要再往下走了，由saveTopoData成功时调用
		}
		var parentID = (element.parentContainer != undefined && element.parentContainer != null) ? element.parentContainer._id : this.id;
		var data = {};
		debugger;
		var type = element.status != "new" ? 2 : 1;
		var json = JSON.parse(jsonString);
		//collectd需要保存位置信息
		if (element.type == this.COLLECTD_CONST) {
			var pos = {};
			pos['x'] = element.x;
			pos['y'] = element.y;
			json['POS'] = pos;
		}
		data[element.type] = [];
		data[element.type].push(json); //单个组件，如果有需要也可以多个
		var self = this;

		$.ajax({
			url: this.url + this.saveElementServ,
			type: "post",
			dataType: "json",
			data: {"NODE_JSON": JSON.stringify(data), "PARENT_ID": parentID, "OP_TYPE": type},
			timeout: this.shortTimeout,
			beforeSend: function () {
				Util.showLoading();
			},
			complete: function () {
				Util.hideLoading();
			},
			error: function (xhr) {
				Component.Alert("error", "保存组件信息失败！" + xhr.status + ":" + xhr.statusText);
				Util.hideLoading();
			},
			success: function (result) {
				if (result.RET_CODE == 0) {
					Component.Alert("success", "保存组件信息成功！");
					self.setMetaData(element, json);
					element.status = "saved";
					Util.hideLoading();
					popupForm.hide();
					self.popElement = null;
				} else {
					Component.Alert("error", "保存组件信息失败！" + result.RET_INFO);
					Util.hideLoading();
				}
			}
		});
	}

	//部署组件（一个组件或一个面板）
	Plate.prototype.deployElement = function (element) {
		var key = this.randomStr(20, 'k');
		var id = element ? element._id : undefined;
		var self = this;
		var url = element ? this.url + this.deployInstanceServ : this.url + this.deployServ;
		$("#log").html("deploy start ...<br/>");
		var myCurrInt = this.openLayer(key, myCurrInt);

		$.ajax({
			url: url,
			type: "post",
			dataType: "json",
			data: {"INST_ID": id, "SERV_ID": this.id, "SESSION_KEY": key},
			timeout: this.longTimeout,
			error: function (xhr) {
				clearInterval(myCurrInt);
				Component.Alert("error", "组件部署失败！" + xhr.status + ":" + xhr.statusText);
			},
			success: function (result) {
				clearInterval(myCurrInt);
				if (self.isNotNull(myCurrInt)) {
					var logs = self.getDeployLog(key);
					if (self.isNotNull(logs)) {
						$("#log").append(logs);
						$("#log").parent().scrollTop($("#log").height() + 20);
					}
				}
				if (result.RET_CODE == 0) {
					Component.Alert("success", "组件部署成功！");
					if (element) {
						self.getElementDeployed(element);
					} else {
						self.scene.childs.forEach(function (e) {
							if (e.elementType != "link") {
								self.getElementDeployed(e);
							}
						});
					}
				} else {
					Component.Alert("error", "组件部署失败！" + result.RET_INFO);
				}
			}
		});
	}

	//卸载组件（只能一个组件）
	Plate.prototype.undeployElement = function (element) {
		var key = this.randomStr(20, 'k');
		var self = this;
		var url = this.url + this.undeployServ;
		$("#log").html("undeploy start ...<br/>");
		var myCurrInt = this.openLayer(key, myCurrInt);

		$.ajax({
			url: url,
			type: "post",
			dataType: "json",
			data: {"INST_ID": element._id, "SERV_ID": this.id, "SESSION_KEY": key},
			timeout: this.longTimeout,
			error: function (xhr) {
				clearInterval(myCurrInt);
				Component.Alert("error", "组件卸载失败！" + xhr.status + ":" + xhr.statusText);
			},
			success: function (result) {
				clearInterval(myCurrInt);
				if (self.isNotNull(myCurrInt)) {
					var logs = self.getDeployLog(key);
					if (self.isNotNull(logs)) {
						$("#log").append(logs);
						$("#log").parent().scrollTop($("#log").height() + 20);
					}
				}
				if (result.RET_CODE == 0) {
					Component.Alert("success", "组件卸载成功！");
					self.getElementUndeployed(element);
				} else {
					Component.Alert("error", "组件卸载失败！" + result.RET_INFO);
				}
			}
		});
	}

	Plate.prototype.openLayer = function (key, myCurrInt) {
		var height = $(window).height() * 0.7;
		var width = $(window).width() * 0.7;
		var self = this;
		var myCurrInt = setInterval(function () {
			var logs = self.getDeployLog(key);
			if (self.isNotNull(logs)) {
				$("#log").append(logs);
				$("#log").parent().scrollTop($("#log").height() + 20);
			}
		}, 500);

		var index = layer.open({
			type: 1,
			title: ["控制台信息"],
			skin: 'layui-layer-self', //加上边框
			area: [width + 'px', height + 'px'], //宽高
			content: $("#log"),
			btn: ['停止刷新日志', '恢复刷新日志'],
			yes: function (index, layero) {
				console.log(myCurrInt);
				clearInterval(myCurrInt);
			},
			btn2: function (index, layero) {
				clearInterval(myCurrInt);
				myCurrInt = setInterval(function () {
					var logs = self.getDeployLog(key);
					if (self.isNotNull(logs)) {
						$("#log").append(logs);
						$("#log").parent().scrollTop($("#log").height() + 20);
					}
				}, 500);
				return false;
			},
			cancel: function () {
				clearInterval(myCurrInt);
			}
		});
		return myCurrInt;
	}

	Plate.prototype.getDeployLog = function (key) {
		var res;
		if (this.isNotNull(key)) {
			$.ajax({
				url: this.url + this.deployLogServ,
				type: "get",
				dataType: "json",
				data: {key: key},
				async: false,
				success: function (result) {
					if (self.isNotNull(result))
						res = result.RET_INFO;
				}
			});
		}
		return res;
	}

	//为表单获取服务器主机信息
	Plate.prototype.getIpUser = function (type, forms) {
		var self = this;
		$.ajax({
			url: this.url + this.getUserServ,
			type: "post",
			dataType: "json",
			data: {"SERVICE_TYPE": type},
			success: function (result) {
				if (result.RET_CODE == 0) {
					forms.forEach(function (form) {
						form.setUserInfo(result.RET_INFO);
					});
				}
			}
		});
	}

	//随机串
	Plate.prototype.randomStr = function (len, radix) {
		radix = radix ? 10 : 36;
		var rdmString = "";
		for (; rdmString.length < len; rdmString += Math.random().toString(radix).substr(2));
		return rdmString.substr(0, len);
	}

	//是否为空
	Plate.prototype.isNotNull = function (s) {
		if (s != null && s != "" && s != undefined && s != "undefined" && s != "null") {
			return true;
		} else {
			return false;
		}
	}
	Component.Plate = Plate;
})(Component);
