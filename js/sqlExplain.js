var id = "73f9e0f6-8f7a-65b6-a9cb-ed1a3f007639";
var myChart = null;

var tidbStyle = {};
var tidb = {};
tidb.color = '#b0c4de';
tidb.borderColor = '#0000ff';
tidb.borderWidth = 3;
tidbStyle.normal = tidb;
tidbStyle.emphasis = tidb;

var tikvStyle = {};
var tikv = {};
tikv.color = '#b0c4de';
tikv.borderColor = '#ff7f00';
tikv.borderWidth = 3;
tikvStyle.normal = tikv;
tikvStyle.emphasis = tikv;

var largeSize = $('#contextBody').height()-$('#button-group').height()-5;
var smallSize = $('#contextBody').height()-$('#top-div').height()-$('#button-group').height()-5;

$(function() {
	$('#explainGraph').css('min-height', smallSize);
});

function sqlExplain() {
	var loading = $('#loadingDiv');
	data = {};
	data.SERV_ID = id;
	data.SQL_STR = $('#S_SQL_STR').val();
	data.SCHEMA_NAME = $('#S_SCHEMA_NAME').val();
	data.USER_NAME = $('#S_USER_NAME').val();
	data.USER_PWD = $('#S_USER_PWD').val();
	
	$.ajax({
		url: rootUrl+"tidbsvr/sqlExplainService",
		data: data,
		async: true,
		type: "post",
		dataType: "json",
		beforeSend: function() {
			loading.show();
		},
		complete: function() {
			loading.hide();
		},
		error: function(xhr) {
			Component.Alert("error", "获取SQL执行计划失败！"+xhr.status+":"+xhr.statusText);
		},
		success: function(result) {
			if (result.RET_CODE == 0) {
				var data = result.RET_INFO;
				if (myChart!=null) {
					myChart.dispose();
				}
			    myChart = echarts.init(document.getElementById('explainGraph'));
			    forEachNodeStyle(data);
			    
			    myChart.setOption(option = {
				    backgroundColor: '#fff',
			    	tooltip: {
			    		trigger: 'item',
			    		triggerOn: 'mousemove',
			    		formatter: function(a) {
			    			return a.data.value;
			    		}
			    	},
			    	series: [{
			    		type: 'tree',
			    		data: [data],

			    		top: '1%',
			    		left: '7%',
			    		bottom: '1%',
			    		right: '20%',
			    		symbolSize: 12,
			    		initialTreeDepth: -1,
			    		
			    		label: {
			    			normal: {
			    				position: 'bottom',
			    				fontSize: 12
			    			}
			    		},

			    		animationDuration: 550,
			    		animationDurationUpdate: 750
			    	}]
			    });
			} else {
				Component.Alert("error", "获取SQL执行计划失败！"+result.RET_INFO);
			}
		}
	});
}

function forEachNodeStyle(element) {
	if (element.type=="root") {
		element.itemStyle = tidbStyle;
	} else {
		element.itemStyle = tikvStyle;
	}
	delete element.type;
	
	if (element.children) {
		element.children.forEach(function(child, index) {
			forEachNodeStyle(child);
		});
	}
}

function toggleTopDiv() {
	if ($('#top-div').css("display")=="none") {
		$('#top-div').css("display", "");
		$('#button_explain').css("display", "");
		$('#explainGraph').css('min-height', smallSize);
		$('#button_toggle').attr("title", "收起");
		$('#button_toggle').attr("src", "./img/less.png");
		myChart.resize();

	} else {
		$('#top-div').css("display", "none");
		$('#button_explain').css("display", "none");
		$('#explainGraph').css('min-height', largeSize);
		$('#button_toggle').attr("title", "展开");
		$('#button_toggle').attr("src", "./img/more.png");
		myChart.resize();
	}
}
