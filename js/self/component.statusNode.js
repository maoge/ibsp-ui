var Component = window.Component || {};


(function(Component) {
	
	/**
	 *  经过封装的node，在图上有各种标志代表实例的各种状态
	 */
	function StatusNode() {
		StatusNode.prototype.initialize.apply(this, null);
		this.beginFlash = 1;
		this.graduallyAdd = true ;

		this.paintImage = function(canvas) {
			var alpha = canvas.globalAlpha;
			canvas.globalAlpha = this.alpha;

			canvas.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);

			canvas.globalAlpha = 0.9;
			if (this.status == "deployed") {
				canvas.drawImage(this.statusIcons.deployed, 0, 0, this.width / 2, this.height / 2);
			} else if (this.status == "saved") {
				canvas.drawImage(this.statusIcons.saved, 0, 0, this.width / 2, this.height / 2);
			} else if (this.status == "waitFlash") {
				this.flash(canvas);
				canvas.drawImage(this.statusIcons.deployed, 0, 0, this.width / 2, this.height / 2);
			}
			canvas.globalAlpha = alpha;
		};
		//闪烁的方法
		this.flash = function(canvas){
			if(this.beginFlash == 20){
				this.graduallyAdd = false;
			}
			if(this.beginFlash == 1){
				this.graduallyAdd = true;
			}
			canvas.globalAlpha = ((this.graduallyAdd ? this.beginFlash ++ : this.beginFlash --)  % 20) / 20;
		};
	}
	
	StatusNode.prototype = new JTopo.Node;
	Component.StatusNode = StatusNode;

})(Component);
