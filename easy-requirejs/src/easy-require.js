//标记已经加载成功的个数
var REQ_TOTAL = 0;
//模块导出
window.exports = {};
//记录各个模块的顺序
var exp_arr = [];

//判断是否数组
function isArray(param) {
	return param instanceof Array;
}

//require 真正实现
function require(arr, callback) {

	var req_list;

	if(isArray(arr)) {
		req_list = arr;
	} else {
		req_list = [arr];
	}
	var req_len = req_list.length;

	//模块逐个加载
	for(var i=0;i<req_len;i++) {
		var req_item = req_list[i];

		var $script = createScript(req_item, i);

		var $node = document.querySelector('head');

		(function($script) {
			//检测script 的onload事件
			$script.onload = function() {
				REQ_TOTAL++;

				var script_index = $script.getAttribute('index');

				exp_arr[script_index] = exports;

				window.exports = {};

				//所有链接加载成功后，执行callback
				if(REQ_TOTAL == req_len) {
					callback && callback.apply(exports, exp_arr);


				}

			}

			$node.appendChild($script);
		})($script);

	}

}

//创建一个script标签
function createScript(src, index) {
	var $script = document.createElement('script');

	$script.setAttribute('src', src);
	$script.setAttribute('index', index);

	return $script;
}






(function () {

	//存储已经加载好的模块
	var moduleCache = {};

	var require = function (deps, callback) {
		var params = [];
		var depCount = 0;
		var i, len, isEmpty = false, modName;

		//获取当前正在执行的js代码段，这个在onLoad事件之前执行
		modName = document.currentScript && document.currentScript.id || 'REQUIRE_MAIN';

		//简单实现，这里未做参数检查，只考虑数组的情况
		if (deps.length) {
			for (i = 0, len = deps.length; i < len; i++) {
				(function (i) {
					//依赖加一
					depCount++;
					//这块回调很关键
					loadMod(deps[i], function (param) {
						params[i] = param;
						depCount--;
						if (depCount == 0) {
							saveModule(modName, params, callback);
						}
					});
				})(i);
			}
		} else {
			isEmpty = true;
		}

		if (isEmpty) {
			setTimeout(function () {
				saveModule(modName, null, callback);
			}, 0);
		}

	};

	//考虑最简单逻辑即可
	var _getPathUrl = function (modName) {
		var url = modName;
		//不严谨
		if (url.indexOf('.js') == -1) url = url + '.js';
		return url;
	};

	//模块加载
	var loadMod = function (modName, callback) {
		var url = _getPathUrl(modName), fs, mod;

		//如果该模块已经被加载
		if (moduleCache[modName]) {
			mod = moduleCache[modName];
			if (mod.status == 'loaded') {
				setTimeout(callback(this.params), 0);
			} else {
				//如果未到加载状态直接往onLoad插入值，在依赖项加载好后会解除依赖
				mod.onload.push(callback);
			}
		} else {

			/*
			 这里重点说一下Module对象
			 status代表模块状态
			 onLoad事实上对应requireJS的事件回调，该模块被引用多少次变化执行多少次回调，通知被依赖项解除依赖
			 */
			mod = moduleCache[modName] = {
				modName: modName,
				status: 'loading',
				export: null,
				onload: [callback]
			};

			_script = document.createElement('script');
			_script.id = modName;
			_script.type = 'text/javascript';
			_script.charset = 'utf-8';
			_script.async = true;
			_script.src = url;

			//这段代码在这个场景中意义不大，注释了
			//      _script.onload = function (e) {};

			fs = document.getElementsByTagName('script')[0];
			fs.parentNode.insertBefore(_script, fs);

		}
	};

	var saveModule = function (modName, params, callback) {
		var mod, fn;

		if (moduleCache.hasOwnProperty(modName)) {
			mod = moduleCache[modName];
			mod.status = 'loaded';
			//输出项
			mod.export = callback ? callback(params) : null;

			//解除父类依赖，这里事实上使用事件监听较好
			while (fn = mod.onload.shift()) {
				fn(mod.export);
			}
		} else {
			callback && callback.apply(window, params);
		}
	};

	window.require = require;
	window.define = require;

})();



















