/*
requirejs实现原理
1.路径问题id,paths,baseURL
2.动态增加script标签通过路径来请求
3.如果define时没有给id，通过document.currentScript来设置当前匿名模块的id
4.依赖分析,遍历当前define的模块的依赖，每个依赖绑定自定义事件监听，如果依赖加载了，通知所有依赖它的模块，你的依赖模块已加载的
个数+1了，判断一下是否所有依赖的模块都被加载了，如果是，再触发到更上一层；遍历的依赖某块，看他的状态是否是loader，如果是，他自己本身
依赖的模块已经加载的个数加1，遍历结束后，做一次判断，是否所有模块被加载了。
5.递归注册
*/


(function (window) {
	var pathCfg = {};
	define.config = function (paths) {
		pathCfg = JSON.parse(JSON.stringify(paths));
	}
// moduleCache用来保存所有已经加载的模块
	var moduleCache = {};
//定义一个模块类，需要存储他的ID，依赖，它的依赖已经加载的个数；一个事件处理机制
	function Module(id, dependence) {
		this.callbackData = undefined;
		this.status = 'unload';
		this.dependence = dependence;
		this.dependLoadedNum = 0;
		this.handler = {};
	}
	Module.prototype.on = function (name, callback) {
		if(!this.handler[name]) {
			this.handler[name] = [];
			this.handler[name].push(callback)
		} else {
			this.handler[name].push(callback)
		}
	}
	Module.prototype.emit = function (name) {
		if(this.handler[name]) {
			this.handler[name].forEach(function (item, i) {
				item()
			})
		}
	}
	//注册模块，缓存到moduleCache中
	function _registerModule(id, dependence) {
		if(moduleCache[id]) {
			moduleCache[id].dependence = dependence;
		} else {
			moduleCache[id]	= new Module(id, dependence)
		}
		dependence.forEach(function (item, i) {
			_registerModule(item,[])
		})
	}
	//创建script标签载入模块
	function _createScript(id) {
		var head = document.querySelector('head')
		var tempScript = document.createElement('script');
		var baseURL = pathCfg.baseURL;
		var src = baseURL + (pathCfg[id] ? pathCfg[id] : id);
		tempScript.src = src + '.js';
		tempScript.setAttribute('data-module-id', id);//给创建的模块script标签加上一个id,以防匿名模块
		head.appendChild(tempScript);
	}

	//加载模块
	function _loadModule(currentModule, dependence, callback) {
		currentModule.dependLoadedNum++;
		if(currentModule.dependLoadedNum == currentModule.dependence.length) {
			//被依赖的模块的回调的返回 作为 参数传递给要依赖的模块
			var module = [];
			dependence.forEach(function (item, i) {
				module[i] = moduleCache[item].callbackData;
			})
			currentModule.callbackData = callback.apply(null, module);
			currentModule.emit('loaded')
		}
	}
	function define(id, dependence, callback) {
		//检查参数
		/*id,dependence,callback
		 id,callback
		 dependence,callback
		 callback*/
		//可能存在以上4种情况
		var args = [].slice.call(arguments);
		if(typeof args[0] !== 'string') {
			var currentId = document.currentScript.getAttribute('data-module-id');
			if(Object.prototype.toString.call(args[0]) == '[object Array]') {
				callback = args[1];
				dependence = args[0];
				id = currentId;
			} else {
				callback = args[0];
				dependence = [];
				id = currentId;
			}
		} else {
			if(Object.prototype.toString.call(args[1]) !== '[object Array]') {
				callback = args[1];
				dependence = [];
			}
		}
		_registerModule(id, dependence);
		var currentModule = moduleCache[id];
		if(dependence.length > 0) {
			dependence.forEach(function (item, i) {
				if(moduleCache[item].status == 'loaded') {
					currentModule.dependLoadedNum ++
				} else{
					_createScript(item);
					moduleCache[item].status = 'loaded'
				}
				moduleCache[item].on('loaded', function () {
					_loadModule(currentModule, dependence, callback)
				})
			});
			if(currentModule.dependLoadedNum == currentModule.dependence.length) {
				//被依赖的模块的回调的返回 作为 参数传递给要依赖的模块
				var module = [];
				dependence.forEach(function (item, i) {
					module[i] = moduleCache[item].callbackData;
				})
				currentModule.callbackData = callback.apply(null, module);
				currentModule.emit('loaded')
			}
		} else {
			currentModule.callbackData = callback();
			currentModule.emit('loaded');
		}
	}

	window.define = define;
	window.require = define;
})(window)