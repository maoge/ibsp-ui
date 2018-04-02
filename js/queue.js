function addQueue() {
    debugger;
    $('#newQueueHeader').text("新增队列");
    $('#QUEUE_ID').val("");
    $('#QUEUE_NAME').val("");
    $("#QUEUE_TYPE").find("option:contains('队列')").prop("selected",true);
    $("[name='IS_DURABLE']:eq(1)").prop("checked",true);
    $("[name='GLOBAL_ORDERED']:eq(1)").prop("checked",true);
    $('#newQueue').modal("show");
    //bootstrap4 在jquery load html的时候出现modal的出现bug
    $(".modal-backdrop").appendTo($("#mainContent"));
}

function saveQueue(){

}

function delQueue(){

}