var servId = "",
    queueParam = {},
    $queueList = $("#queue_list");
function init(name,id){
    queueParam.SERV_ID = id;
    servId = id;
    listQueue();
}

function listQueue(){
    debugger;
    $queueList.mTable({
        url: Url.queueList.getQueueList,
        countUrl: Url.queueList.getQueueListCount,
        queryParams: queueParam,
        striped : true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
        columns : [{
            checkbox:true,
            format:function(value,row,index){//value是值，row是当前的行记录，index是行数 从0开始
                if(row.IS_DEPLOY === '1'){
                    return {
                        disabled:true,
                    }
                }
            }
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
    $.ajax({
        url : Url.queueList.saveQueue,
        data : param,
        success : function(result){
            if (result.RET_CODE == 0) {
                $('#newQueue').modal("hide");
                $queueList.mTable("refresh");
            } else {
                Util.alert("error", "保存队列失败！"+result.RET_INFO);
            }
        }
    });
}

function delQueue(){

}