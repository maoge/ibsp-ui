/**
 * Created by guozh on 2018/7/24.
 */

(function ($,echarts,window) {

    var CacheMonitor = function (options) {
        this.options = options;
        this.options.theme = "dark";
        this.firstProxyInit = true;
        this.firstRedisInit = true;
        this.proxyLastStartTs = this.options.END_TS;
        this.redisLastStartTs = this.options.END_TS;
        this.init();
    };

    CacheMonitor.ECHART_DEFALT_OPTIONS = {
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

    CacheMonitor.prototype.init = function () {
        var that = this,
            proxy = "proxy",
            redis   = "redis";
        this.clear();
        //获取当前数据，并且注册回调处理第一个vbroker和queue的历史数据展示
        this.getCurrentCollectData(
            function (instId, firstName) {
                that.getHisData(instId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, instId, type);
                }, proxy);
                this.firstProxyInit = false;
            },
            function (instId, firstName) {
                that.getHisData(instId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, instId, type);
                }, redis);
                this.firstRedisInit = false;
            }
        );
        //定时更新当前数据
        this.currentInterval = setInterval(function () {
            that.getCurrentCollectData();
        }, 10000);
    }

    CacheMonitor.prototype.reInitProxy = function(proxyID, proxyName) {
        clearInterval(this.proxyHisInterval);
        var that = this;
        this.currentProxyId = proxyID;
        this.currentProxyName = proxyName;
        that.getHisData(proxyID, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(proxyName, data, proxyID, type);
        }, "vbroker");
        this.firstProxyInit = false;
    }

    CacheMonitor.prototype.reInitRedis = function(redisID, redisName) {
        clearInterval(this.redisHisInterval);
        var that = this;
        this.currentRedisId = redisID;
        this.currentRedisName = redisName;
        that.getHisData(redisID, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(redisName, data, redisID, type);
        }, "queue");
        this.firstRedisInit = false;
    }

    CacheMonitor.prototype.clear = function() {
        if(this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        if(this.proxyHisInterval) {
            clearInterval(this.proxyHisInterval)
        }
        if(this.redisHisInterval) {
            clearInterval(this.redisHisInterval);
        }
    }

    CacheMonitor.prototype.getHisData = function(id, startTs, endTs, callback, type) {
        var url = "",
            that = this,
            data = {};
        if(type == "proxy") {
            url = "collectdata/getProxyHisData";
            data = {"INST_ID" : id, "START_TS" : startTs, "END_TS" : endTs};
        }else {
            url = "collectdata/getRedisHisData";
            data = {"INST_ID" : id, "START_TS" : startTs, "END_TS" : endTs};
        }

        var request = {
            data : data,
            url: rootUrl + url,
            async : true,
            success :function(res){
                if(res['RET_CODE'] === 0){
                    var data = res['RET_INFO'];
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

    CacheMonitor.prototype.getCurrentCollectData = function(proxyCallback, redisCallback) {
        var proxyCollectUrl = "collectdata/getProxyCurrentData",
            redisCollectUrl   = "collectdata/getRedisCurrentData",
            that = this,
            proxyAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + proxyCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];
                        that.options.PROXY_TABLE_ELE.html("");
                        for(var index in data) {
                            var collectInfo = data[index];
                            let cProxyName = collectInfo.CACHE_PROXY_NAME,
                                cProxybId = collectInfo.CACHE_PROXY_ID;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td>' +
                                '<td>%s</td><td>%s</td><td>%s</td></tr>',
                                    collectInfo.CACHE_PROXY_NAME,
                                    collectInfo.ACCESS_CLIENT_CONNS,
                                    collectInfo.ACCESS_REDIS_CONNS,
                                    collectInfo.ACCESS_REQUEST_TPS,
                                    collectInfo.ACCESS_REQUEST_EXCEPTS,
                                    collectInfo.ACCESS_PROCESS_MAXTIME,
                                    collectInfo.ACCESS_PROCESS_AVTIME),
                                $tr = $(tr);

                            if(that.currentProxyId && that.currentProxyId != cProxybId) {
                                $tr.click(function () {
                                    $(this).unbind();
                                    that.reInitProxy(cProxybId, cProxyName);
                                });
                            }
                            that.options.PROXY_TABLE_ELE.append($tr);

                        }
                        if(data.length > 0 && that.firstProxyInit) {
                            if(!that.currentProxyId) {
                                that.currentProxyId = data[0]["CACHE_PROXY_ID"];
                                that.currentProxyName = data[0]["CACHE_PROXY_NAME"];
                            }
                            proxyCallback.call(that, that.currentProxyId, that.currentProxyName);
                        }
                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!");
                    }
                },
                beforeSend : function () {}
            },
            redisAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + redisCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];
                        that.options.REDIS_TABLE_ELE.html("");
                        for(var index in data) {
                            var collectInfo = data[index];
                            let cRedisName = collectInfo.CACHE_NODE_NAME,
                                cRedisd = collectInfo.CACHE_NODE_ID;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                                    cRedisName,
                                    collectInfo.DB_SIZE,
                                    collectInfo.MEMORY_USED,
                                    collectInfo.MEMORY_TOTAL,
                                    collectInfo.PROCESS_TPS,
                                    collectInfo.CONNECTED_CLIENTS),
                                    $tr = $(tr);

                                if(that.currentRedisId && that.currentRedisId != cRedisd) {
                                    $tr.click(function () {
                                        $(this).unbind();
                                        that.reInitRedis(cRedisd, cRedisName);
                                    });
                                }
                            that.options.REDIS_TABLE_ELE.append($tr);
                        }
                        if(data.length >0 && that.firstRedisInit) {
                            if(!that.currentRedisId) {
                                that.currentRedisId = data[0]["CACHE_NODE_ID"];
                                that.currentRedisName = data[0]["CACHE_NODE_NAME"];
                            }

                            redisCallback.call(that, that.currentRedisId, that.currentRedisName);
                        }
                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!")
                    }
                },
                beforeSend : function () {}
            };

        $.ajax(proxyAjax);
        $.ajax(redisAjax);
    }

    CacheMonitor.prototype.initEcharts =function (name, data, instId, type) {
        var that = this,
            echarDiv = type == "proxy" ? that.options.PROXY_ECHART_ELE : that.options.REDIS_ECHART_ELE;

        var echartOptions = {
            title:{ text : name + " 速率展示"}
        };

        echartOptions= $.extend(true,{},CacheMonitor.ECHART_DEFALT_OPTIONS, echartOptions);
        echarts.dispose(echarDiv[0]);
        var chart = echarts.init(echarDiv[0], this.options.theme);
        chart.setOption(echartOptions);

        if(!data) {
            Util.alert("info", "没有信息");
            return;
        }

        var vbDataOption = {
            legend : {
                data : ['TPS']
            },
            series : [{
                name: 'TPS',
                type: 'line',
                smooth:true,
                data : data.map(function (item) {
                    return [item.REC_TIME, item.TPS];
                })
            }]
        };
        chart.setOption(vbDataOption);
        if(type == "proxy") {
            this.proxyHisInterval = setInterval(function () {
                that.getHisIntervalData(instId, vbDataOption, chart, type);
            }, 10000);
        }else {
            this.redisHisInterval = setInterval(function () {
                that.getHisIntervalData(instId, vbDataOption, chart, type);
            }, 10000);
        }

    }

    CacheMonitor.prototype.getHisIntervalData = function(instId, dataOption, chart, type) {
        var startTs = type == "proxy" ? this.proxyLastStartTs + 1 : this.redisLastStartTs + 1,
            now     = new Date(),
            endTs   = now.getTime(),
            that = this;

            this.getHisData(instId, startTs, endTs, function (data) {
                for(var index in data) {
                    var item = data[index];
                    dataOption.series[0]['data'].push([item.REC_TIME, item.TPS]);
                };
                chart.setOption(dataOption);
                if(type == "proxy") {
                    that.proxyLastStartTs = endTs;
                }else {
                    that.redisLastStartTs = endTs;
                }

            },type);

    }

    window.CacheMonitor = CacheMonitor;

}(jQuery,echarts, window));