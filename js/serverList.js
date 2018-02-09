function loadServerList() {
	$('#server_list').mTable({
        url: rootUrl+'resourcesvr/getServerList',
        countUrl: rootUrl+'resourcesvr/getServerCount',
        queryParams: serverListParams,
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
            }
        }, {
            field : "SERVER_IP",
            title : "服务器IP",
        }, {
            field : "SERVER_NAME",
            title : "服务器名",
        }, {
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"SSH管理",
                onClick:function(button,row,index){
        			$(".content").load("sshList.html",function(){
        				loadSSHList(row.SERVER_IP, row.SERVER_NAME);
        			})
                }
            }]
        }]
    });
}

function addServer() {
	$('#newServer').modal("show");
}

function delServer() {
	var servers = $('#server_list').mTable("getSelections");
	if (servers.length<1) {
		Component.Alert("warn", "请选择服务器资源");
		return;
	}
	
	var services = $('#server_list').mTable("getSelections");
	var ip = [];
	services.forEach(function(child, index) {
		ip.push(child.SERVER_IP);
	});
	var data = {};
	data.SERVER_IP = JSON.stringify(ip);
	
	layer.confirm("确认删除选择的服务器吗？", {
		btn: ['是','否'],
		title: "确认"
	}, function(){
		layer.close(layer.index);

		var loading = $('#loadingDiv');
		
		$.ajax({
			url: rootUrl+"resourcesvr/deleteServer",
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
				Component.Alert("error", "删除服务器失败！"+xhr.status+":"+xhr.statusText);
			},
			success: function(result) {
				if (result.RET_CODE == 0) {
					layer.msg("删除成功");
					$('#server_list').mTable("refresh");
				} else {
					Component.Alert("error", "删除服务器失败！"+result.RET_INFO);
				}
			}
		});
	});
}

function saveServer() {
	var data = {};
	var loading = $('#loadingDiv');
	data.SERVER_IP = $('#SERVER_IP').val();

	$.ajax({
		url: rootUrl+"resourcesvr/addServer",
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
			Component.Alert("error", "新增服务器失败！"+xhr.status+":"+xhr.statusText);
		},
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newServer').modal("hide");
				$('#server_list').mTable("refresh");
			} else {
				Component.Alert("error", "新增服务器失败！"+result.RET_INFO);
			}
		}
	});
}

function searchServer() {
	serverListParams.SERVER_IP = $('#S_SERVER_IP').val();
	serverListParams.SERVER_NAME = $('#S_SERVER_NAME').val();
	$('#server_list').mTable("reload", {
		queryParams: serverListParams
	});
}
