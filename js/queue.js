var servId = "",
    servName = "";
    $queueList = $("#queue_list");
function init(name,id){
    console.log(name);
    var queueParam = {"SERV_ID" : id};
    servId = id;
    servName = name;
    $('#SERV_ID').val(servId);
    $("#servName").text(name);
    listQueue(queueParam);
}

function searchQueues(){
    var queueName = $("#S_QUEUE_NAME").val(),
        queueType = $("#S_QUEUE_TYPE").val();
    var queueParam = {
        "SERV_ID" : servId,
        "QUEUE_NAME" : queueName,
        "QUEUE_TYPE" : queueType
    };
    $queueList.mTable("reload", {
        queryParams: queueParam
    });
}

function listQueue(queueParam){
    $queueList.mTable({
        url: Url.queueList.getQueueList,
        countUrl: Url.queueList.getQueueListCount,
        queryParams: queueParam,
        striped : true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
        columns : [{
            checkbox:true/*,
            format:function(value,row,index){//value是值，row是当前的行记录，index是行数 从0开始
                if(row.IS_DEPLOY === '1'){
                    return {
                        disabled:true,
                    }
                }
            }*/
        },{
            field : "QUEUE_ID",
            title : "队列ID"
        },{
            field : "QUEUE_NAME",
            title : "队列名称"
        }, {
            field : "QUEUE_TYPE",
            title : "队列类型",
            format:function(value,row,index){
                return value=='1' ? '队列' : '广播';
            }
        }, {
            field : "IS_DURABLE",
            title : "是否持久化",
            format:function(value,row,index){
                return value=='1' ? '是' : '否';
            }
        } ,{
            field : "IS_ORDERED",
            title : "是否全局有序",
            format:function(value,row,index){
                return value=='1' ? '是' : '否';
            }
        } ,{
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"修改",
                format:function(value,row,index){
                    if(row.IS_DEPLOY == '1'){
                        return { hided:true };
                    }
                },
                onClick:function(button,row,index){
                    debugger;
                    Util.setFormData("newQueueForm",row);
                    $('#newQueueHeader').text("修改队列");
                    $('#newQueue').modal("show");
                    $(".modal-backdrop").appendTo($("#mainContent"));
                }
            },{
                text:"发布",
                format:function(value,row,index){
                    if(row.IS_DEPLOY == '1'){
                        return { hided:true };
                    }
                },
                onClick:function(button,row,index){
                    releaseQueue(row);
                }
            },{
                text:"已创建",
                format:function(value,row,index){
                    if(row.IS_DEPLOY == '0'){
                        return { hided:true};
                    }else{
                        return {disabled:true,style:'btn-onlymsg'};
                    }
                },
            },{
                text:"绑定广播",
                format:function(value,row,index){
                    if(row.QUEUE_TYPE == '1' ||  row.IS_DEPLOY == "0"){
                        return { hided:true};
                    }
                },
                onClick:function(button,row,index){
                    $mainContainer.load("bindTopic.html",function(){
                        debugger;
                        init(row.QUEUE_ID, row.QUEUE_NAME, servName ,servId);
                    })
                }
            }]
        }]
    });
}

function addQueue() {
    $('#newQueueHeader').text("新增队列");
    Util.clearForm("newQueueForm");
    $('#SERV_ID').val(servId);
    $('#newQueue').modal("show");
    //bootstrap4 在jquery load html的时候出现modal的出现bug
    $(".modal-backdrop").appendTo($("#mainContent"));
}

function saveQueue(){
    var param = Util.getFormParam("newQueueForm");
    console.log(param);
    $.ajax({
        url : Url.queueList.saveQueue,
        data : param,
        success : function(result){
            if (result.RET_CODE == 0) {
                Util.msg("保存成功");
                $('#newQueue').modal("hide");
                $queueList.mTable("refresh");
            } else {
                Util.alert("error", "保存队列失败！"+result.RET_INFO);
            }
        }
    });
}

function delQueue(){
    var queues = $queueList.mTable("getSelections");
    if (queues.length<1) {
        Util.alert("warn", "请选择队列");
        return;
    } else if (queues.length>1) {
        Util.alert("warn", "一次只能删除一个队列");
        return;
    }
    Util.confirm("确认删除队列吗？", {
        btn: ['是','否'],
        title: "确认"
    }, function(){
        var data = {"QUEUE_ID" : queues[0].QUEUE_ID,"SERV_ID" : servId};
        $.ajax({
            url: Url.queueList.delQueue,
            data: data,
            async: false,
            success: function(result) {
                if (result.RET_CODE == 0) {
                    Util.msg("删除成功");
                    $queueList.mTable("refresh");
                } else {
                    Util.alert("error", "删除队列失败！"+result.RET_INFO);
                }
            }
        });
    });
}

function releaseQueue(param){
    param.SERV_ID = servId;
    $.ajax({
        url: Url.queueList.releaseQueue,
        data: param,
        async: false,
        success: function(result) {
            if (result.RET_CODE == 0) {
                Util.msg("发布成功");
                $queueList.mTable("refresh");
            } else {
                Util.alert("error", "发布队列失败！"+result.RET_INFO);
            }
        }
    });
}

function bindTopic(row){
    console.log(row);
}