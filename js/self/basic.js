/**
 * Created by guozh on 2018/3/1.
 */
var rootUrl="http://127.0.0.1:9991/",
    $mainContainer = $("#mainContent");
var Url = window.Url = {
    serverList:{
        loadServiceList : rootUrl + "configsvr/getServiceList",
        loadServiceListCount : rootUrl + "configsvr/getServiceCount",
        saveService:rootUrl + "deploy/addOrModifyService",
        delService: rootUrl + "deploy/deleteService"
    },
    queueList:{
        getQueueList : rootUrl + "mqsvr/getQueueList",
        getQueueListCount : rootUrl + "mqsvr/getQueueListCount",
        saveQueue : rootUrl + "mqsvr/saveQueue"
    }
};