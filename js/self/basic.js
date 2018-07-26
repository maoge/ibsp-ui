/**
 * Created by guozh on 2018/3/1.
 */
var rootUrl="http://172.20.0.81:9991/",
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
        saveQueue : rootUrl + "mqsvr/saveQueue",
        delQueue : rootUrl + "mqsvr/delQueue",
        releaseQueue : rootUrl + "mqsvr/releaseQueue"
    },
    permnentTopicList : {
        getPermnentTopicList : rootUrl + "mqsvr/getPermnentTopicList",
        getPermnentTopicCount : rootUrl + "mqsvr/getPermnentTopicCount",
        savePermnentTopic : rootUrl + "mqsvr/savePermnentTopic",
        delPermnentTopic : rootUrl + "mqsvr/delPermnentTopic"
    }
};