/**
 * Created by guozh on 2018/8/6.
 */

(function ($, window) {

    var AlarmsList = function (options) {
        this.options = options;
        this.init();
    };

    AlarmsList.prototype.init = function() {
        var tableEle = this.options.TABLE_ELE,
            that     = this;
        this.mTable  = tableEle.mTable({
            url: Url.alarmsList.getAlarmsList,
            countUrl: Url.alarmsList.getAlarmsListCounts,
            striped : true,
            pagination : true,
            pageSize : 10,
            pageNumber : 1,
            columns : [{
                field : "SERVICE_ID",
                title : "服务ID",
            },{
                field : "SERV_NAME",
                title : "服务名称",
            },{
                field : "INSTANCE_ID",
                title : "实例ID",
            }, {
                field : "ALARM_DESC",
                title : "告警信息",
            }, {
                title : "操作",
                isButtonColumn:true,
                buttons:[/*{
                    text:"检测",
                    //配置隐藏属性
                    format:function(value,row){
                        if(row.SERV_TYPE == 'DB' || row.IS_DEPLOYED!=1){
                            return { hided:true };
                        }
                    },
                    onClick:function(button,row){
                        if(row.SERV_TYPE == 'MQ') {
                            $mainContainer.load("mqMonitor.html",function(){
                                /!*init(row.SERV_NAME, row.INST_ID);*!/
                                init(row.INST_ID);
                            });
                        }
                        if(row.SERV_TYPE == 'CACHE') {
                            $mainContainer.load("cacheMonitor.html",function(){
                                /!*init(row.SERV_NAME, row.INST_ID);*!/
                                init(row.INST_ID);
                            });
                        }
                    }
                },*/{
                    text:"清除",
                    //配置隐藏属性
                    onClick:function(button,row,index){
                        that.clearAlarm(row);
                    }
                }]
            }]
        });
    }

    AlarmsList.prototype.clearAlarm = function (row) {
        var servId    = row.SERVICE_ID,
            instId    = row.INSTANCE_ID,
            alarmCode = row.ALARM_CODE,
            that      = this,
            req       = {
                data : {"SERV_ID" : servId, "INST_ID" : instId, "ALARM_CODE" : alarmCode},
                url: Url.alarmsList.clearAlarm,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        that.options.TABLE_ELE.mTable("refresh");
                    }else{
                        Util.alert("error", "删除失败");
                    }
                }
            };

        $.ajax(req);
    }

    window.AlarmsList = AlarmsList;

}(jQuery, window));