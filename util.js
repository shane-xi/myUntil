//1.解决ios下  document.title无法修改问题
function seTitle(title) {
        document.title = title;
        if (/ip(hone|od|ad)/i.test(navigator.userAgent)) {
            var i = document.createElement('iframe');
            i.src = '/favicon.ico';
            i.style.display = 'none';
            i.onload = function() {
                setTimeout(function(){
                    i.remove();
                }, 9)
            }
            document.body.appendChild(i);
        }
    }
//2.获取页面参数
function getParams() {
    var params = {}
    var a = location.search.substring(1).split('&');
    a.forEach(function (item,i){
        var key = decodeURIComponent(item.split('=')[0]);
        var value = decodeURIComponent(item.split('=')[1]);
        params[key] = value;
    });
    return params;
}
//3.前端路由
function FrontRouter() {
        this.routes = {};
        var that = this;
        window.addEventListener('hashchange', function(){
            that.emit();
        });
    }
    FrontRouter.prototype.route = function(path, callback) {
        this.route[path] = callback || function() {}
    };
    FrontRouter.prototype.emit = function() {
        var path = location.hash.slice(1);
        typeof this.route[path] === "function" && this.route[path]();
    }
var router = new FrontRouter();

//4.new函数的实现
var Person = function (name) {
    this.name = name;
    console.log(this)
}
function New(func) {
    var res = {};
    res.__proto__ = func.prototype;
    var args = [].slice.call(arguments,1);
    var ret = func.apply(res,args); //执行构造函数，this指向实例化的新对象，返回结果指向ret;
    if ( typeof ret == 'object' || typeof ret == 'function' && typeof ret !== 'null') {
        return ret;
    }
    return res;
}
//5.浮点数相加
//先做一步去除','
function floatAdd(a,b) {
    var arg1 = typeof a === 'string' ? a.replace(',','') : a;
    var arg2 = typeof b === 'string' ? b.replace(',','') : b;
    var la = arg1.toString().split('.')[1].length;
    var lb = arg2.toString().split('.')[1].length;
    var m = Math.pow(10,Math.max(la,lb));
    return (arg1*m + arg2*m)/m
}
//图片预加载就是提前加载好需要加载的图片
//图片加载绑定回调函数
//这个就是为了在图片已经加载后触发回调函数
function preLoadImg (url, success, error) {
	var img = new Image();
	img.src = url;
	if (img.complete) {
		success && success();
	} else {
		img.onload = function () {
			success && success.call(img); //回调函数中的this指向img
		}
		img.onerror = function () {
			error && error.call(img);
		}
	}
}
/*
 * 避免手势拖动在 iOS 下产生页面的拖动效果，仅限制在特定的容器内。
 * 参考：https://github.com/luster-io/prevent-overscroll
 */
//ios下的滚动机制是，先滑动内层元素，如果内层元素到顶了，触发body的滚动，如果内层元素没有到顶
//就不会触发body滚动
app.overscroll = function (el) {
	el.addEventListener('touchstart', function () {
		var top = el.scrollTop;
		var totalScroll = el.scrollHeight;
		var currentScroll = top + el.offsetHeight;
		if (top === 0) {
			el.scrollTop = 1;
		} else if (currentScroll >= totalScroll) {
			el.scrollTop = top - 1;
		}
	});
	el.addEventListener('touchmove', function (evt) {
		if (el.scrollTop + el.offsetHeight < el.scrollHeight) {
			evt._isScroller = true;
		}
	});
};
document.body.addEventListener('touchmove', function (evt) {
	if (!evt._isScroller) {
		evt.preventDefault();
	}
});