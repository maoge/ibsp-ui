$(function() {
	$(".content").css("min-height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("height", document.documentElement.clientHeight-$(".navbar").height()-10);
	$(".content").css("overflow", "auto");
	
	$(".sidebar-nav").find("li").click(function(){
		var _menu = $(this).attr("value");
		linkmenu(_menu);
	});
});

function linkmenu(_menu){
	if(_menu=="TiDB_manage"){
		//Vbroker实时信息
		$(".content").load("tidbManage.html",function(){});
	}else if(_menu=="SQL_explain"){
		//告警的实时信息
		$(".content").load("sqlExplain.html",function(){})
	}
}
