function loadSSHList(IP) {
	$('#server_ip').text(IP);
	$('#server_name').text(name);
	
	$('#ssh_list').mTable({
        url: rootUrl+'resourcesvr/getSSHListByIP',
        countUrl: rootUrl+'resourcesvr/getSSHCountByIP',
        queryParams: {SERVER_IP: IP},
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
            field : "SSH_NAME",
            title : "用户名",
        }, {
            field : "SERV_TYPE",
            title : "服务类型",
        }, {
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"修改",
                onClick:function(button,row,index){
                	$('#newSSHHeader').text("修改SSH用户("+$('#server_ip').text()+")");
                	$('#SSH_NAME').val(row.SSH_NAME);
                	$('#SSH_NAME').attr("disabled", true);
                	$('#SSH_PWD').val(row.SSH_PWD);
                	$('#OLD_PWD').val(row.SSH_PWD);
                	if (row.SERV_TYPE.indexOf("DB")!=-1) {
                		$('input[name="SERV_TYPE"][value="DB"]').attr("checked", true);
                	} else {
                		$('input[name="SERV_TYPE"][value="DB"]').attr("checked", false);
                	}
                	if (row.SERV_TYPE.indexOf("MQ")!=-1) {
                		$('input[name="SERV_TYPE"][value="MQ"]').attr("checked", true);
                	} else {
                		$('input[name="SERV_TYPE"][value="MQ"]').attr("checked", false);
                	}
                	if (row.SERV_TYPE.indexOf("CACHE")!=-1) {
                		$('input[name="SERV_TYPE"][value="CACHE"]').attr("checked", true);
                	} else {
                		$('input[name="SERV_TYPE"][value="CACHE"]').attr("checked", false);
                	}
                	$('#newSSH').modal("show");
                }
            }]
        }]
    });
}

function addSSH() {
	$('#newSSHHeader').text("新增SSH用户("+$('#server_ip').text()+")");
	$('#SSH_NAME').val("");
	$('#SSH_NAME').attr("disabled", false);
	$('#SSH_PWD').val("");
	$('#OLD_PWD').val("");
	$('input[name="SERV_TYPE"]').attr("checked", false);
	$('#newSSH').modal("show");
}

function saveSSH() {
	var loading = $('#loadingDiv');
	var type = "";
	$('input[name="SERV_TYPE"]:checked').each( function() {  
	      type += ","+$(this).val();
	});
	
	var data = {};
	data.SSH_NAME    = $('#SSH_NAME').val();
	data.SSH_PWD     = $('#SSH_PWD').val();
	data.OLD_PWD     = $('#OLD_PWD').val();
	data.SERV_TYPE   = type.substring(1, type.length);
	data.SERVER_IP   = $('#server_ip').text();
	data.SERVER_NAME = $('#server_name').text();
	data.TYPE        = $('#SSH_NAME').attr("disabled") ? "modify" : "add";

	$.ajax({
		url: rootUrl+"resourcesvr/addOrModifySSH",
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
			Component.Alert("error", "新增SSH用户失败！"+xhr.status+":"+xhr.statusText);
		},
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newSSH').modal("hide");
				$('#ssh_list').mTable("refresh");
			} else {
				Component.Alert("error", "新增SSH用户失败！"+result.RET_INFO);
			}
		}
	});
}

function delSSH() {
	var sshs = $('#ssh_list').mTable("getSelections");
	if (sshs.length<1) {
		Component.Alert("warn", "请选择SSH用户");
		return;
	}
	var users = [];
	sshs.forEach(function(child, index) {
		users.push(child.SSH_NAME);
	});
	
	var data = {};
	data.SSH_NAME = JSON.stringify(users);
	data.SERVER_IP   = $('#server_ip').text();
	
	layer.confirm("确认删除选择的SSH用户吗？", {
		btn: ['是','否'],
		title: "确认"
	}, function(){
		layer.close(layer.index);
		var loading = $('#loadingDiv');
		
		$.ajax({
			url: rootUrl+"resourcesvr/deleteSSH",
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
				Component.Alert("error", "删除SSH用户失败！"+xhr.status+":"+xhr.statusText);
			},
			success: function(result) {
				if (result.RET_CODE == 0) {
					layer.msg("删除成功");
					$('#ssh_list').mTable("refresh");
				} else {
					Component.Alert("error", "删除SSH用户失败！"+result.RET_INFO);
				}
			}
		});
	});
}
