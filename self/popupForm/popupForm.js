(function($){
    var popupForm = function(eleType, options){
        this.options = options;
        this.show = function(data){
            if(data){//编辑状态，把值传进去
                this.title = "Edit " + eleType;
            }else{
                this.title = "Add " + eleType;
            }
            this.$popup || this.createPopupForm(options);
            this.putData(data);
            this.$popupTitle.find("div").text(this.title);
            this.$popup.show();
            this.resize();
        };
        this.putData = function(data){//{TIKD_ID:3332234444,TIKV_NAME:DSDSDSDSDS ...}
            if(data == null ){
                return;
            }
            for(var key in data){
                this.$form.find("input[name='"+key+"']").val(data[key]);
            }
        };
        this.hide = function(){
            this.$popup.hide();
        };
        this.resize = function(){//会随浏览器大小自动居中和调整popup的大小
            this.$popupBody.css({
                "margin-left":-(this.$popupBody.width()/2)+"px",
                "margin-top":-(this.$popupBody.height()/2)+"px"});//居中效果
            var padding = this.$popupContent.css("padding-top").split("px")[0];
            this.$popupBody.height(this.$popupTitle.height() + this.contentHeight + this.$popupFoot.height()+3);//3是border的高度
            this.$popupBody.width(this.contentWidth);
            this.$popupContent.height(this.$popupBody.height() - this.$popupTitle.height() - this.$popupFoot.height() - padding *2);//30是2 * padding的高度
        };
        this.createPopupForm = function(options){
            var that = this;
            this.createForm(options),
                this.$popup = $("<div class='popup'></div>"),
                this.$popupShelter = $("<div class='popupShelter'></div>"),
                this.$popupBody = $("<div class='popupBody'></div>"),
                this.$popupTitle = $("<div class='popupBodyTitle'><div>这是一个Title！</div></div>"),
                this.$popupClose = $("<span class='popupBodyClose'>x</span>"),
                this.$popupContent = $("<div class = 'popupBodyContent'></div>"),
                this.$popupFoot = $("<div class = 'popupBodyFoot'></div>"),
                this.$cancelBtn = $("<button type = 'button' class = 'popupBodyFootBtn' >取消</button>");
                this.$submitBtn = $("<button type = 'button' class = 'popupBodyFootBtn' >提交修改</button>");

            this.$popupContent.append(this.$form);
            this.$popupFoot.append(this.$submitBtn,this.$cancelBtn);
            this.$popupBody.append(this.$popupTitle,this.$popupClose,this.$popupContent,this.$popupFoot);
            this.$popup.append(this.$popupShelter,this.$popupBody);
            this.$popup.appendTo($('body'));

            this.contentHeight = this.$popupContent.height();
            this.contentWidth = this.$popupContent.width();
            //绑定事件
            $(window).resize(function() {
                that.resize();
            });
            this.$cancelBtn.click(function(){
                that.hide();
            });
            this.$popupClose.click(function(){
                that.hide();
            });
            this.$submitBtn.click(function(){
                that.$popupBody.css("z-index",998);
                var disableds = that.$form.find("input[disabled=true]").removeAttr("disabled");
                var data = that.$form.serialize();
                disableds.attr("disabled",true);
                $.ajax({
                    type:"post",
                    url:that.options.url,
                    data:that.$form.serialize(),
                    success:function(data){
                        that.$popupBody.css("z-index",1000);
                        disableds.removeAttr("disabled");
                        that.$form[0].reset();
                        disableds.attr("disabled",true);
                        that.options.successCallback(data);
                        that.hide();
                    },
                    error:function(msg){
                        that.$popupBody.css("z-index",1000);
                        that.options.errorCallBack(msg);
                    }
                });
            });
            this.resize();
            this.hide();
        };
        this.createForm = function(options){
            var that = this,data = options['data'];
            this.$form = $("<form class='popupFrom' action='"+options.url+"' method='post'></form>");
            for(var i in data){
                var row = data[i];
                for(var id in row){
                    var field = row[id],
                        label = field['description'],
                        required = field['required'],
                        minLength = field['minLength'],
                        type = field['type'],
                        pattern = field['pattern'],
                        filedset = $("<fieldset class='popupFormFiedSet'>" +
                            "<div class='popupFromGroup'>" +
                                "<label class='popupFormLabel'>"+label+"</label>"+
                                "<div class = 'popupFormDivInput'>" +
                            //(id === "TIKV_ID" ? "<input class = 'popupFormInput' name='"+id+"' disabled=true value='135h5jdf-3d3e3-dddf3-665fdsd'>" :
                                    "<input class = 'popupFormInput' name='"+id+"' />" +
                                "</div>"+
                            "</div>" +
                            "</fieldset>").appendTo(that.$form);

                }
            }
            //解决出现滚动条的时候 FF和IE 下出现padding-bottom丢失情况，把原先的padding-bottom设置为0，最后一个元素添加padding高度
            $("<div style='height:15px'></div>").appendTo(that.$form);
        };
    };
    $.extend({
        popupForm :function(eleType ,url ,schema,successCallback,errorCallBack){
            var eleTypeJson,
                fields=[],
                options={
                    url:url,
                    successCallback:successCallback,
                    errorCallBack:errorCallBack
                },
                res={};
            analysis(eleType,schema['properties']);
            getFields(eleTypeJson);
            options.data = fields;
            function analysis(eleType ,schema){
                if(eleTypeJson){
                    return;
                }
                if(schema[eleType]){
                    eleTypeJson = schema[eleType];
                    return;
                }
                for(var key in schema){
                    var jsonRoot = schema[key]['properties'];
                    jsonRoot && analysis(eleType,jsonRoot);
                }
            }
            function getFields(json){
                var type = json['type'];
                if(type === 'array'){
                    getFields(json['items']);
                }else if(type === 'object'){
                    var properties = json['properties'];
                    for(var key in properties){
                        var field = new Object();
                        field[key] = properties[key];
                        /*var option = {key:properties[key]};*/
                        fields.push(field);
                    }
                }
            }
            res = new popupForm(eleType,options);
            return res;
        }
    });
})(jQuery);