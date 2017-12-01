rootUrl = "http://127.0.0.1:9991/";

$(function() {
	$(".content").css("min-height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("overflow", "auto");
	
	$(".sidebar-nav").find("li").click(function(){
		var _menu = $(this).attr("value");
		if (_menu=="TiDB_manage") {
			$(".content").load("tidbManage.html",function(){});
		} else if(_menu=="SQL_explain") {
			$(".content").load("sqlExplain.html",function(){})
		}
	});
});

function isNotNull(s) {
	if (s!=undefined && s!=null && s!="") {
		return true;
	} else {
		return false;
	}
}
