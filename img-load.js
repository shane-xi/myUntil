(function (lib) {
	//防抖函数，在滚动加载的时候，需要在页面滚动停下来之后再加载图片
	function _debounce (func, wait, immediate) {
		var timeId = null;
		return function () {
			var args = arguments;
			var context = this;
			if (!timeId && immediate) {
				func.apply(context, args)
			}
			clearTimeout(timeId);
			timeId = setTimeout(function () {
				func.apply(context, args)
			}, wait)
		}
	}
	//设置元素到视口左上方边界的距离
	//param
    function _getOffset(element, param) {
	    if (!element) return;
	    var l, t, r, b, el;
	    if (!param) {
			param = {
			    x: 0,
			    y: 0
		    }
	    }
	    if (element == window) {
		    l = 0;
		    t = 0;
		    r = element.innerWidth;
		    b = element.innerHeight;
	    } else {
		    el = element.getBoundingClientRect();
		    l = el.left;
		    t = el.top;
		    r = el.right;
		    b = el.bottom;
	    }
	    return {
		    'left': l,
	        'top': t,
		    'right': r + param.x,
		    'bottom': b + param.y
	    }
    }
	//判断后面一个元素是否在前一个元素的可视区域内
	//d2的左边界在d1的右边界的左侧，且d2的又边界在d1的左边界的右侧
	//上下方位同理
	function _compareOffset(e1, e2) {
		var left = e2.left < e1.right && e2.right > e1.left
		var top = e2.top < e1.bottom && e2.bottom > e1.top;
		return left && top;
	}
	//浅拷贝
	function extend (target) {
		var sources = Array.prototype.slice.call(arguments,1);
		sources.forEach(function (item) {
			for (var key in item) {
				if (item.hasOwnProperty(key)) {
					target[key] = item[key]
				}
			}
		});
		return target;
	}
	//配置参数
	//container得为Dom节点
	var defaultConfig = {
		'className': 'lazy-img', //需要懒加载的图片类名
		'dataSrc': 'data-src',
		'lazyHeight': 0,
		'lazyWidth': 0,
		'fireEvent': 'scroll',
		'delay': 17
	}

	var imgHeper = function () {
		this._init();
	}
	imgHeper.prototype = {
		_init: function (options) {
			this.config = extend({}, defaultConfig, options || {});
			this.config.className = this.config.className.charAt(0) === '.'
				? Array.prototype.slice(this.config.className, 1)
				: this.config.className;
			if (this.config.fireEvent === 'scroll') {
				this._bindLazyEvent();
			}
		},
		fireLazyImg: function () {
			this._lazyloadImg();
		},
		_bindLazyEvent: function () {
			var that = this;
			var scrollHandler = _debounce(that._lazyloadImg, that.config.delay);
			if (this.config.container) {
				this.config.container.addEventListener('scroll', function () {
					scrollHandler.call(that);
				})
			} else {
				window.addEventListener('scroll', function () {
					scrollHandler.call(that);
				})
			}
		},
		preLoadImg: function (url, success, error) {
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
		},
		_lazyloadImg: function () {
			var that = this;
			var opts = that.config;
			var srcAttr = opts.dataSrc;
			var lazyImgs,
				containerOffset;
			if (opts.container) {
				lazyImgs = Array.prototype.slice.call(opts.container.getElementsByClassName(opts.className));
				containerOffset = _getOffset(opts.container, {
					'x': opts.lazyWidth,
					'y': opts.lazyHeight
				})
			} else {
				lazyImgs =  Array.prototype.slice.call(document.getElementsByClassName(opts.className));
				containerOffset = _getOffset(window, {
					'x': opts.lazyWidth,
					'y': opts.lazyHeight
				})
			}
			if(lazyImgs.length) {
				lazyImgs.forEach(function (el) {
					var src = el.getAttribute(srcAttr);
					var elOffset = _getOffset(el);
					var isInViewport = _compareOffset(containerOffset, elOffset);
					if (isInViewport) {
						that.preLoadImg(src, function () {
							el.removeAttribute(srcAttr);
							if (el.tagName === 'IMG') {
								el.setAttribute('src', src);
							} else {
								el.style.backgroundImage = 'url(' + src + ')';
							}
							el.style.opacity = 1;
							el.className = el.className.replace(new RegExp('(^|\\s)' + opts.className + '(\\s|$)'), '');
							//el.classList.remove(opts.className)
						}, function () {
							el.className = el.className.replace(new RegExp('(^|\\s)' + opts.className + '(\\s|$)'), '');
						})
					}
				})
			}
		}
	}
	imgHeper.prototype.constructor = imgHeper;
	lib.img = imgHeper;
})(window.lib)

var isLoading = false;
var isEnd = false
function fetchData() {
	if (!isLoading && !isEnd) {
		isLoading = true;
		fetch(path).then(function (res) {
			isLoading = false;
			dealWith(res)
			if (!res.data.length) isEnd = true;
		})
	}
}









