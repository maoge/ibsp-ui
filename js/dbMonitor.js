/**
 * Created by guozh on 2018/7/24.
 */

(function ($,echarts,window) {

    var DBMonitor = function (options) {
        this.options = options;
        this.options.theme = "dark";
        this.firstTiDBInit = true;
        this.firstPDInit = true;
        this.tidbLastStartTs = this.options.END_TS;
        this.pdLastStartTs = this.options.END_TS;
        this.init();
    };

    DBMonitor.ECHART_DEFALT_OPTIONS = {
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

    DBMonitor.prototype.init = function () {
        var that = this,
            tidb = "tidb",
            pd   = "pd";
        this.clear();

        this.getCurrentCollectData(
            function (instId, firstName) {
                that.getHisData(instId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, instId, type);
                }, tidb);
                this.firstTiDBInit = false;
            },
            function (instId, firstName) {
                that.getHisData(instId, that.options.START_TS, that.options.END_TS, function (data, type) {
                    that.initEcharts(firstName, data, instId, type);
                }, pd);
                this.firstPDInit = false;
            },
            true
        );

        //定时更新当前数据
        this.currentInterval = setInterval(function () {
            that.getCurrentCollectData();
        }, 10000);
    }

    DBMonitor.prototype.reInitTiDB = function(id, name) {
        var that = this;
        this.currentTiDBId = id;
        this.currentTiDBName = name;
        that.getHisData(id, that.options.START_TS, that.options.END_TS, function (data, type) {
            that.initEcharts(name, data, id, type);
        }, "tidb");
        this.firstTiDBInit = false;
    }

    DBMonitor.prototype.clear = function() {
        if(this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        if(this.tidbHisInterval) {
            clearInterval(this.tidbHisInterval)
        }
        if(this.pdHisInterval) {
            clearInterval(this.pdHisInterval);
        }
    }

    DBMonitor.prototype.getHisData = function(id, startTs, endTs, callback, type) {
        var url = "",
            that = this,
            data = {};
        if(type == "tidb") {
            url = "collectdata/getTiDBHisData";
            data = {"INST_ID" : id, "START_TS" : startTs, "END_TS" : endTs};
        }else {
            url = "collectdata/getPDHisData";
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

    DBMonitor.prototype.getCurrentCollectData = function(tidbCallback, pdCallback) {
        var tidbCollectUrl   = "collectdata/getTiDBCurrentData",
            pdCollectUrl     = "collectdata/getPDCurrentData",
            tikvCollectUrl   = "collectdata/getTiKVCurrentData",
            that = this,
            tidbAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + tidbCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'],
                            countTPS = 0;
                        that.options.TIDB_TABLE_ELE.html("");

                        if(data.length > 0 && that.firstTiDBInit) {
                            if(!that.currentTiDBId) {
                                that.currentTiDBId = data[0]["TIDB_ID"];
                                that.currentTiDBName = data[0]["TIDB_NAME"];
                            }
                            tidbCallback.call(that, that.currentTiDBId, that.currentTiDBName);
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cTiDBName = collectInfo.TIDB_NAME,
                                cTiDBId = collectInfo.TIDB_ID;
                            countTPS += collectInfo.STATEMENT_COUNT;
                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td>' +
                                '<td>%s</td></tr>',
                                collectInfo.TIDB_NAME + "-",
                                (collectInfo.QPS).toFixed(0),
                                collectInfo.CONNECTION_COUNT,
                                (collectInfo.STATEMENT_COUNT).toFixed(4),
                                (collectInfo.QUERY_DURATION_99PERC * 1000).toFixed(0)),
                                $tr = $(tr);
                            var clickFun = function () {
                                $(this).unbind();
                                $(this).siblings().click(clickFun).css("background-color", "white");
                                $(this).css("background-color", "#dbdee2");
                                that.reInitTiDB(cTiDBId, cTiDBName);
                            };
                            if(cTiDBId != that.currentTiDBId) {
                                $tr.click(clickFun);
                            }else {
                                $tr.css("background-color", "#dbdee2");
                            }
                            that.options.TIDB_TABLE_ELE.append($tr);
                        }

                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!");
                    }
                },
                beforeSend : function () {}
            },
            pdAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + pdCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];

                        that.options.PD_TABLE_ELE.html("");

                        if(data.length >0 && that.firstPDInit) {
                            if(!that.currentPDId) {
                                that.currentPDId = data[0]["PD_ID"];
                                that.currentPDName = data[0]["PD_NAME"];
                            }

                            pdCallback.call(that, that.currentPDId, that.currentPDName);
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cPDName = collectInfo.PD_NAME,
                                cPDId = collectInfo.PD_ID;

                            /*var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                                cPDName,
                                (collectInfo.STORAGE_CAPACITY /1024 /1024 / 1024).toFixed(2) + " G",
                                (collectInfo.CURRENT_STORAGE_SIZE /1024 /1024 / 1024).toFixed(4) + " G",
                                (collectInfo.LEADER_BALANCE_RATIO).toFixed(2),
                                (collectInfo.REGION_BALANCE_RATIO).toFixed(2),
                                (collectInfo.COMPLETE_DURATION_SECONDS_99PENC * 1000).toFixed(0)),
                                $tr = $(tr);
                            that.options.PD_TABLE_ELE.append($tr);*/

                            that.options.STORAGE_ECHART_ELE.html((collectInfo.STORAGE_CAPACITY /1024 /1024 / 1024).toFixed(2) + " G");
                            that.options.CURRSIZE_ECHART_ELE.html((collectInfo.CURRENT_STORAGE_SIZE /1024 /1024 / 1024).toFixed(4) + " G");
                            that.options.REGIONS_ELE.html((collectInfo.REGIONS).toFixed(0));
                            that.options.LEADER_RADIO_ELE.html((collectInfo.LEADER_BALANCE_RATIO * 100).toFixed(2) + "%");
                            that.options.REGION_RADIO_ELE.html((collectInfo.REGION_BALANCE_RATIO * 100).toFixed(2) + "%");
                            that.options.STORE_STATUS_ELE.html("<table class='table'>" +
                                "<tr><td>up</td><td>"+collectInfo.STORE_UP_COUNT+"</td></tr>" +
                                "<tr><td>down</td><td>"+collectInfo.STORE_DOWN_COUNT+"</td></tr>" +
                                "<tr><td>offline</td><td>"+collectInfo.STORE_OFFLINE_COUNT+"</td></tr>" +
                                "<tr><td>tombtone</td><td>"+collectInfo.STORE_TOMBSTONE_COUNT+"</td></tr>" +
                                "</table>");
                        }

                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!")
                    }
                },
                beforeSend : function () {}
            },
            tikvAjax = {
                data : {"SERV_ID" : that.options.SERV_ID},
                url: rootUrl + tikvCollectUrl,
                async : true,
                success :function(res){
                    if(res['RET_CODE'] === 0){
                        var data = res['RET_INFO'];

                        that.options.TIKV_TABLE_ELE.html("");

                        if(data.length >0 && that.firstPDInit) {
                            if(!that.currentTiKVId) {
                                that.currentTiKVId = data[0]["TIKV_ID"];
                                that.currentTiKVName = data[0]["TIKV_NAME"];
                            }
                        }

                        for(var index in data) {
                            var collectInfo = data[index];
                            let cTiKVName = collectInfo.TIKV_NAME,
                                cTiKVId = collectInfo.TIKV_ID;

                            var tr = Util.sprintf('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td>%s</td></tr>',
                                cTiKVName,
                                (collectInfo.LEADER_COUNT).toFixed(0),
                                (collectInfo.REGION_COUNT).toFixed(0),
                                (collectInfo.SCHEEDULER_COMMAND_DURATION * 1000).toFixed(0)),
                                $tr = $(tr);
                            that.options.TIKV_TABLE_ELE.append($tr);
                        }

                    }else{
                        console.log(res['RET_INFO']);
                        alert("error ,please check the console command!")
                    }
                },
                beforeSend : function () {}
            };
        $.ajax(tidbAjax);
        $.ajax(pdAjax);
        $.ajax(tikvAjax);
    }

    DBMonitor.prototype.initEcharts =function (name, data, instId, type) {
        var that = this;
        if(type == "tidb") {
            this.initTiDBEcharts(name, data, instId);
        }

    }

    DBMonitor.prototype.initTiDBEcharts =function (name, data, instId) {
        var that = this,
            echarDiv = that.options.TIDB_ECHART_ELE;

        var echartOptions = {
            title:{ text : name + " QPS"}
        };

        echartOptions= $.extend(true,{},DBMonitor.ECHART_DEFALT_OPTIONS, echartOptions);
        echarts.dispose(echarDiv[0]);
        var chart = echarts.init(echarDiv[0], this.options.theme);
        chart.setOption(echartOptions);

        if(!data) {
            Util.alert("info", "没有信息");
            return;
        }

        var dataOption = {
            legend : {
                data : [name]
            },
            series : [{
                name: name,
                type: 'line',
                smooth:true,
                data : data.map(function (item) {
                    return [item.TIME, item.QPS];
                })
            }]
        };
        chart.setOption(dataOption);

        clearInterval(this.tidbHisInterval);
        this.tidbHisInterval = setInterval(function () {
            that.getHisIntervalData(instId, dataOption, chart, "tidb");
        }, 10000);

    }

    DBMonitor.prototype.getHisIntervalData = function(instId, dataOption, chart, type) {
        var startTs = type == "tidb" ? this.tidbLastStartTs + 1 : this.pdLastStartTs + 1,
            now     = new Date(),
            endTs   = now.getTime(),
            that = this;

        this.getHisData(instId, startTs, endTs, function (data) {
            for(var index in data) {
                var item = data[index];
                dataOption.series[0]['data'].push([item.TIME,
                    type == "tidb" ? item.QPS : item.COMPLETE_DURATION_SECONDS_99PENC]);
            };
            chart.setOption(dataOption);
            if(type == "tidb") {
                that.tidbLastStartTs = endTs;
            }else {
                that.pdLastStartTs = endTs;
            }

        },type);

    }

    window.DBMonitor = DBMonitor;

}(jQuery,echarts, window));