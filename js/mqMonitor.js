/**
 * Created by guozh on 2018/7/24.
 */

(function ($,echarts,window) {

    var MqMonitor = function (options) {
        this.options = options;
        this.options.theme = "dark";
        this.firstVbInit = true;
        this.firstQueueInit = true;
        this.vbLastStartTs = this.options.END_TS;
        this.qLastStartTs = this.options.END_TS;
        this.init();
    };

    function interval(func, wait){
        var obj = {
            flag: false,
            stop: function () {
                this.flag = true;
            },
            func : func,
            wait : wait,
            interv: function () {
                if(!this.flag) {
                    this.func.call(null);
                    setTimeout(this.interv, this.wait);
                }
            }
        }
        obj.interv(interv);
        setTimeout(interv, wait);
        return obj;
    }

    MqMonitor.ECHART_DEFALT_OPTIONS = {
        title : {
            left : 'center'
        },
        backgroundColor: '#eee',
        legend: {
            bottom: 10,
            left: 'center',
        },
        tooltip: {//全局提示框组件
            trigger: 'axis',//坐标轴触发
            axisPointer: {
                type: 'cross'
            },
            backgroundColor: 'rgba(245, 245, 245, 0.8)',
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            textStyle: {
                color: '#000'
            },
            position: function (pos, params, dom, rect, size) {
                // 鼠标在左侧时 tooltip 显示到右侧，鼠标在右侧时 tooltip 显示到左侧。
                var obj = {top: '10%'};
                obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
                return obj;
            },
            //浮层的额外css样式
            extraCssText: 'width: 150px; box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);'
        },
        axisPointer: {
            link: {xAxisIndex: 'all'},
            label: {
                backgroundColor: '#777'
            }
        },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: false
                },
                magicType : { type: ['line', 'bar']},
                saveAsImage : {}
            },
            right : 20
        },
        dataZoom: [
            {
                //内置缩放
                type: 'inside',
                xAxisIndex: [0],
                start: 80,
                end: 100
            },
            {
                //缩放条
                show: true,
                xAxisIndex: [0],
                type: 'slider',
                top: '85%',
                start: 0,
                end: 100
            }
        ],
        grid:[{
            x : '5%',
            y : '20%',
            width : '90%',
            height: '50%'
        }],
        yAxis:{
            scale: true//不显示从0开始
        },
        xAxis: {
            type: 'time',
            scale: true,
            splitLine: {show: false},
            splitNumber : 15,
            minInterval : 10,
            rotate: 45,
            tickMax: true,
            min: 'dataMin',
            max: 'dataMax',
            axisLabel:{
                "tooltip":{
                    "show":true
                }
            },
            silent:false,
            triggerEvent:true,
            selectEvent:true
        },
        series: []
    }

    MqMonitor.prototype.init = function () {
        var that = this,
            vbroker = "vbroker",
            queue   = "queue";
        this.clear();
        //获取当前数据，并且注册回调处理第一个vbroker和queue的历史数据展示
        this.getCurrentCollectData(
            function (instId, firstName) {
                that.getHisData(instId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, instId, type);
                }, vbroker);
                this.firstVbInit = false;
            },
            function (queueId, firstName) {
                that.getHisData(queueId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, queueId, type);
                }, queue);
                this.firstQueueInit = false;
            }
        );
        //定时更新当前数据
        this.currentInterval = setInterval(function () {
            that.getCurrentCollectData();
        }, 10000);
    }

    MqMonitor.prototype.reInitVbroker = function(vbrokerId, vbrokerName) {
        var that = this;
        this.currentVbrokerId = vbrokerId;
        this.currentVbrokerName = vbrokerName;
        that.getHisData(vbrokerId, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(vbrokerName, data, vbrokerId, type);
        }, "vbroker");
        this.firstVbInit = false;
    }

    MqMonitor.prototype.reInitQueue = function(queueId, queueName) {
        var that = this;
        this.currentQueueId = queueId;
        this.currentQueueName = queueName;
        that.getHisData(queueId, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(queueName, data, queueId, type);
        }, "queue");
        this.firstQueueInit = false;
    }

    /*MqMonitor.prototype.reInitOption = function(vbrokerId, vbrokerName, queueId, queueName) {
        this.firstVbInit = true;
        this.firstQueueInit = true;
        this.vbLastStartTs = this.options.END_TS;
        this.qLastStartTs = this.options.END_TS;
        this.currentVbrokerId = vbrokerId;
        this.currentVbrokerName = vbrokerName;
        this.currentQueueId = queueId;
        this.currentQueueName = queueName;
        this.init();
    }*/

    MqMonitor.prototype.clear = function() {
        if(this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        if(this.vbHisInterval) {
            clearInterval(this.vbHisInterval)
        }
        if(this.qHisInterval) {
            clearInterval(this.qHisInterval);
        }
    }

    MqMonitor.prototype.getHisData = function(id, startTs, endTs, callback, type) {
        var url = "",
            that = this,
            data = {};

        if(type == "vbroker") {
            url = "collectdata/getVbrokerHisData";
            data = {"INST_ID" : id, "START_TS" : startTs, "END_TS" : endTs};
        }else {
            url = "collectdata/getQueueHisData";
            data = {"QUEUE_ID" : id, "START_TS" : startTs, "END_TS" : endTs};
        }

        var request = {
            data : data,
            url: rootUrl + url,
            async : true,
            success :function(res){
                if(res['RET_CODE'] === 0){
                    var data = res['RET_INFO'];
                    that.options.END_TS = endTs;
                    callback.call(that, data, type);
                }else{
                    console.log(res['RET_INFO']);
                    alert("error ,please check the console command!");
                }
            },
            beforeSend : function () {}
        }
        $.ajax(request);
    }

    /*MqMonitor.prototype.getQueueHisData = function(queueId, startTs, endTs) {
        var queueHisUrl   = "collectdata/getQueueHisData",
            that = this,
            qAjax = {
                data : {"QUEUE_ID" : queueId, "START_TS" : startTs, "END_TS" : endTs},
                url: rootUrl + queueHisUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];
                        console.log(data);
                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!");
                    }
                },
                beforeSend : function () {}
            }
        $.ajax(qAjax);
    }*/

    MqMonitor.prototype.getCurrentCollectData = function(vbCallback, qCallback) {
        var vbrokerCollectUrl = "collectdata/getVbrokerCurrentData",
            queueCollectUrl   = "collectdata/getQueueCurrentData",
            that = this,
            vbAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + vbrokerCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];
                        that.options.VB_TABLE_ELE.html("");

                        if(data.length > 0 && that.firstVbInit) {
                            if(!that.currentVbrokerId) {
                                that.currentVbrokerId = data[0]["VBROKER_ID"];
                                that.currentVbrokerName = data[0]["VBROKER_NAME"];
                            }
                            vbCallback.call(that, that.currentVbrokerId, that.currentVbrokerName);
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cVbName = collectInfo.VBROKER_NAME,
                                cVbId = collectInfo.VBROKER_ID;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                                    collectInfo.VBROKER_NAME, collectInfo.PRODUCE_RATE, collectInfo.PRODUCE_COUNTS,
                                    collectInfo.CONSUMER_RATE, collectInfo.CONSUMER_COUNTS),
                                $tr = $(tr);

                            var clickFun =  function () {
                                $(this).unbind();
                                $(this).css("background-color", "#dbdee2");
                                that.reInitVbroker(cVbId, cVbName);
                                $(this).siblings().click(clickFun).css("background-color", "white");

                            };

                            if(that.currentVbrokerId && that.currentVbrokerId != cVbId) {
                                $tr.click(clickFun);
                            }else {
                                $tr.css("background-color", "#dbdee2");
                            }

                            that.options.VB_TABLE_ELE.append($tr);

                        }

                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!");
                    }
                },
                beforeSend : function () {}
            },
            qAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + queueCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];
                        that.options.Q_TABLE_ELE.html("");
                        for(var index in data) {
                            var collectInfo = data[index];
                            let cQueueName = collectInfo.QUEUE_NAME,
                                cQueueId = collectInfo.QUEUE_ID;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                                    cQueueName, collectInfo.PRODUCE_RATE, collectInfo.PRODUCE_COUNTS,
                                    collectInfo.CONSUMER_RATE, collectInfo.CONSUMER_COUNTS),
                                    $tr = $(tr);

                            var clickFun = function () {
                                $(this).unbind();
                                $(this).css("background-color", "#dbdee2");
                                that.reInitQueue(cQueueId, cQueueName);
                                $(this).siblings().click(clickFun).css("background-color", "white");
                            };

                            if(that.currentQueueId && that.currentQueueId != cQueueId) {
                                $tr.click(clickFun);
                            }else {
                                $tr.css("background-color", "#dbdee2");
                            }

                            that.options.Q_TABLE_ELE.append($tr);
                        }
                        if(data.length >0 && that.firstQueueInit) {
                            if(!that.currentQueueId) {
                                that.currentQueueId = data[0]["QUEUE_ID"];
                                that.currentQueueName = data[0]["QUEUE_NAME"];
                            }

                            qCallback.call(that, that.currentQueueId, that.currentQueueName);
                        }
                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!")
                    }
                },
                beforeSend : function () {}
            };

        $.ajax(vbAjax);
        $.ajax(qAjax);
    }

    MqMonitor.prototype.initEcharts =function (vbrokerName, data, instId, type) {
        var that = this,
            echarDiv = type == "vbroker" ? that.options.VB_ECHART_ELE : that.options.Q_ECHART_ELE;

        var echartOptions = {
            title:{ text : vbrokerName + " 速率展示"}
        };

        echartOptions= $.extend(true,{},MqMonitor.ECHART_DEFALT_OPTIONS, echartOptions);
        echarts.dispose(echarDiv[0]);
        var chart = echarts.init(echarDiv[0], this.options.theme);
        chart.setOption(echartOptions);

        if(!data) {
            Util.alert("info", "没有信息");
            return;
        }

        var vbDataOption = {
            legend : {
                data : ['生产', '消费']
            },
            series : [{
                name: '生产',
                type: 'line',
                smooth:true,
                data : data.map(function (item) {
                    return [item.REC_TIME, item.PRODUCE_RATE];
                })
            },{
                name: '消费',
                type: 'line',
                smooth:true,
                data : data.map(function (item) {
                    return [item.REC_TIME, item.CONSUMER_RATE];
                })
            }]
        };
        chart.setOption(vbDataOption);
        if(type == "vbroker") {
            clearInterval(this.vbHisInterval);
            this.vbHisInterval = setInterval(function () {
                that.getHisIntervalData(instId, vbDataOption, chart, type);
            }, 10000);
        }else {
            clearInterval(this.qHisInterval);
            this.qHisInterval = setInterval(function () {
                that.getHisIntervalData(instId, vbDataOption, chart, type);
            }, 10000);
        }

    }

    MqMonitor.prototype.getHisIntervalData = function(instId, vbDataOption, chart, type) {
        var startTs = type == "vbroker" ? this.vbLastStartTs + 1 : this.qLastStartTs + 1,
            now     = new Date(),
            endTs   = now.getTime(),
            that = this;

            this.getHisData(instId, startTs, endTs, function (data) {
                for(var index in data) {
                    var item = data[index];
                    vbDataOption.series[0]['data'].push([item.REC_TIME, item.PRODUCE_RATE]);
                    vbDataOption.series[1]['data'].push([item.REC_TIME, item.CONSUMER_RATE]);
                };
                chart.setOption(vbDataOption);
                if(type == "vbroker") {
                    that.vbLastStartTs = endTs;
                }else {
                    that.qLastStartTs = endTs;
                }

            },type);

    }

    window.MqMonitor = MqMonitor;

}(jQuery,echarts, window));