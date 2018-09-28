var Component = window.Component || {};


(function(Component) {
	
	/**
	 * MQ面板类
	 */
	function SequoiaDBPlate(url, id, name, canvas) {
		//调用父类方法初始化舞台
		this.url = rootUrl;
		this.initStage(id, name, canvas);
		this.SwitchContainer = null;
		this.VBrokerContainer = null;
		this.PlateType = "SequoiaDB";

		//图标(暂定)
		this.imgRootUrl = "../images/console/";
		this.pgIcon = this.imgRootUrl + "db_pg.png";

		var data = this.getTopoData(id),
			self = this;

		if (data == null) {
			Util.hideLoading();
			return;
		} else if (data == "init") {
			data = null;
		}

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

		this.deployedElementMenu = $.contextMenu({
			items:[
				{label:'卸载(缩容)', icon:'../images/console/icon_delete.png', callback: function(e){
					self.undeployElement(e.target);
				}},
                {label:'强制卸载', icon:'../images/console/icon_delete.png', callback: function(e){
                    self.forceUndeployElement(e.target);
                }}
				]
		});

		this.PG_CONST = "SDB_PG";

		//初始化弹出表单
		var cancelFunction = function(){
			if (self.popElement.status=="new") self.deleteComponent(self.popElement);
			self.popElement = null;
		};

		this.PGForm = $.popupForm(this.PG_CONST, window["sequoiadb.schema"], function(json){
			self.saveElementData(self.popElement, json, self.PGForm);
		}, cancelFunction);

		this.getIpUser("DB", [this.PGForm]);
		this.initContainer(data);
	}
    SequoiaDBPlate.prototype = new Component.Plate();
    SequoiaDBPlate.prototype.constructor = SequoiaDBPlate;
    SequoiaDBPlate.superclass = Component.Plate.prototype;
	Component.SequoiaDBPlate = SequoiaDBPlate;

	/**
	 * 初始化container
	 */
    SequoiaDBPlate.prototype.initContainer = function(data) {
		if (data!=null) {

			var deployFlag = data.DEPLOY_FLAG;
			data = data.SDB_SERV_CONTAINER;
			this.needInitTopo = false;
			var	PG_CONTAINER = data.SDB_PG_CONTAINER;

            //加载SwitchContaniner
            if(PG_CONTAINER && !$.isEmptyObject(PG_CONTAINER)){
                this.PGContainer = this.makeContainer(PG_CONTAINER.POS.x,PG_CONTAINER.POS.y,
                    PG_CONTAINER.PG_CONTAINER_NAME,PG_CONTAINER.POS.row,PG_CONTAINER.POS.col,"node");

                this.PGContainer._id = PG_CONTAINER.PG_CONTAINER_ID;

                for (var index in PG_CONTAINER.SDB_PG) {
                    var pg = PG_CONTAINER.SDB_PG[index];
                    var node = this.addNodeToContainer(this.PGContainer.x+1, this.PGContainer.y+1,
                        this.pgIcon, pg.PG_NAME, this.PG_CONST, this.nodeMenu, this.PGContainer, true, false);

                    this.setMetaData(node, pg);
                }
            }

            this.getDeployFlag(deployFlag);

		} else {

			this.needInitTopo = true;
			this.PGContainer = this.makeContainer(
					this.width*0.5-this.defaultContainerW*2-this.padding, this.height*0.5, "PG容器", 1, 3, "node");
		}
	}

	//提取组件元数据
    SequoiaDBPlate.prototype.getMetaData = function(element) {
		var data = {};
		switch(element.type) {
			case this.PG_CONST :
				data.PG_ID = element._id;
				data.PG_NAME = element.text;
				break;
            default :
				break;
		}
		for (var i in element.meta) {
			data[i] = element.meta[i];
		}
		return data;
	};

	//Tidb面板设置组件元数据
    SequoiaDBPlate.prototype.setMetaData = function(element, data) {
        console.log("data : " + data);
		var that = this,
            id = "",
            name = "";

		switch(element.type) {
			case this.PG_CONST:
				id = data.PG_ID;
				name = data.PG_NAME;
				delete data.PG_ID;
				delete data.PG_NAME;

                element.addEventListener('mouseover', function(e) {
                    that.showMetadata(e.target, e);
                });
                element.addEventListener('mouseout', function(e) {
                    that.hideMetadata(e.target);
                });

				break;
            default :
				break;
		}
		element._id = id;
		element.text = name;
		element.meta = data; //metadata
	}

	//弹出 根据schema生成的输入框
    SequoiaDBPlate.prototype.popupForm = function(element) {
		this.popElement = element; //存放目前正在填写信息的元素，表单窗口关闭时置为null
		switch(element.type) {
			case this.PG_CONST:
				this.PGForm.show(this.getMetaData(element));
				break;
            default :
                break;
		}
	}
	
	/**
	 * MQ面板新增组件
	 */
    SequoiaDBPlate.prototype.newComponent = function(x, y, datatype) {
		switch(datatype) {

		case this.PG_CONST:
			var success = false,
				img = this.pgIcon;

			if (this.addNodeToContainer(x, y, img, datatype, this.PG_CONST, this.nodeMenu, this.PGContainer ,false, false) != null) {
				break;
			}

			if (!success) {
				Component.Alert("warn", "请将组件拖放到对应的容器中！");
			}
			return success;

		default: 
			return false;
		}
	};

	//保存面板拓扑信息(位置信息等)
    SequoiaDBPlate.prototype.toPlateJson = function(needCollectd) {
		return {"SDB_SERV_CONTAINER": {
                SDB_SVC_CONTAINER_ID : this.id,
                SDB_SVC_CONTAINER_NAME : this.name,
                SDB_PG_CONTAINER : {
                    PG_CONTAINER_ID : this.PGContainer._id,
                    PG_CONTAINER_NAME : this.PGContainer.text,
                    POS : this.PGContainer.getPosJson()
                },
            }};
	}

	//组件部署成功时的处理
    SequoiaDBPlate.prototype.getElementDeployed = function(element) {
		var type = element.type,
            self = this;
		switch (type){
			case this.PG_CONST :
				element.status = "deployed";
				element.removeEventListener('contextmenu');
                element.addEventListener('contextmenu', function(e) {
                    self.deployedElementMenu.show(e);
                });
				break;
            default :
				break;
		}

	};

    SequoiaDBPlate.prototype.getElementUndeployed = function (element) {
        var type = element.type,
            self = this;
        switch (type){

            case this.PG_CONST :
                element.status = "saved";
                element.removeEventListener('contextmenu');
                element.addEventListener('contextmenu', function(e) {
                    self.nodeMenu.show(e);
                });
                break;
            default :
                break;
        }
    }

    SequoiaDBPlate.prototype.undeployElement = function(element){
        if(element.parentContainer.childs.length <= 1 ){
            Component.Alert("error", "已经是最后一个组件！");
        } else {
            Component.Plate.prototype.undeployElement.call(this, element);
        }
    };

    SequoiaDBPlate.prototype.forceUndeployElement = function(element){
        var self = this;
        var url = this.url + this.forceUndeployServ;

        var len = 0, eles = element.parentContainer.childs;
        for(var ele in eles) {
        	if(eles[ele].status == "deployed"){
        		len++;
			}
		}

        if(len <= 1){
            Component.Alert("error", "已经是最后一个组件！请先扩容！");
            return;
        }


        Util.confirm("确认强制卸载这个vbroker吗？", {
            btn: ['是','否'],
            title: "确认"
        }, function(){
            $.ajax({
                url: url,
                data: {"INST_ID": element._id, "SERV_ID": self.id},
                success: function (result) {
                    if (result.RET_CODE == 0) {
                        Component.Alert("success", "组件卸载成功！");
                        self.getElementUndeployed(element);
                    } else {
                        Component.Alert("error", "组件卸载失败！" + result.RET_INFO);
                    }
                }
            });
        });
    };

})(Component);
