/**
 * Created by guozh on 2018/4/8.
 */
var queue_id,
    $permnentTopicList = $("#permnent_topic_list");
function init(queueId, queueName, servName, servId){
    queue_id = queueId;
    $("#servName").text(servName);
    $("#queueName").text(queueName);
    $("#QUEUE_ID").val(queueId);
    $("#backQueuePage").off("click").on("click",function(){
        $mainContainer.load("queue.html",function(){
            init(servName,servId);
        });
    });
    var queueParam = {"QUEUE_ID" : queueId};
    listBinds(queueParam);

    //绑定checkbox事件
    var $checkbox =  $("#autoGenerateConsumerIdCheckbox"),
        $consumerInput = $("#CONSUMER_ID");
    $checkbox.change(function(){
        var $this = $(this),
            checked = $this.prop("checked");
        if(checked){
            $consumerInput.val(Util.getConsumerId());
            $consumerInput.prop("disabled","disabled");
        }else{
            $consumerInput.val("");
            $consumerInput.prop("disabled",false);
        }
    });
}

function searchBinds(){
    var consumerId = $("#S_CONSUMER_ID").val(),
        queueParam = {"QUEUE_ID" : queue_id, "CONSUMER_ID" : consumerId};
    
    $permnentTopicList.mTable("reload",{queryParams : queueParam});
}

function permnentBind(){
    $("#newPermnentTopic").modal("show");
    $("#subkeyRow").hide();
    var $checkbox =  $("#autoGenerateConsumerIdCheckbox"),
        $consumerInput = $("#CONSUMER_ID");
    $checkbox.prop("checked",true);
    $consumerInput.val(Util.getConsumerId());
    $consumerInput.prop("disabled","disabled");

    $(".modal-backdrop").appendTo($("#mainContent"));
}

function wildcardBind(){
    $("#newPermnentTopic").modal("show");
    $("#subkeyRow").show();
    var $checkbox =  $("#autoGenerateConsumerIdCheckbox"),
        $consumerInput = $("#CONSUMER_ID");
    $checkbox.prop("checked",true);
    $consumerInput.val(Util.getConsumerId());
    $(".modal-backdrop").appendTo($("#mainContent"));
}

function listBinds(queueParam){
    $permnentTopicList.mTable({
        url: Url.permnentTopicList.getPermnentTopicList,
        countUrl: Url.permnentTopicList.getPermnentTopicCount,
        queryParams: queueParam,
        striped : true,
        pagination : true,
        pageSize : 10,
        pageNumber : 1,
        columns : [{
            checkbox:true
        },{
            field : "CONSUMER_ID",
            title : "ConsumerID"
        },{
            field : "MAIN_TOPIC",
            title : "Topic名称"
        },{
            field : "SUB_TOPIC",
            title : "SUBKEY"
        },{
            field : "REAL_QUEUE",
            title : "实际队列名"
        },{
            title : "操作",
            isButtonColumn:true,
            buttons:[{
                text:"解绑",
                onClick:function(button,row,index){
                    unbindTopic(row);
                }
            }]
        }]
    });
}

function bindTopic(){
    var param = Util.getFormParam("newPermnentTopicForm");
    $.ajax({
        url : Url.permnentTopicList.savePermnentTopic,
        type : "post",
        data : param,
        success : function(result){
            if (result.RET_CODE == 0) {
                Util.msg("保存成功");
                $('#newPermnentTopic').modal("hide");
                $permnentTopicList.mTable("refresh");
            } else {
                Util.alert("error", "绑定失败！"+result.RET_INFO);
            }
        }
    });
}

function unbindTopic(param){
    param.QUEUE_ID = queue_id;
    $.ajax({
        url : Url.permnentTopicList.delPermnentTopic,
        type : "post",
        data : param,
        success : function(result){
            if (result.RET_CODE == 0) {
                Util.msg("解绑成功");
                $('#newPermnentTopic').modal("hide");
                $permnentTopicList.mTable("refresh");
            } else {
                Util.alert("error", "解除绑定失败！"+result.RET_INFO);
            }
        }
    });
}