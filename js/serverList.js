var serverListParams = {};
function initPage(){
	loadServerList();
}
function loadServerList() {
	$('#server_list').mTable({
        url: rootUrl+'resourcesvr/getServerList',
        countUrl: rootUrl+'resourcesvr/getServerCount',
        queryParams: serverListParams,
        striped : true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
		columns : [{
            checkbox:true
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
        			$mainContainer.load("sshList.html",function(){
        				loadSSHList(row.SERVER_IP, row.SERVER_NAME);
        			})
                }
            }]
        }]
    });
}

function addServer() {
	$('#newServer').modal("show");
	$(".modal-backdrop").appendTo($("#mainContent"));
}

function delServer() {
	var servers = $('#server_list').mTable("getSelections");
	if (servers.length<1) {
		Util.alert("warn", "请选择服务器资源");
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
		$.ajax({
			url: rootUrl+"resourcesvr/deleteServer",
			data: data,
			success: function(result) {
				if (result.RET_CODE == 0) {
					layer.msg("删除成功");
					$('#server_list').mTable("refresh");
				} else {
					Util.alert("error", "删除服务器失败！"+result.RET_INFO);
				}
			}
		});
	});
}

function saveServer() {
	var data = {};
	data.SERVER_IP = $('#SERVER_IP').val();

	$.ajax({
		url: rootUrl+"resourcesvr/addServer",
		data: data,
		success: function(result) {
			if (result.RET_CODE == 0) {
				$('#newServer').modal("hide");
				$('#server_list').mTable("refresh");
			} else {
				Util.alert("error", "新增服务器失败！"+result.RET_INFO);
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
