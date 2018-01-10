function loadServiceList() {
	$('#tidb_list').mTable({
        url: rootUrl+'configsvr/getServiceList',
        countUrl: rootUrl+'configsvr/getServiceCount',
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
        }, {
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
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"管理",
                onClick:function(button,row,index){
        			$(".content").load("serviceManage.html",function(){
        				init(row.INST_ID, row.SERV_NAME, row.SERV_TYPE);
        			})
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
            		$(".content").load("sqlExplain.html",function(){
            			init(row.SERV_NAME, row.INST_ID);
            		})
            	}
            }]
        }]
    });
}

function addService() {
	$('#newService').modal("show");
}

function saveService() {
	var data = {};
	var loading = $('#loadingDiv');
	data.SERVICE_NAME = $('#SERVICE_NAME').val();
	data.SERVICE_TYPE = $('#SERVICE_TYPE').val();
	
	$.ajax({
		url: rootUrl+"configsvr/addService",
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
			Component.Alert("error", "新增服务集群失败！"+xhr.status+":"+xhr.statusText);
		},
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newService').modal("hide");
				$('#tidb_list').mTable("refresh");
			} else {
				Component.Alert("error", "新增服务集群失败！"+result.RET_INFO);
			}
		}
	});
}

function searchService() {
	serviceListParams.SERVICE_NAME = $('#S_SERVICE_NAME').val();
	serviceListParams.SERVICE_TYPE = $('#S_SERVICE_TYPE').val();
	$('#tidb_list').mTable("reload", {
		queryParams: serviceListParams
	});
}
