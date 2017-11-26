/*作者：jacksplwxy*/
/*类库兼容情况：IE9及以上*/
/*包含内容：选择器、DOM操作、样式操作、事件操作、动画、ajax、cookies*/
/*目的：
 ·学习： 写类库能更好的学习原生语法、 DOM、 效率等方面的知识
 ·分享：有需要的人可以使用和学习制作类库，尽量注释完整
 ·JQ太大：我们很多时候只用到它的选择器等少数功能，而jquery大部分代码在出来兼容和格式化参数
 ·原生JS麻烦,都是超长api：满屏的document.getElenment.....
 */
/*参考资料：
·慕课网JQ源码学习：http://www.imooc.com/learn/222
*/

"use strict"; //使用严格模式
//一个匿名自调函数，目的是不污染全局作用域或被污染，只暴露 $ 和 gecko 这 2 个变量给全局
//参数undefined是防止老IE下的关键词undefined被当变量覆盖
(function (window, undefined) {

    /******************************************选择器start***************************************/
    //定义gecko类，返回实例函数,函数也是对象，可以添加方法(如$.ajax())
    var gecko = function (selector) {
        //关键字new能让所有实例都能继承geckp.porototype中的方法，节约内存
        return new gecko.prototype.init(selector);
    };
    //gecko.prototype={};  //原型不要再定义为对象，因为原型自带constructor属性，该属性指向原型的构造对象。如果乱定义prototype，将丢失constructor，将导致实例对象找不到真正的构造函数
    //默认：gecko.prototype.constructor===gecko
    gecko.prototype.init = function (selector) {
        //instanceof运算符用来判断一个构造函数的prototype属性所指向的对象是否存在另外一个要检测对象的原型链上
        if (selector instanceof HTMLElement) { //说明selector是个标准的DOM元素，无需再进行选择器选择，只需继承gecko的类和实例方法即可
            var arr = [];
            arr.push(selector)
        } else if (selector instanceof HTMLCollection) { //有种情况是选择器选取了多个元素，这时的原型为HTMLCollection而不是HTMLElement
            var arr = selector;
        } else {
            var firstCode = selector.charAt(0),
                arr = [];
            if (firstCode === '#') {
                arr.push(document.getElementById(selector.slice(1)))
            } else if (firstCode === '.') {
                //document.getElementsByClassName( selector.slice( 1 ) )实际是HTMLCollection的类数组，而apply将类数组一个个添加到arr中，变成了数组
                arr.push.apply(arr, document.getElementsByClassName(selector.slice(1)))
            } else {
                arr.push.apply(arr, document.getElementsByTagName(selector));
            }
            //当前面选择器无法获取数据时，调用querySlectorAll,这个选择器的速度较慢(参考V8引擎源码分析)
            if (!arr[0]) {
                arr.push.apply(arr, document.querySelectorAll(selector));
            }
        }
        //this指向原型对象(gecko.prototype)，这样var gecko(实例对象)可以直接使用prototype中的方法，而不需要通过prototype(gecko.prototype.方法)
        for (var i = 0, len = arr.length; i < len; i++) {
            this[i] = arr[i];
        }
        //模拟数组的length,设置length属性为不可修改
        Object.defineProperty(this, 'length', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: arr.length
        })
        //将类数组arr返回给this(gecko.prototype)原型对象
        //这里不能return arr，而必须是this(原型对象)，因为new构造函数实例化时，如果构造函数含return关键词且return引用类型（数组，函数，对象），那么实例化对象就会返回该引用类型；但是实例化对象不会继承原型对象
        //return this;
    };
    //gecko原型中init的原型继承gecko的原型，即gecko.fn.init具有gecko类的所有属性和方法
    gecko.prototype.init.prototype = gecko.prototype;
    /******************************************选择器end***************************************/

    /***************定义内部方法start（内部方法仅在大匿名函数中使用，不开放给外部）*******************/
    //gecko只是类数组，用不了forEach，那就自己撸个each函数代替
    var each = function (obj, callback) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) { //不加hasOwenProperty，for in会将__proto__中的方法也一起遍历出来
                callback(i, obj[i]);
            }
        }
    }

    //access：统一管理参数形式，根据传入参数的不同，设置不同的状态，配合钩子机制调用不同的方法
    /*参数说明：
     elems：this（实例对象）
     fn：函数
     key：属性
     value：值
     chainable：是否可以链式调用，如果是get动作，为false，如果是set动作，为true
     emptyGet：如果jQuery没有选中到元素的返回值
     raw：value是否为函数，如果不是则raw为true
     */
    var access = function (elems, fn, key, value, chainable, emptyGet, raw) {
        var i = 0,
            length = elems.length,
            bulk = key == null; //根据key是否为null判断bulk转态，bulk在这里判断是否为文本操作方法(text、html),会做不同的处理
        //如果参数以{key:value,key:value}的形式传进来会对这个对象进行遍历，然后递归引用access方法进行设置
        if (gecko.type(key) === "object") { //如：$('.d').css({'color':'red','background':'yellow'})
            chainable = true; //可以进行链式调用，标识操作为set
            for (i in key) { //递归调用自身
                access(elems, fn, i, key[i], true, emptyGet, raw);
            }
            // Sets one value
            //此处判断文本操作(text(),html())设置字符串或者传入的是函数做处理
        } else if (value !== undefined) { //如果value有定义，如：$('.d').css('color','red')
            chainable = true; //标识操作为set
            if (gecko.type(value) != Function) { //如果value不是函数，如：$('.d').css('color','red')
                raw = true;
            }
            if (bulk) { //如果value为null
                // Bulk operations run against the entire set
                //如果value为文本在这里直接使用回调函数进行处理后下文不再做处理
                if (raw) { //如果value不是函数
                    fn.call(elems, value);
                    fn = null;
                    // ...except when executing function values
                    //如果value为函数会在这里针对性的包装后在下边的if进行处理
                } else { //如果value是函数
                    bulk = fn;
                    fn = function (elem, key, value) {
                        return bulk.call(gecko(elem), value);
                    };
                }
            }
            if (fn) { //根据fn是否为null
                for (; i < length; i++) {
                    fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
                }
            }
        }

        //如果chainable为true,即为设置属性（set），则返回elems本身，否则为get功能此时：假如使用的是text(),html()方法则直接返回文本值，否则的话返回第一个元素的参数值。其他情况直接返回undefined(比如元素未找到)
        return chainable ? elems : bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
    }
    /***************定义内部方法end*******************/

    /***************定义类方法start*******************/
    gecko.each = each;  //暴露each

    //----------------------------type start----------------------------//
    //类方法：tyope函数:用于定义对象的精确类型
    //钩子机制（hook）:就是策略模式，是用字典匹配，取代if判断，提升效率和可拓展性
    //原生的 typeof 方法并不能区分出一个变量它是 Array 、RegExp 等 object 类型，gecko为了扩展 typeof 的表达力，因此有了 type 方法
    //运用了钩子机制，判断类型前，将常见类型打表，先存于一个 Hash 表 typeTable 里边
    gecko.type = function (obj) {
        var typeTable = {}; // 用于预存储一张类型表用于 hook
        each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
            typeTable["[object " + name + "]"] = name.toLowerCase();
        });
        if (obj == null) {
            return String(obj);
        }
        // 这里因为 hook 的存在，省去了大量的 else if 判断
        return typeof obj === "object" || typeof obj === "function" ?
            // Object.prototype.toString.call(obj)可以使得 typeof obj 为 "object" 类型的得到更进一步的精确判断
            typeTable[Object.prototype.toString.call(obj)] || "object" :
            typeof obj;
    }
    //----------------------------type end----------------------------//

    //----------------------------cookie start----------------------------//
    //google浏览器禁用了本地网页的cookie操作，只能通过在线方式操作本地的cookie
    //添加cookie:
    // expiresSecond表示cookie有效时间，单位是秒
    //cookorDir:表示指定可访问cookie的路径。默认情况下，创建cookie的页面及其子目录中的其他页面也可以访问该cookie。'/'表示整个网站
    gecko.addCookie = function (name, value, expiressSecond, cookieDir) {
        //在cookie的名或值中不能使用分号、逗号、等号以及空格,如何来存储这些值呢？方法是用escape()函数进行编码，它能将一些特殊符号使用十六进制表示
        var cookieString = name + "=" + escape(value);
        //判断是否设置过期时间
        if (expiressSecond > 0) {
            var date = new Date();
            date.setTime(date.getTime() + expiressSecond * 1000);
            cookieString = cookieString + "; expires=" + date.toGMTString();
        }
        if (cookieDir) {
            cookieString = cookieString + ";path=" + cookieDir
        }
        document.cookie = cookieString;
    }
    //获取cookie:
    gecko.getCookie = function (name) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (arr[0] == name) {
                return unescape(arr[1]);
            }
        }
        return "";
    }
    //删除cookie:
    gecko.deleteCookie = function (name) {
        var date = new Date();
        date.setTime(date.getTime() - 10000); //将时间设置为过去时
        document.cookie = name + "=v; expires=" + date.toGMTString();
    }
    //----------------------------cookie end----------------------------//

    //----------------------------ajax start----------------------------//
    gecko.ajax = function (conf) {
        //必填参数
        var url = conf.url; //url参数
        //可选参数
        var async = conf.async; //同步 、异步
        var type = conf.type; //get、post
        var data = conf.data; //post的数据
        var dataType = conf.dataType; //预期服务器返回的数据类型
        var success = conf.success; //成功回调函数
        var error = conf.error; //失败回调函数
        //默认值
        async = async === false ? async : true; //默认 true
        type = type === "get" ? type : "post"; //默认 post
        data = data ? data : ""; //默认 空
        dataType = dataType ? dataType : "text"; //默认 text
        var xhr = new XMLHttpRequest(); //创建 XMLHttpRequest 对象
        if (type === "POST" || type === "post") {
            //加随机函数是防止浏览器缓存:浏览器为了提高用户访问同一页面的速度，会对页面数据进行缓存，当输入的参数没有变化的，浏览器认为是相同页面，直接调用缓存的信息。
            xhr.open("POST", url + "?ran=" + Math.random(), async);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            xhr.send(convertData(data));
        } else {
            xhr.open("GET", url + "?ran=" + Math.random(), async);
            xhr.send(null);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    success && success(xhr);
                } else {
                    alert('响应完成但有问题');
                }
            } else {
                alert('服务器响应异常') && error();
            }
        }
        function convertData(data) {
            if (typeof data === 'object') {
                var convertResult = "";
                for (var c in data) {
                    convertResult += c + "=" + data[c] + "&";
                }
                convertResult = convertResult.substring(0, convertResult.length - 1)
                return convertResult;
            } else {
                return data;
            }
        }
    }
    //----------------------------ajax end----------------------------//

    //----------------------------throttle start----------------------------//
    //函数节流：解决window.onresize、mousemove、keypress、连续click、scroll滚动事件、上传进度等，操作频繁导致性能消耗过高问题
    //原理：当连续触发事件时，节流函数会先判断之前的延时是否执行完，没有的话不会将新的事件压入任务队列中
    gecko.throttle = function (fn, interval) {
        var _self = fn,   //保存需要被延迟执行的函数引用
            timer,  //定时器
            firstTime = true; //是否是第一次调用
        return function () {
            var args = arguments,
                _me = this;
            if (firstTime) {  //如果是第一次调用，，则不需要延迟执行
                _self.apply(_me, args);
                return firstTime = false;
            }
            if (timer) {  //如果定时器还在，说明前一次延迟执行还没有完成
                return false;
            }
            timer = setTimeout(function () {
                clearTimeout(timer);
                timer = null;
                _self.apply(_me, args);
            }, interval || 500);    //默认延迟500ms执行
        }
    }
    /*
    应用实例：
    window.onresize = throttle(function () {
        console.log(1);
    }, 500);
    */
    //----------------------------throttle end----------------------------//

    //----------------------------debounce start----------------------------//
    //函数防抖：例如搜索框匹配keypress事件时，连续输入将多次触发搜索，显然没必要
    //原理：就是让某个函数在上一次执行后，满足等待某个时间内不再触发此函数后再执行，而在这个等待时间内再次触发此函数，等待时间会重新计算。
    //参数function是需要进行函数防抖的函数；参数wait则是需要等待的时间，单位为毫秒；
    //immediate参数如果为true，则debounce函数会在调用时立刻执行一次function，不需要等到wait这个时间后。而为false时，需等时间完后才执行一次。
    gecko.debounce = function (func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        var later = function () {
            var last = new Date().getTime() - timestamp;
            if (last < wait && last >= 0) { //最后一次点击与倒数第二次的时间差与设定的时差比较
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null; //如果>设定时差则将timeout定为false
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                }
            }
        };
        return function () {
            context = this;
            args = arguments;
            timestamp = new Date().getTime();   //timestamp更新为最新点击的时间
            var callNow = immediate && !timeout;    //timeout有两种情况为false:第一次运行时和func再次调用超过了wait时间
            if (!timeout) { //因为timeout在闭包中，第2、3次执行debounce时，timeout的状态会一直保存
                timeout = setTimeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
            return result;
        };
    };
    /*
    应用实例：
        document.getElementById('dianwo').onclick = gecko.debounce(function () {
            console.log('hello world!') 
        }, 1000, false)
    */
    //----------------------------debounce end----------------------------//
    //----------------------------图片懒加载 end----------------------------//
    gecko.imgLazyLoad = (function () {
        var imgs = document.body.querySelectorAll('img[data-src]'),
            H = window.innerHeight;  //浏览器视窗高度
        function getTop(e) {	//图片距页面顶部距离
            var T = e.offsetTop;
            while (e = e.offsetParent) {
                T += e.offsetTop
            }
            return T
        }
        return function () {
            var S = document.documentElement.scrollTop || document.body.scrollTop;   //滚动条滚过高度
            [].forEach.call(imgs, function (img) {
                if (!img.getAttribute('data-src')) {
                    return
                }  //已经替换过的跳过
                if (H + S > getTop(img)) {
                    img.src = img.getAttribute("data-src");//将data-src中的数据赋值给src
                    img.removeAttribute("data-src");
                }
            });
            [].every.call(imgs, function (img) {
                return !img.getAttribute('data-src')
            }) && (window.removeEventListener("scroll", lazyload, false));   //完成所有替换后注销事件
        }
    })()
	/*
	应用实例：
		<img src="" data-src="1.jpg" alt="图片">
		window.onload = function () {   //DOM加载好后，在第一屏的图片进行加载
			gecko.imgLazyLoad();
		}
		window.onscroll = gecko.throttle(function () {  //利用函数节流优化性能
			gecko.imgLazyLoad();
		}, 100)
	*/
    //----------------------------图片懒加载 end----------------------------//

    /***************定义类方法end*******************/

    /***************定义实例方法start*******************/
    gecko.prototype.html = function (content) { //获取标签html(含tag和text)
        var that = this
        var htmlHook = { //采用钩子机制替换if else，效率快，易扩展
            0: function () {
                return that[0].innerHTML
            },
            1: function () {
                each(that, function (i, item) {
                    item.innerHTML = content
                })
                return that; //将gecko实例返回回去，实现链式调用
            }
        }
        return htmlHook[arguments.length]();
    }

    gecko.prototype.text = function (content) { //获取标签text内容
        var that = this
        var textHook = {
            0: function () {
                return that[0].textContent
            },
            1: function () {
                each(that, function (i, item) {
                    item.textContent = content
                })
                return that; //将gecko实例返回回去，实现链式调用
            }
        }
        return textHook[arguments.length]();
    }

    gecko.prototype.val = function (value) { //获取标签的值
        var that = this
        var valHook = {
            0: function () {
                return that[0].getAttribute("value")
            },
            1: function () {
                each(that, function (i, item) {
                    item.setAttribute("value", value);
                })
                return that; //将gecko实例返回回去，实现链式调用
            }
        }
        return valHook[arguments.length]();
    }

    gecko.prototype.prop = function (name, value) { //prop是设置property，attr设置attribute
        var that = this
        var propHook = {
            1: function () {
                return that[0][name] //that[0].name，否则会从attribute中获取name的值
            },
            2: function () {
                each(that, function (i, item) {
                    /*中括号运算符总是能代替点运算符。但点运算符却不一定能全部代替中括号运算符。
                     中括号运算符可以用字符串变量的内容作为属性名。点运算符不能。
                     中括号运算符可以用纯数字为属性名。点运算符不能。
                     中括号运算符可以用js的关键字和保留字作为属性名。点运算符不能。*/
                    item[name] = value; //这里不能用item.name，否则name会被当成一个键名写到attribute中
                })
                return that; //将gecko实例返回回去，实现链式调用
            }
        }
        return propHook[arguments.length]();
    }

    gecko.prototype.attr = function (name, value) { //prop是设置property，attr设置attribute
        var that = this
        var attrHook = { //采用钩子机制替换if else，效率快，易扩展
            1: function () {
                return that[0].getAttribute(name)
            },
            2: function () {
                each(that, function (i, item) {
                    item.setAttribute(name, value);
                })
                return that; //将gecko实例返回回去，实现链式调用
            }
        }
        return attrHook[arguments.length]();
    }


    /* 事件开始 */
    //只实现on的常用功能:事件委托
    //并非所有的事件都能冒泡，如load, change, submit, focus, blur
    //boolean=false，ES6语法，设置参数的默认值
    gecko.prototype.on = function (type, posteritySelector, handler, boolean = false) {
        if (typeof posteritySelector !== "string") {
            this[0].addEventListener(arguments[0], arguments[1], arguments[2])
        } else {
            //此处委托代码的实现经验：难度主要是将回调handler进行包装处理。步骤是先用实例模拟，再将小功能一步一步实现，最后再抽象出来
            let newHandler = (() => {
                let thisName = this[0].querySelectorAll(posteritySelector)[0].nodeName;
                let getNode = (node) => {
                    if (node.nodeName === thisName) {
                        return node;
                    } else {
                        if (node.parentNode) { //判断是不是点在thisName的祖宗节点上
                            return getNode(node.parentNode); //迭代实现向上循环匹配节点名称,直到找到正确的节点名称
                        } else {
                            return null
                        }
                    }
                }
                return (e) => {
                    let that = getNode(e.target)
                    if (that) { //因为如果点到thisName的祖宗节点上，that将为Null，操作没有节点属性的null将在控制台报错
                        handler.call(that, e) //将handler里的this指向点击的那个node
                    } else {
                        return false;
                    }
                }
            })()
            this[0].addEventListener(type, newHandler, boolean)
        }
    }
    /* 事件结束 */

    /* 动画开始 */
    /*gecko.prototype.animate = function animate(obj, css, interval, speedFactor, func) {
        clearInterval(obj.timer);

        function getCss(obj, prop) {
            if (obj.currentStyle)
                return obj.currentStyle[prop]; // ie 
            else
                return document.defaultView.getComputedStyle(obj, null)[prop]; // 非ie 
        }
        obj.timer = setInterval(function () {
            var flag = true;
            for (var prop in css) {
                var cur = 0;
                if (prop == "opacity")
                    cur = Math.round(parseFloat(getStyle(obj, prop)) * 100);
                else
                    cur = parseInt(getStyle(obj, prop));
                var speed = (css[prop] - cur) * speedFactor;
                speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);
                if (cur != css[prop])
                    flag = false;
                if (prop == "opacity") {
                    obj.style.filter = "alpha(opacity : '+(cur + speed)+' )";
                    obj.style.opacity = (cur + speed) / 100;
                } else
                    obj.style[prop] = cur + speed + "px";
            }
            if (flag) {
                clearInterval(obj.timer);
                if (func)
                    func();
            }
        }, interval);
    }*/
    /* 动画结束 */

    /***************定义实例方法end*******************/

    //将gecko和$暴露到全局变量中
    window.gecko = window.$ = gecko;
})(window)