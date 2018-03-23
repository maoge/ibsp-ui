var serviceListParams = {};
function initPage(){
	loadServiceList();
}
var $serverList = $("#service_list");
function loadServiceList() {
	$serverList.mTable({
        url: Url.serverList.loadServiceList,
        countUrl: Url.serverList.loadServiceListCount,
        queryParams: serviceListParams,
        method : 'post',
        showHeader: true,
        striped : true,
        showToggle: true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
        showColumns : true,
        showPaginationSwitch: true,
        showRefresh : true,
        paginationHAlign:'right',
        paginationVAlign:'both',

        clickToSelect : true,
        columns : [{
            checkbox:true,
            format:function(value,row,index){//value是值，row是当前的行记录，index是行数 从0开始
                if(row.IS_DEPLOYED === '1'){
                    return {
                        disabled:true,
                    }
                }
            }
        },{
			field : "INST_ID",
			title : "服务ID",
		},{
            field : "SERV_NAME",
            title : "服务名",
        }, {
            field : "SERV_TYPE",
            title : "服务类型",
        }, {
            field : "IS_DEPLOYED",
            title : "部署情况",
            format:function(value,row,index){
            	return value=='1' ? '已部署' : '未部署';
            }
        } ,{
            field : "IS_PRODUCT",
            title : "是否生产环境",
            format:function(value,row,index){
            	return value=='1' ? '是' : '否';
            }
        } ,{
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"修改",
                onClick:function(button,row,index){
                	$('#newServiceHeader').text("修改服务集群");
                	$('#SERVICE_TYPE').attr("disabled", true);
                	$('#SERVICE_TYPE').val(row.SERV_TYPE);
                	$('#IS_PRODUCT').val(row.IS_PRODUCT);
                	$('#SERVICE_ID').val(row.INST_ID);
                	$('#SERVICE_NAME').val(row.SERV_NAME);
                	$('#newService').modal("show");
					$(".modal-backdrop").appendTo($("#mainContent"));
                }
            },{
                text:"管理",
                onClick:function(button,row,index){
					$mainContainer.load("serviceManage.html",function(){
        				init(row.INST_ID, row.SERV_NAME, row.SERV_TYPE);
        			});
                }
            },{
                text:"执行计划",
                //配置隐藏属性
                format:function(value,row,index){
                    if(row.SERV_TYPE != 'DB' || row.IS_DEPLOYED!=1){
                        return { hided:true };
                    }
                },
            	onClick:function(button,row,index){
					$mainContainer.load("sqlExplain.html",function(){
            			init(row.SERV_NAME, row.INST_ID);
            		})
            	}
            },{
				text:"元数据",
				//配置隐藏属性
				format:function(value,row,index){
					if(row.SERV_TYPE != 'DB' || row.IS_DEPLOYED!=1){
						return { hided:true };
					}
				},
				onClick:function(button,row,index){
					$mainContainer.load("metadata.html",function(){
						searchByRemote(row.INST_ID);
					})
				}
			}]
        }]
    });
}

function addService() {
	$('#newServiceHeader').text("新增服务集群");
	$('#SERVICE_TYPE').attr("disabled", false);
	$('#SERVICE_ID').val("");
	$('#SERVICE_NAME').val("");
	$('#IS_PRODUCT').val(0);
	$('#newService').modal("show");
	//bootstrap4 在jquery load html的时候出现modal的出现bug
	$(".modal-backdrop").appendTo($("#mainContent"));
}

function delService() {
	var services = $serverList.mTable("getSelections");
	if (services.length<1) {
		Util.alert("warn", "请选择服务");
		return;
	} else if (services.length>1) {
		Util.alert("warn", "一次只能删除一个服务");
		return;
	}

	Util.confirm("确认删除服务吗？", {
		btn: ['是','否'],
		title: "确认"
	}, function(){
		var services = $serverList.mTable("getSelections");
		var data = {};
		data.SERV_ID = services[0].INST_ID;
		var loading = $('#loadingDiv');
		
		$.ajax({
			url: Url.serverList.delService,
			data: data,
			async: true,
			type: "post",
			dataType: "json",
			beforeSend: function() {
				loading.show();
			},
			complete: function() {
				loading.hide();
			},
			error: function(xhr) {
				Util.alert("error", "删除服务集群失败！"+xhr.status+":"+xhr.statusText);
			},
			success: function(result) {
				if (result.RET_CODE == 0) {
					Util.msg("删除成功");
					$serverList.mTable("refresh");
				} else {
					Util.alert("error", "删除服务集群失败！"+result.RET_INFO);
				}
			}
		});
	});
}

function saveService() {
	var data = {};
	var loading = $('#loadingDiv');
	data.SERVICE_ID   = $('#SERVICE_ID').val();
	data.SERVICE_NAME = $('#SERVICE_NAME').val();
	data.SERVICE_TYPE = $('#SERVICE_TYPE').val();
	data.IS_PRODUCT   = $('#IS_PRODUCT').val();

	$.ajax({
		url:  Url.serverList.saveService,
		data: data,
		async: true,
		type: "post",
		dataType: "json",
		beforeSend: function() {
			loading.show();
		},
		complete: function() {
			loading.hide();
		},
		error: function(xhr) {
			Util.alert("error", "新增服务集群失败！"+xhr.status+":"+xhr.statusText);
		},
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newService').modal("hide");
				$serverList.mTable("refresh");
			} else {
				Util.alert("error", "新增服务集群失败！"+result.RET_INFO);
			}
		}
	});
}

function searchService() {
	serviceListParams.SERVICE_NAME = $('#S_SERVICE_NAME').val();
	serviceListParams.SERVICE_TYPE = $('#S_SERVICE_TYPE').val();
	$serverList.mTable("reload", {
		queryParams: serviceListParams
	});
}
