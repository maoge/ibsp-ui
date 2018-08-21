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
        grid:[{
            x : '5%',
            y : '20%',
            width : '90%',
            height: '50%'
        }],
        yAxis:{
            scale: false
        },
        xAxis: {
            type: 'time',
            scale: true,
            splitLine: {show: false},
            splitNumber : 15,
            minInterval : 10,
            rotate: 45,
            tickMax: true,
            boundaryGap:['5%','5%'],
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
            },
            true
        );
        //定时更新当前数据
        this.currentInterval = setInterval(function () {
            that.getCurrentCollectData();
        }, 10000);
    }

    CacheMonitor.prototype.reInitProxy = function(proxyID, proxyName) {
        var that = this;
        this.currentProxyId = proxyID;
        this.currentProxyName = proxyName;
        that.getHisData(proxyID, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(proxyName, data, proxyID, type);
        }, "proxy");
        this.firstProxyInit = false;
    }

    CacheMonitor.prototype.reInitRedis = function(redisID, redisName) {
        var that = this;
        this.currentRedisId = redisID;
        this.currentRedisName = redisName;
        that.getHisData(redisID, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(redisName, data, redisID, type);
        }, "redis");
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
                        var data = res['RET_INFO'],
                            countTPS = 0;
                        that.options.PROXY_TABLE_ELE.html("");

                        if(data.length > 0 && that.firstProxyInit) {
                            if(!that.currentProxyId) {
                                that.currentProxyId = data[0]["CACHE_PROXY_ID"];
                                that.currentProxyName = data[0]["CACHE_PROXY_NAME"];
                            }
                            proxyCallback.call(that, that.currentProxyId, that.currentProxyName);
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cProxyName = collectInfo.CACHE_PROXY_NAME,
                                cProxybId = collectInfo.CACHE_PROXY_ID;
                            countTPS += collectInfo.ACCESS_REQUEST_TPS;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td>' +
                                '<td>%s</td><td>%s</td></tr>',
                                collectInfo.CACHE_PROXY_NAME,
                                collectInfo.ACCESS_CLIENT_CONNS,
                                collectInfo.ACCESS_REQUEST_TPS,
                                collectInfo.ACCESS_REQUEST_EXCEPTS,
                                (collectInfo.ACCESS_PROCESS_MAXTIME).toFixed(4),
                                (collectInfo.ACCESS_PROCESS_AVTIME).toFixed(4)),
                                $tr = $(tr);
                            var clickFun = function () {
                                $(this).unbind();
                                $(this).siblings().click(clickFun).css("background-color", "white");
                                $(this).css("background-color", "#dbdee2");
                                that.reInitProxy(cProxybId, cProxyName);
                            };

                            if(cProxybId != that.currentProxyId) {
                                $tr.click(clickFun);
                            }else {
                                $tr.css("background-color", "#dbdee2");
                            }
                            that.options.PROXY_TABLE_ELE.append($tr);
                            that.options.PROXY_CITE_ELE.html(countTPS);
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
                        var data = res['RET_INFO'],
                            countTps = 0;
                        that.options.REDIS_TABLE_ELE.html("");

                        if(data.length >0 && that.firstRedisInit) {
                            if(!that.currentRedisId) {
                                that.currentRedisId = data[0]["CACHE_NODE_ID"];
                                that.currentRedisName = data[0]["CACHE_NODE_NAME"];
                            }

                            redisCallback.call(that, that.currentRedisId, that.currentRedisName);
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cRedisName = collectInfo.CACHE_NODE_NAME,
                                cRedisd = collectInfo.CACHE_NODE_ID;

                            countTps += collectInfo.PROCESS_TPS;

                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                                cRedisName,
                                collectInfo.DB_SIZE,
                                (collectInfo.MEMORY_USED /1024 /1024).toFixed(0) + "M",
                                (collectInfo.MEMORY_TOTAL /1024 /1024).toFixed(0) + "M",
                                collectInfo.PROCESS_TPS,
                                collectInfo.CONNECTED_CLIENTS),
                                $tr = $(tr);
                            var clickFun = function () {
                                $(this).unbind();
                                $(this).siblings().click(clickFun).css("background-color", "white");
                                $(this).css("background-color", "#dbdee2");
                                that.reInitRedis(cRedisd, cRedisName);
                            }
                            if(that.currentRedisId != cRedisd) {
                                $tr.click(clickFun);
                            }else {
                                $tr.css("background-color", "#dbdee2");
                            }
                            that.options.REDIS_TABLE_ELE.append($tr);
                            that.options.REDIS_CITE_ELE.html(countTps);
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
            clearInterval(this.proxyHisInterval);
            this.proxyHisInterval = setInterval(function () {
                that.getHisIntervalData(instId, vbDataOption, chart, type);
            }, 10000);
        }else {
            clearInterval(this.redisHisInterval);
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