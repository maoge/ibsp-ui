var Component = window.Component || {};


(function(Component) {
	
	function Alert(type, content) {
		var options = {};
		
		//这里可以扩展皮肤等
		switch(type) {
		case "error": 
			options.icon = 2;
			options.title = "错误";
			break;
		case "warn":
			options.icon = 0;
			options.title = "提示";
			break;
		case "success":
			options.icon = 1;
			options.title = "提示";
			break;
		}
		
    	var index = layer.alert(content, options);
    	return index;
	}
	
	Component.Alert = Alert;

})(Component);
