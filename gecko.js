/*作者：jacksplwxy*/
/*类库兼容情况：IE9及以上*/
/*包含内容：选择器、DOM操作、样式操作、事件操作、动画、ajax、cookies*/
/*写类库目的：
 ·学习： 写类库能更好的学习原生JS语法、 浏览器DOM、 JS效率等方面的知识
 ·JQ太大：我们很多时候只用到它的选择器等少数功能
 ·原生JS麻烦,都是超长api：满屏的document.getElenment.....
 ·性能低：JQ本质是包装DOM对象的类，JQ功能多对象大，兼容的问题多，各种包含原生JS的判断和语法糖
 ·分享：有需要的人可以使用和学习制作类库，尽量注释完整
 */
/*参考资料：
·慕课网JQ源码学习：http://www.imooc.com/learn/222
·网易云课堂：http://study.163.com/course/courseMain.htm?courseId=465001
*/

"use strict"; //使用严格模式

//一个匿名自调函数，目的是不污染全局作用域，只暴露 $ 和 gecko 这 2 个变量给全局
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
        var firstCode = selector.charAt(0),
            arr = [];
        if (firstCode === '#') {
            //call与apply仅参数形式不一样
            arr.push.call(arr, document.getElementById(selector.slice(1)))
        } else if (firstCode === '.') {
            //document.getElementsByClassName( selector.slice( 1 ) )实际是HTMLCollection的类数组，而apply将类数组一个个添加到arr中，变成了数组
            arr.push.apply(arr, document.getElementsByClassName(selector.slice(1)))
        } else {
            arr.push.apply(arr, document.getElementsByTagName(selector));
        }
        //当前面选择器无法获取数据时，调用querySlectorAll,这个选择器的速度较慢(参考V8引擎源码)
        if (!arr[0]) {
            arr.push.apply(arr, document.querySelectorAll(selector));
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
    gecko.each = each;

    //用钩子机制精确数据类型:
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
                return that;    //将gecko实例返回回去，实现链式调用
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
                return that;    //将gecko实例返回回去，实现链式调用
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
                return that;    //将gecko实例返回回去，实现链式调用
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
                return that;    //将gecko实例返回回去，实现链式调用
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
                return that;    //将gecko实例返回回去，实现链式调用
            }
        }
        return attrHook[arguments.length]();
    }

    /* 动画开始 */
    gecko.prototype.animate = function animate(obj, css, interval, speedFactor, func) {
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
    }
    /* 动画结束 */

    /* 事件开始 */
    //并非所有的事件都能冒泡，如load, change, submit, focus, blur
    //boolean=false，ES6语法，设置参数的默认值
    /*gecko.prototype.on = function (type, posteritySelector, handler, boolean = false) {
        const that = this[0];
        //let type = 'on' + type;
        console.log('that', that)
        let posterity = that.querySelectorAll(posteritySelector);
        console.log('posterity', posterity[0])
        //bind将handler中this指向posterity，bind与call不同，不会直接执行
        that.addEventListener(type, handler.bind(posterity[0]), boolean)
    }*/
    /* 事件结束 */

    /***************定义实例方法end*******************/

    //将gecko和$暴露到全局变量中
    window.gecko = window.$ = gecko;
})(window)
