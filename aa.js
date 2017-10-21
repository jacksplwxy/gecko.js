/*
 jQuery源码解析系列：
·http://blog.csdn.net/vbdfforever/article/details/50716656
·http://blog.csdn.net/vbdfforever/article/details/50986673
·http://blog.csdn.net/vbdfforever/article/details/51010698
·http://blog.csdn.net/vbdfforever/article/details/51059440
·http://blog.csdn.net/vbdfforever/article/details/51121012
*/

(function() {
	




	//----------------------------私有属性方法 start----------------------------//
	var _prefixName = "jsLib";//前缀名

	var _curDomMark = "data-jsLib-curDom-mark";//传入this时标记当前dom

	var _isString = function(str){//是否 string 类型
		if(Object.prototype.toString.call(str) === "[object String]"){
			return true;
		}
		return false;
	}

	var _createDF = function(str){//创建文档碎片节点
		var div = document.createElement("div");
		div.innerHTML = str;
		var newNode = div.childNodes;
		var fragment = document.createDocumentFragment();
		for(var i=0; i<newNode.length; i++){
			fragment.appendChild(newNode[i].cloneNode(true));
		}
		return fragment;
	}

	var _autoCenter = function($obj){//自动居中
		var bW = $.browser.width();
		var bH = $.browser.height();
		var boxW = $obj.width();
		var boxH = $obj.height();
		$obj.css({
			"top": (bH - boxH) / 2 + "px",
			"left": (bW - boxW) / 2 + "px"
		});
	}
	//----------------------------私有属性方法 end----------------------------//





	//----------------------------选择器 start----------------------------//
	var $ = function(selector){ return new $.prototype.init(selector); }

	$.prototype.init = function(selector){
		if(_isString(selector)){//字符串
			var nodeList = document.querySelectorAll(selector);//借用浏览器提供的选择器
			this.length = nodeList.length;
			for(var i=0; i<this.length; i++){
				this[i] = nodeList[i];
			}
		}
		else{//传入 this 时返回当前 dom
			var allNodeArr = document.getElementsByTagName("*");//获取所有dom
			for(var i=0; i<allNodeArr.length; i++){
				allNodeArr[i].removeAttribute(_curDomMark);//移除标记
			}
			selector.setAttribute(_curDomMark, true);//设置当前的dom的标记
			this.length = 1;
			this[0] = selector;
		}
		return this;
	}
	//----------------------------选择器 end----------------------------//





	//----------------------------$.prototype.init 的拓展 start----------------------------//
	$.prototype.init.prototype = $.prototype;

	//遍历
	$.prototype.each = function(callback, args){
		var length = this.length, i = 0;
		if(args){
			while(i < length){
				callback.call(this[i], args);
				i += 1;
			}
		}
		else{
			while(i < length){
				callback.call(this[i]);
				i += 1;
			}
		}
		return this;
	}

	//绑定事件
	$.prototype.on = function(eve, handler){
		if(eve && handler){
			this.each(function(){
				this.addEventListener(eve, handler, false);
			});
			return this;
		}
	}

	//设置、获取html
	$.prototype.html = function(value){
		if(_isString(value)){//设置
			this.each(function(){
				this.innerHTML = value;
			});
			return this;
		}
		else{//获取
			if(this.length){
				return this[0].innerHTML;
			}
		}
	}

	//显示
	$.prototype.show = function(){
		this.each(function(){
			this.style.display = "block";
		});
		return this;
	}

	//隐藏
	$.prototype.hide = function(){
		this.each(function(){
			this.style.display = "none";
		});
		return this;
	}

	//获取 index 目前只支持类的index获取
	$.prototype.index = function(){
		if(this.length){
			var nodeList = document.querySelectorAll("." + this[0].getAttribute("class"));
			for (var i=0; i<nodeList.length; i++){
				if(nodeList[i].getAttribute(_curDomMark)){
					return i;
				}
			}
		}
	}

	//css
	$.prototype.css = function(dict){
		this.each(function(){
			for(var key in dict){
				this.style[key] = dict[key];
			}
		});
		return this;
	}

	//设置、获取相关属性
	$.prototype.attr = function(value){
		if(_isString(value)){//获取
			if(this.length){
				return this[0].getAttribute(value);
			}
		}
		else{//设置
			this.each(function(){
				for(var key in value){
					this.setAttribute(key, value[key]);
				}
			});
			return this;
		}
	}

	//在每个匹配的元素之前插入内容
	$.prototype.before = function(str){
		if(_isString(str)){
			this.each(function(){
				this.parentNode.insertBefore(_createDF(str), this);//当前dom前面插入
			});
			return this;
		}
	}

	//在每个匹配的元素之后插入内容
	$.prototype.after = function(str){
		if(_isString(str)){
			this.each(function(){
				var pNode = this.parentNode;
				if(pNode.lastChild === this){//如果父节点的最后一个节点是指定节点,则直接添加
					pNode.appendChild(_createDF(str));
				}
				else{//如果不是,则在指定节点的下一个节点前面插入
					pNode.insertBefore(_createDF(str), this.nextSibling);//当前dom后面插入
				}
			});
			return this;
		}
	}

	//向每个匹配的元素内部最前面插入内容
	$.prototype.prepend = function(str){
		if(_isString(str)){
			this.each(function(){
				this.insertBefore(_createDF(str), this.firstChild);
			});
			return this;
		}
	}

	//向每个匹配的元素内部最后面插入内容
	$.prototype.append = function(str){
		if(_isString(str)){
			this.each(function(){
				this.appendChild(_createDF(str));
			});
			return this;
		}
	}

	//删除节点
	$.prototype.remove = function(){
		this.each(function(){
			this.parentNode.removeChild(this);
		});
	}

	//获取 Dom 位置尺寸属性
	$.prototype.top = function(){
		if(this.length){
			return this[0].getBoundingClientRect().top;
		}
	}
	$.prototype.bottom = function(){
		if(this.length){
			var box = this[0].getBoundingClientRect();
			return $.browser.height() - box.top - this.height();
		}
	}
	$.prototype.left = function(){
		if(this.length){
			return this[0].getBoundingClientRect().left;
		}
	}
	$.prototype.right = function(){
		if(this.length){
			var box = this[0].getBoundingClientRect();
			return $.browser.width() - box.left - this.width();
		}
	}
	$.prototype.width = function(){
		if(this.length){
			var box = this[0].getBoundingClientRect();
			return box.right - box.left;
		}
	}
	$.prototype.height = function(){
		if(this.length){
			var box = this[0].getBoundingClientRect();
			return box.bottom - box.top;
		}
	}

	//阻止事件冒泡
	$.prototype.stopPropagation = function(event){
        var e = event || window.event;
        if (e && e.stopPropagation){
            e.stopPropagation();//W3C阻止冒泡方法
        }
        else{
            e.cancelBubble = true;//IE阻止冒泡方法
        }
    }
	//----------------------------$.prototype.init 的拓展 end----------------------------//





	//----------------------------浏览器 start----------------------------//
	$.browser = function(){ }
	$.browser.width = function(){ return window.innerWidth; }
	$.browser.height = function(){ return window.innerHeight; }
	$.browser.info = function(){ return navigator.userAgent; }
	//----------------------------浏览器 end----------------------------//





	//----------------------------初始化事件 start----------------------------//
	$.ready = function(handler){
		document.addEventListener("DOMContentLoaded", function () {
			document.removeEventListener("DOMContentLoaded", arguments.callee, false);
			handler && handler();
		}, false);
	}
	//----------------------------初始化事件 end----------------------------//





	//----------------------------ajax start----------------------------//
	$.ajax = function(conf){
		//必填参数
		var url = conf.url;//url参数

		//可选参数
		var async = conf.async;//同步 、异步
		var type = conf.type;//get、post
		var data = conf.data;//post的数据
		var dataType = conf.dataType;//预期服务器返回的数据类型
		var success = conf.success;//成功回调函数
		var error = conf.error;//失败回调函数

		//默认值
		async = async === false ? async : true;//默认 true
		type = type === "get" ? type : "post";//默认 post
		data = data ? data : "";//默认 空
		dataType = dataType ? dataType : "text";//默认 text
		
		var xhr = new XMLHttpRequest();//创建 XMLHttpRequest 对象

		if(async === true){//异步返回结果
			xhr.onreadystatechange = function (){
				if (xhr.readyState === 4){//响应成功
					if(xhr.status === 200){
						success && success(xhr.responseText);
					}
					else{
						error && error();
					}
				}
			}
		}

		//发送数据
		if(type === "POST" || type === "post"){
			xhr.open(type, url + "?ran=" + Math.random(), async);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.send(data);
		}
		else if(type === "GET" || type === "get"){
			xhr.open(type, url + "?ran=" + Math.random() + data, async);
			xhr.send();
		}

		if(async === false){//同步返回结果
			if (xhr.readyState === 4){//响应成功
				if(xhr.status === 200){
					success && success(xhr.responseText);
				}
				else{
					error && error();
				}
			}
		}
	}
	//----------------------------ajax end----------------------------//





	//----------------------------layer start----------------------------//
	$.layer = function(){ }

	$.layer.baseHtmlCreate = function(conf){

		var title = "", html = "";
		if(conf){
			title = conf.title ? conf.title : "注意";
			html = conf.html ? conf.html : "";

			$.layer.hide();
			var str = [];
			str.push("<div class='" + _prefixName + "_layer'>")
			str.push("<div class='" + _prefixName + "_mask'></div>");
			str.push("<div class='" + _prefixName + "_box'>");
			str.push("<div class='" + _prefixName + "_head'>");
			str.push("<div class='" + _prefixName + "_title'>"); str.push(title); str.push("</div>");
			str.push("<div class='" + _prefixName + "_btnClose'>"); str.push("<a href='javascript:;'>X</a>"); str.push("</div>");
			str.push("</div>");		
			str.push("<div class='" + _prefixName + "_content'>");
			str.push(html);
			str.push("</div>");
			if(conf.type){
				str.push("<div class='" + _prefixName + "_foot'>");
				if(conf.type === "alert"){
					str.push("<div style='width:100%;border-style:none;' class='" + _prefixName + "_btnEnter'>");
					str.push("<a href='javascript:;'>确定</a>");
					str.push("</div>");
				}
				if(conf.type === "confirm"){
					str.push("<div class='" + _prefixName + "_btnCancel'>"); str.push("<a href='javascript:;'>取消</a>"); str.push("</div>");
					str.push("<div class='" + _prefixName + "_btnEnter'>"); str.push("<a href='javascript:;'>确定</a>"); str.push("</div>");
				}
				str.push("</div>");
			}
			str.push("</div>");
			str.push("</div>");
			$("body").append(str.join(""));
			$("." + _prefixName + "_layer").show();
			_autoCenter($("." + _prefixName + "_box"));//自动居中

			window.addEventListener("resize", function(){//浏览器缩放自动调整位置
				_autoCenter($("." + _prefixName + "_box"));
			});
			$("." + _prefixName + "_layer").on("click", function(){//点击遮盖层关闭
				$.layer.hide();
			});
			$("." + _prefixName + "_btnClose > a").on("click", function(){
				if(conf.close){
					conf.close();
				}
				else{
					$.layer.hide();
				}
			});
			$("." + _prefixName + "_btnCancel > a").on("click", function(){
				conf.cancel && conf.cancel();
			});
			$("." + _prefixName + "_btnEnter > a").on("click", function(){
				conf.enter && conf.enter();
			});
			$("." + _prefixName + "_box").on("click", function(){//阻止冒泡
				$(this).stopPropagation();
			});
		}
	}

	$.layer.hide = function(){
		$("." + _prefixName + "_layer").remove();
	}

	$.layer.show = function(conf){
		var title = "", html = "";
		title = conf.title ? conf.title : "";
		html = conf.html ? conf.html : "";
		$.layer.baseHtmlCreate({
			title: title,
			html: html,
			close: function(){
				$.layer.hide();
			}
		});
	}

	$.layer.alert = function(conf){
		var title = "", html = "";
		title = conf.title ? conf.title : "";
		html = conf.html ? conf.html : "";
		$.layer.baseHtmlCreate({
			type: "alert",
			title: title,
			html: html,
			close: function(){
				$.layer.hide();
			},
			enter: function(){
				$.layer.hide();
			}
		});
	}

	$.layer.confirm = function(conf){
		var title = "", html = "";
		title = conf.title ? conf.title : "";
		html = conf.html ? conf.html : "";
		$.layer.baseHtmlCreate({
			type: "confirm",
			title: title,
			html: html,
			close: function(){
				$.layer.hide();
			},
			cancel: function(){
				$.layer.hide();
			},
			enter: function(){
				conf.enter && conf.enter();
			}
		});
	}
	//----------------------------layer start----------------------------//





	window.jsLib = window.$ = $; //对外提供接口
})();