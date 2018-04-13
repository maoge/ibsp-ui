function loadSSHList(ip, name) {
	$('#server_ip').text(ip);
	$('#server_name').text(name);
	
	$('#ssh_list').mTable({
        url: rootUrl+'resourcesvr/getSSHListByIP',
        countUrl: rootUrl+'resourcesvr/getSSHCountByIP',
        queryParams: {SERVER_IP: ip},
        striped : true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
        columns : [{
            checkbox:true
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
                    Util.clearForm("newSSHForm");
                	Util.setFormData("newSSHForm",row);
                    $('#OLD_PWD').val(row.SSH_PWD);
                    $('#SSH_NAME').prop("disabled", "disabled");
                	$('#newSSH').modal("show");
					$(".modal-backdrop").appendTo($("#mainContent"));
                }
            }]
        }]
    });
}

function addSSH() {
	$('#newSSHHeader').text("新增SSH用户("+$('#server_ip').text()+")");
	Util.clearForm("newSSHForm");
    $('#SSH_NAME').prop("disabled", false);
	$('#newSSH').modal("show");
	$(".modal-backdrop").appendTo($("#mainContent"));
}

function saveSSH() {
	var loading = $('#loadingDiv');
	var type = "";
	$('input[name="SERV_TYPE"]:checked').each( function() {  
	      type += ","+$(this).val();
	});
	
	var data = Util.getFormParam("newSSHForm");
	data.SERVER_IP   = $('#server_ip').text();
	data.SERVER_NAME = $('#server_name').text();
	data.TYPE        = $('#SSH_NAME').attr("disabled") ? "modify" : "add";

	$.ajax({
		url: rootUrl+"resourcesvr/addOrModifySSH",
		data: data,
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newSSH').modal("hide");
				$('#ssh_list').mTable("refresh");
			} else {
				Util.alert("error", "新增SSH用户失败！"+result.RET_INFO);
			}
		}
	});
}

function delSSH() {
	var sshs = $('#ssh_list').mTable("getSelections");
	if (sshs.length<1) {
        Util.alert("warn", "请选择SSH用户");
		return;
	}
	var users = [];
	sshs.forEach(function(child, index) {
		users.push(child.SSH_NAME);
	});
	
	var data = {};
	data.SSH_NAME = JSON.stringify(users);
	data.SERVER_IP = $('#server_ip').text();
	
	layer.confirm("确认删除选择的SSH用户吗？", {
		btn: ['是','否'],
		title: "确认"
	}, function(){
		layer.close(layer.index);
		var loading = $('#loadingDiv');
		
		$.ajax({
			url: rootUrl+"resourcesvr/deleteSSH",
			data: data,
			success: function(result) {
				if (result.RET_CODE == 0) {
					layer.msg("删除成功");
					$('#ssh_list').mTable("refresh");
				} else {
					Util.alert("error", "删除SSH用户失败！"+result.RET_INFO);
				}
			}
		});
	});
}
