/**
 * Created by guozh on 2018/10/12.
 */

(function ($, window) {

    function isNameInArr(arr, ele) {
        try {
            if(arr == null || arr.length === 0) {
                return false;
            }

            for(let i in arr) {
                let row  = arr[i],
                name = row['name'];

                if(name != null && name === ele) {
                    return row;
                }
            }
        }catch (e) {
            console.error(e);
            return false;
        }
        return false;
    }

    let SdbInfo = function (options) {
        this.options = options;
        this.options.tableCSEle = $("#" + options.tableCSEle);
        this.options.tableCLEle = $("#" + options.tableCLEle);
        this.options.partitionsEle = $("#" + options.partitionsEle);
        this.options.partitionsBodyEle = $("#" + options.partitionsBodyEle);
        this.options.attrAttachCLModalEle = $("#" + options.attrAttachCLModalEle);
        this.options.attrCSModal = $("#" + options.attrCSModal);
        this.options.domainSelect = $("#" + options.domainSelect);
        this.options.attrCLModal = $("#" + options.attrCLModal);
        this.options.autoAttachCLModal = $("#" + options.autoAttachCLModal);
        this.options.csSlect = $("#" + options.csSlect);
        this.options.attachCLSelect = $("#" + options.attachCLSelect);
        this.options.CURR_CL_NAME = $("#" + options.CURR_CL_NAME);
        this.options.CURR_MAIN_CL_NAME = $("#" + options.CURR_MAIN_CL_NAME);
        this.options.CURR_MAIN_CL_FIELD = $("#" + options.CURR_MAIN_CL_FIELD);
        this.options.domainListHtml = "";
        this.options.csListHtml = "";
        this.options.cLListHtml = "";
        this.init();
    };

    SdbInfo.prototype.init = function () {
        let that = this;
        this.getCSData(function (data) {
            that.renderCSTable(data);
        });
        this.getCLData(function (data) {
            that.renderCLTable(data);
        });
        this.listDomains();
    };

    SdbInfo.prototype.getCSData = function (callback) {
        let that = this,
            csAjax = {
                url : rootUrl + "sdbsvr/getCSInfo",
                data : {},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        let res = data['RET_INFO'],
                            csData = that.csHandle(res);

                        if(callback) {
                            callback.call(this, csData);
                        }

                    }else {
                        console.log(data['RET_INFO']);
                    }
                }
            };

        $.ajax(csAjax);
    };

    SdbInfo.prototype.getCLData = function (callback) {
        let that = this,
            clAjax = {
                url : rootUrl + "sdbsvr/getCLInfo",
                data : {},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        let res = data['RET_INFO'],
                            clData = that.clHandle(res);

                        if(callback) {
                            callback.call(this, clData);
                        }
                    }else {
                        console.log(data['RET_INFO']);
                    }
                }
            };

        $.ajax(clAjax);
    };

    SdbInfo.prototype.csHandle = function(data) {

        let csData = [];
        this.options.csListHtml = "";
        for(let i in data['listCS']) {
            let row = data['listCS'][i],
                name   = row['Name'],
                prevRow = isNameInArr(csData, name);

            this.options.csListHtml += "<option value='" + name+ "'> " + name + "</option>";
            if(!prevRow) {
                prevRow = {
                    name : name,
                    count : 0,
                    sizes : 0,
                    groupLen : 0
                };
                csData.push(prevRow);
            }
        }

        console.log(csData);

        for(let i in data['csInfo']) {
            let row    = data['csInfo'][i],
                name   = row['Name'],
                count  = row['TotalRecords'],
                sizes  = row['TotalSize'],
                prevRow = isNameInArr(csData, name);

            if(prevRow) {
                prevRow.count = prevRow.count + count;
                prevRow.sizes = prevRow.sizes + sizes;
                prevRow.groupLen++;
            }else {
                prevRow = {
                    name  : name,
                    count : count,
                    sizes : sizes,
                    groupLen : 1
                };
                csData.push(prevRow);
            }
        }

        console.log(csData);
        return csData;

    };

    SdbInfo.prototype.clHandle = function(data) {
        let clData = [];

        this.options.cLListHtml = "";

        for(let i in data['cataInfo']) {
            let row          = data['cataInfo'][i],
                name         = row['Name'],
                mainCLName   = row['MainCLName'],
                shardingType = row['ShardingType'],
                shardingKey  = row['ShardingKey'],
                cataInfo     = row['CataInfo'],
                prevRow = isNameInArr(clData, name);

            if(!mainCLName && shardingType === "range") {
                this.options.cLListHtml += "<option value='" + name + "'> " + name + "</option>";
            }

            if(prevRow) {
                prevRow.mainCLName = mainCLName;
                prevRow.shardingType = shardingType;
                prevRow.shardingKey = shardingKey;
            }else {
                prevRow = {
                    name : name,
                    mainCLName : mainCLName,
                    shardingType : shardingType,
                    shardingKey : shardingKey,
                    cataInfo : cataInfo,
                    count : 0
                };
                clData.push(prevRow);
            }
        }

        for(let i in data['clInfo']) {
            let row    = data['clInfo'][i],
                name   = row['Name'],
                count  = row['TotalRecords'],
                indexes  = row['Indexes'],
                prevRow = isNameInArr(clData, name);

            if(prevRow) {
                prevRow.count += count;
                prevRow.indexes = indexes;
                if(prevRow.mainCLName != null) {
                    let rangeEle = isNameInArr(clData, prevRow.mainCLName);
                    rangeEle.count += count;
                    rangeEle.indexes = indexes;
                }
            }else {
                prevRow = {
                    name  : name,
                    count : count,

                };
                clData.push(prevRow);
            }
        }

        return clData;
    };

    SdbInfo.prototype.renderCSTable = function(data) {
        this.options.tableCSEle.mTable({
            pagination : false,
            striped : true,
            data : data,
            columns : [{
                checkbox:true
            },{
                field : "name",
                title : "集合空间"
            },{
                field : "count",
                title : "总记录数"
            }, {
                field : "sizes",
                title : "总大小",
                format : function (value) {
                    return value + " M";
                }
            }, {
                field : "groupLen",
                title : "分区组"
            } ]
        });
    };

    SdbInfo.prototype.renderCLTable = function(data) {
        let that = this;
        this.options.tableCLEle.mTable({
            pagination : false,
            striped : true,
            data : data,
            columns : [{
                checkbox:true
            },{
                field : "name",
                title : "集合"
            },{
                field : "shardingType",
                title : "分区类型",
                format : function (value) {
                    let res = "";
                    if(value === "range") {
                        res = "垂直分区";
                    }else if(value === "hash"){
                        res = "水平散列分区";
                    }
                    return res;
                }
            }, {
                field : "mainCLName",
                title : "归属集合"
            }, {
                field : "count",
                title : "记录数"
            }, {
                field : "indexes",
                title : "索引数"
            },{
                field : "shardingKey",
                title : "分区键",
                format : function (value) {
                    for(let key in value) {
                        return key;
                    }
                }

            },{
                title : "操作",
                isButtonColumn:true,
                buttons:[{
                    text:"分区数据",
                    format:function(value,row){
                        if(!row.cataInfo){
                            return { hided:true };
                        }
                    },
                    onClick:function(button,row){
                        let cataInfo = row.cataInfo;

                        that.options.partitionsEle.modal("show");
                        //bootstrap4 在jquery load html的时候出现modal的出现bug
                        $(".modal-backdrop").appendTo($("#mainContent"));
                        that.partitionTable(cataInfo);

                    }
                }, {
                    text:"分离集合",
                    format:function(value,row){
                        if(!row.mainCLName){
                            return { hided:true };
                        }
                    },
                    onClick:function(button,row){
                        let mainCLName = row['mainCLName'],
                            clName     = row['name'],
                            detachCLAjax = {
                                url : rootUrl + "sdbsvr/detachCL",
                                data : {MAIN_CL : mainCLName, CL_NAME : clName},
                                success : function (data) {
                                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                                        Util.msg("分离成功！");
                                        that.getCLData(function (data) {
                                            that.options.tableCLEle.mTable("refresh", data);
                                            that.options.attrCLModal.modal("hide");
                                        });
                                    }else {
                                        console.log(data['RET_INFO']);
                                    }
                                }
                            };

                        $.ajax(detachCLAjax);
                    }
                }, {
                    text:"挂载集合",
                    format:function(value,row){
                        if((row.shardingType === "hash" && row.mainCLName) || row.shardingType === "range"){
                            return { hided:true };
                        }
                    },
                    onClick:function(button,row){
                        that.options.attrAttachCLModalEle.modal("show");
                        //bootstrap4 在jquery load html的时候出现modal的出现bug
                        $(".modal-backdrop").appendTo($("#mainContent"));
                        that.options.attachCLSelect.html(that.options.cLListHtml);
                        that.options.CURR_CL_NAME.val(row['name']);
                    }
                }/*, {
                    text:"按时间自动创建主子表",
                    format:function(value,row){
                        if(row.shardingType !== "range"){
                            return { hided:true };
                        }
                    },
                    onClick:function(button,row){
                        that.options.autoAttachCLModal.modal("show");
                        $(".modal-backdrop").appendTo($("#mainContent"));
                        that.options.CURR_MAIN_CL_NAME.val(row['name']);
                        that.options.CURR_MAIN_CL_FIELD.val(JSON.stringify(row['shardingKey']));
                    }
                }*/]
            }]
        });
    };

    SdbInfo.prototype.partitionTable = function(row) {
        let html = "<table class=\"table table-sm\" style='table-layout:fixed;'>" +
            "   <thead class=\"table-head\">" +
            "       <tr>" +
            "           <th>groupName</th>" +
            "           <th>lowBound</th>" +
            "           <th>upBound</th>" +
            "       </tr>" +
            "   </thead>" +
            "   <tbody id=\"proxyCollectTable\"  class=\"table-body\">";

        for(let i in row) {
            let partition = row[i],
                groupID = partition['GroupID'] || partition['ID'],
                groupName = partition['GroupName'] || partition['SubCLName'],
                lowBound = JSON.stringify(partition['LowBound']),
                upBound  = JSON.stringify(partition['UpBound']);
            html +=
                "<tr>" +
                "   <td style='word-wrap:break-word;'>" + groupName + "</td>" +
                "   <td>" + lowBound + "</td>" +
                "   <td>" + upBound + "</td>" +
                "</tr>";
        }

        html +=
            "   </tbody>" +
            " </table>";



        this.options.partitionsBodyEle.html(html);
    };

    SdbInfo.prototype.listDomains = function () {
        let that = this,
            listDomainAjax = {
                url : rootUrl + "sdbsvr/listDomains",
                data : {},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        let res = data['RET_INFO'];
                        that.options.domainListHtml = "";
                        for(let i in res) {
                            let row = res[i];
                            that.options.domainListHtml += "<option value='" + row['Name'] + "'>" + row['Name'] + "</option>";
                        }
                    }else {
                        console.log(data['RET_INFO']);
                    }
                }
            };
        $.ajax(listDomainAjax);
    };

    SdbInfo.prototype.addCS = function (csName, domainName) {
        let that = this,
            addCSAjax = {
                url : rootUrl + "sdbsvr/addCS",
                data : {CS_NAME : csName, DOMAIN_NAME : domainName},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("添加成功！");
                        that.getCSData(function (data) {
                            that.options.tableCSEle.mTable("refresh", data);
                            that.options.attrCSModal.modal("hide");
                        });
                    }else {
                        Util.msg("添加失败！");
                        console.log(data['RET_INFO']);
                    }
                }
            };
        $.ajax(addCSAjax);
    };

    SdbInfo.prototype.delCS = function (csName) {
        let that = this,
            delCSAjax = {
                url : rootUrl + "sdbsvr/delCS",
                data : {CS_NAME : csName},
                timeout : 1000 * 60 * 5,//删除可能会比较长，超时时间设置长点 5分钟
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("删除成功！");
                        that.getCSData(function (data) {
                            that.options.tableCSEle.mTable("refresh", data);
                        });
                    }else {
                        Util.msg("删除失败！");
                        console.log(data['RET_INFO']);
                    }
                }
            };

        $.ajax(delCSAjax);
    };

    SdbInfo.prototype.addCL = function (csName, clName, clType, replicaNum, sharedingKey) {
        let that = this,
            addCSAjax = {
                url : rootUrl + "sdbsvr/addCL",
                data : {
                    CS_NAME : csName,
                    CL_NAME : clName,
                    CL_TYPE : clType,
                    RP_NUM : replicaNum,
                    SHAREDING_KEY : sharedingKey
                },
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("添加成功！");
                        that.getCLData(function (data) {
                            that.options.tableCLEle.mTable("refresh", data);
                            that.options.attrCLModal.modal("hide");
                        });
                    } else {
                        Util.msg("添加失败！");
                        console.log(data['RET_INFO']);
                    }
                }
            };
        $.ajax(addCSAjax);
    };

    SdbInfo.prototype.delCL = function (cl) {
        let that = this,
            clName = cl['name'],
            mainCl = cl['mainCLName'],
            shardingType = cl['shardingType'],
            addCSAjax = {
                url : rootUrl + "sdbsvr/delCL",
                data : {CL_NAME : clName},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("添加成功！");
                        that.getCLData(function (data) {
                            that.options.tableCLEle.mTable("refresh", data);
                            that.options.attrCLModal.modal("hide");
                        });
                    }else {
                        Util.msg("添加失败！");
                        console.log(data['RET_INFO']);
                    }
                }
            };

        if(shardingType === "hash") {
            if(mainCl) {
                 Util.msg("请先与主表分离！");
            }else {
                $.ajax(addCSAjax);
            }
        }else {
            Util.confirm("确认删除垂直分区表么（必须先分离字表）？", {
                btn: ['是','否'],
                title: "确认"
            }, function(){
                $.ajax(addCSAjax);
            });
        }
    };

    SdbInfo.prototype.attachCL = function (mainCLName, clName, field, lowBound, upBound) {
        let that = this,
            attachClAjAX = {
                url : rootUrl + "sdbsvr/attachCL",
                data : {MAIN_CL : mainCLName, CL_NAME : clName, FIELD : field, LOW_BOUND : lowBound, UP_BOUND : upBound},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("挂载成功！");
                        that.getCLData(function (data) {
                            that.options.tableCLEle.mTable("refresh", data);
                            that.options.attrAttachCLModalEle.modal("hide");
                        });
                    }else {
                        console.log(data['RET_INFO']);
                    }
                }
            };

        $.ajax(attachClAjAX);
    };

    SdbInfo.prototype.autoAttachCL = function (mainCLName, mainCLField, beginDate, endDate) {
        let that = this,
            attachClAjAX = {
                url : rootUrl + "sdbsvr/autoAttachCL",
                data : {MAIN_CL : mainCLName, FIELD : mainCLField, BEGIN_DATE : beginDate, END_DATE : endDate},
                success : function (data) {
                    if(data['RET_CODE'] === 0 || data['RET_CODE']) {
                        Util.msg("自动挂载成功！");
                        that.getCLData(function (data) {
                            that.options.tableCLEle.mTable("refresh", data);
                            that.options.attrAttachCLModalEle.modal("hide");
                        });
                    }else {
                        console.log(data['RET_INFO']);
                    }
                }
            };

        $.ajax(attachClAjAX);
    };

    window.SdbInfo = SdbInfo;

}(jQuery, window));