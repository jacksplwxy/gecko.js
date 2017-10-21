<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title></title>
        <script>
            // 构造函数
            var YY = function ( selector ) {
                return new YY.fn.init( selector );//返回init方法的一个实例对象，一个构造函数的原型属性上的函数init的原型链和YY原型链是不同的
            };
            //原型继承分别为
            //YY->YY.prototype->object.prototype->null
            //init->init.prototype->object.prototype->null
            // 核心原型
            YY.fn = YY.prototype = {
                constructor: YY,
                selector: null,
                init: function ( selector ) {
                    // 字符串: 选择器, html
                    if ( typeof selector == 'string' ) {
                        if ( selector.charAt( 0 ) === '<' ) {
                            this.elements = parseHTML( selector );
                        } else {
                            this.elements = select( selector );
                        }
                    }
                    this.selector = selector;//可以判断出，只要有这个属性的对象，就是YY对象
                }
            };
            YY.fn.init.prototype = YY.prototype;

            // 可扩展
            YY.extend = YY.fn.extend = function ( obj ) {
                // 将 obj 的成员加到 this 上
                var k;
                for ( k in obj ) {
                    this[ k ] = obj[ k ];
                }
            };

            //选择器方法，暂时只考虑基本选择器
            var select = function ( selector ) {
                var first = selector.charAt( 0 ), arr = [];
                if ( first === '#' ) {
                    arr.push.call( arr, document.getElementById( selector.slice( 1 ) ) )
                } else if ( first === '.' ) {
                    arr.push.apply( arr, document.getElementsByClassName( selector.slice( 1 ) ) )
                } else {
                    arr.push.apply( arr, document.getElementsByTagName( selector ) );
                }
                return arr;
            };

            var parseHTML = function ( html ) {
                var div = document.createElement( 'div' ),
                    arr = [], i;
                div.innerHTML = html;
                for ( i = 0; i < div.childNodes.length; i++ ) {
                    arr.push( div.childNodes[ i ] );
                }
                return arr;
            };

            // 基本的工具方法
            YY.extend({
                each: function ( arr, fn ) {
                    var i, l = arr.length,
                        isArray = YY.isLikeArray( arr );//先判断是否为数组
                    if ( isArray ) {
                        // 数组
                        for ( i = 0; i < l; i++ ) {
                            if ( fn.call( arr[ i ], i, arr[ i ] ) === false ) {
                                break;
                            }
                        }
                    } else {
                        // 对象
                        for ( i in arr ) {
                            if ( fn.call( arr[ i ], i, arr[ i ] ) === false ) {
                                break;
                            }
                        }
                    }
                    return arr;
                }
            });

            // 判断类型的方法
            YY.extend({
                isFunction: function ( obj ) {
                    return typeof obj === 'function';//判断是否为function
                },
                isString: function ( obj ) {
                    return typeof obj === 'string';//判断是否为字符串
                },
                isLikeArray: function ( obj ) {
                    return obj && obj.length && obj.length >= 0;//判断是否为数组
                },
                isYY: function ( obj ) {
                    return !!obj.selector;//判断是否为YY，给其原型属性加个属性，默认为空
                },
                isDOM: function ( obj ) {
                    return !!obj.nodeType;
                }
            });


            // 基本的 DOM 操作，此处假设selector是DOM对象
            YY.fn.extend({
                appendTo: function ( selector ) {
                    // 将 this.elements 加入到 selector 中
                    YY.each( this.elements, function () {
                        selector.appendChild( this );
                    } );
                }
            });


        </script>

        <script type="text/javascript">
			console.log(YY())
            onload = function () {
                YY( '<div>1</div><div>2</div><div>3</div><div>4</div>' )
                    .appendTo( document.body );
            }
        </script>
    </head>
    <body>
		<div class='d'>
			我是猪
			<p>我是p1</p>
			<p>我是p2</p>
			<p>我是p3</p>
			
		</div>
		<div class='d'>我是人</div>
		<div class='d'>我是妖</div>
		<p id='p1'>啊哈哈哈</p>
    </body>
</html>