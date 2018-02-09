rootUrl = "http://127.0.0.1:9991/";
serviceListParams = {};
serverListParams = {};

$(function() {
	$(".content").css("min-height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("overflow", "auto");
	
	$(".sidebar-nav").find("li").click(function(){
		var _menu = $(this).attr("value");
		if (_menu=="service_list") {
			toServiceList();
		} else if(_menu=="server_list") {
			toServerList();
		}else if(_menu=="monitor") {
			$(".content").load("monitor.html",function(){})
		}else if(_menu=="metaData") {
			$(".content").load("metadata.html",function(){})
		}
	});
});

//公共函数，暂放在这里
function getContextHeight() {
	var marginBody = parseInt($("#contextBody").css("margin-top").substring(0, $("#contextBody").css("margin-top").length-2));
	var marginBread = parseInt($('.breadcrumb').css("margin-bottom").substring(0, $(".breadcrumb").css("margin-bottom").length-2));
	return $('#contextBody').height()-marginBody*2-marginBread-$('.header').height()-$('.breadcrumb').height()-5;
}
function getContextWidth() {
	var marginBody = parseInt($("#contextBody").css("margin-top").substring(0, $("#contextBody").css("margin-top").length-2));
	return $('#contextBody').width()-marginBody*2;
}


function isNotNull(s) {
	if (s!=undefined && s!=null && s!="") {
		return true;
	} else {
		return false;
	}
}

function toServiceList() {
	$(".content").load("serviceList.html",function(){loadServiceList()});
}

function toServerList() {
	$(".content").load("serverList.html",function(){loadServerList()});
}