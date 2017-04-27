//构造函数
function MyUtil() {

}
//保存常用原型的引用，避免对象属性的查找开销
var ArrayPro = Array.prototype,
	ObjPro = Object.prototype,
	SymbolPro = Symbol.prototype,
	FuncPro = Function.prototype;
//保存常用函数，减少在原型链中的查找次数（提高代码效率）
var slice = ArrayPro.slice,
	toString = ObjPro.toString,
	hasOwnProPerty = ObjPro.hasOwnProperty;
//保存ES5常用的原生方法引用
var nativeIsArray = Array.isArray,
	nativeKeys = Object.keys,
	nativeCreate = Object.create;
//JS中最大的数
var MAX_SAFE_INTEGER = Math.pow(2,53) - 1;
//获取对象的属性
//这样写体现了函数式编程的灵活
//var getLength = property('length') 就获得了一个专门用来采集对象length属性的函数
var property = function (key) {
	return function (obj) {
		return obj == null ? undefined : obj[key];
	}
}
//创建分配器,来实现extend,extendOwn,default三个复制函数
var createAssigner = function (keysFunc,bool) {
	var argsOut = slice.call(arguments);
	return function (target) {
		var argsInner = slice.call(arguments);
		var len = argsInner.length;
		if (len < 2 || argsInner[0] == null) return target;
		for (var i = 1; i < len ; i++) {
			var keys = keysFunc(argsInner[i]);
			var length = keys.length;
			for(var t = 0; t < length; t++) {
				var key = keys[t];
				//bool为true时，只有在target[key]不存在时，才会拷贝
				//如果bool为false时，直接拷贝
				if(!bool || target[key] === void 0) {
					target[key] = argsInner[i][key];
				}
			}
		}
		return target;
	}
}
//三种浅拷贝函数
MyUtil.extend = createAssigner(MyUtil.allKeys);
MyUtil.extendOwn = MyUtil.assign = createAssigner(MyUtil.keys);
MyUtil.default = createAssigner(MyUtil.keys,true);

//类数组包括数组
MyUtil.isArrayLike = function (arg) {
	var getLength = property('length');
	var len = getLength(arg);
	return len && typeof len === 'number' && len >= 0 && len <= MAX_SAFE_INTEGER;
}
//常用工具判断
MyUtil.isElement = function (arg) {
	return !!(arg && arg.nodeType === 1);
}
MyUtil.has = function (obj, key) {
	return obj && hasOwnProPerty.call(obj, key);
}
MyUtil.keys = nativeKeys || function (obj) {
	if(!MyUtil.isObject(obj)) return [];
	var keys = [];
	for(var key in obj) {
		if(MyUtil.has(obj, key)) {
			keys.push(key);
		}
	}
	return keys;
}
MyUtil.values = function (obj) {
	var keys = MyUtil.keys(obj);
	var res = [];
	for (var i = 0, len = getLength(keys); i < len; i++) {
		res.push(keys[i]);
	}
	return res;
}
MyUtil.allKeys = function (obj) {
	if(!MyUtil.isObject(obj)) return [];
	var keys = [];
	for(var key in obj) {
		keys.push(key);
	}
	return keys;
}
MyUtil.isEqual = function (a, b) {
	//考虑-0 和 0
	if(a === b) return a !== 0 || 1/a === 1/b;
	//如果a,b 有一个为null or undefined，return false
	if(a == null || b == null) return false;
	// NaN
	if(a !== a) return b !== b;
	//类型判断
	var aClass = toString.call(a),
		bClass = toString.call(b);
	if(aClass !== bClass) return false;
	switch (aClass) {
		//regexp和string类型转化为string,date,boolen,number类型转化为number
		case '[object Regexp]':
		case '[object String]':
			return '' + a === '' + b;
		//Number类型还得考虑NaN
		case '[object Number]':
			if(a !==a) return b !== b;
		case '[object Date]':
		case  '[object Boolen]':
			return +a === +b;
	}
	//数组和对象 深度遍历比较，函数直接视为不等
}
//检查一个对象是否是另一个对象的子集
MyUtil.isMatch = function (obj, attrs) {
	var keys = MyUtil.keys(attrs),
		len = keys.length;
	for (var i = 0; i < len; i++) {
		var key = keys[i];
		if ( !(key in obj) || obj[key] !== attrs[key]) {
			return false
		}
	}
	return true;
}
//函数式编程的思想，返回一个检查特定属性的函数
MyUtil.matcher = MyUtil.matches =function (attrs) {
	return function (obj) {
		return MyUtil.isMatch(obj, attrs)
	}
}
MyUtil.property = property;
//构建新对象，根据给的原型和实例属性
MyUtil.create = function (prototype, attrs) {
	if(MyUtil.isObject(prototype)) return {};
	if(nativeCreate) return nativeCreate(prototype);
	var middle = function () {};
	middle.prototype = prototype;
	var newObj = new middle();
	if(attrs) MyUtil.extendOwn(newObj, attrs);
	return newObj;
}
//数组相关的一些方法

//优化回调函数，其实就是改变函数的执行上下文
var optimizeCb = function (func, context, argCount) {
	return function () {
		return func.apply(context, arguments);
	}
}
//与上面这个函数的区别是，第一个函数有可能不是函数
//对于map [{a:1,b:2},{a:2}] a 返回的就是[1,2]
var cb = function (value, context, argCount) {
	//判断第一个参数的类型，分别给予不同的处理函数
	if (value == null) return MyUtil.identity;
	if (MyUtil.isFunction(value)) return optimizeCb(value, context, argCount);
	if (MyUtil.isObject(value)) return MyUtil.matcher(value);
	return MyUtil.property(value);
}
//作为迭代函数（可以简化迭代函数的书写？？？）
MyUtil.identity = function (value) {
	return value;
}
MyUtil.each = MyUtil.forEach = function (obj, func, context) {
	var iteratee = optimizeCb(func, context);
	var i,len;
	if (MyUtil.isArrayLike(obj)) {
		for (i = 0, len = obj.length; i < len; i++) {
			iteratee(obj[i], i, obj);
		}
	} else {
		var keys = MyUtil.keys(obj);
		for (i = 0, len = keys.length; i < len; i++) {
			iteratee(obj[keys[i]], keys[i], obj);
		}
	}
	//返回自身供链式调用
	return obj;
}
MyUtil.map = function (obj, iteratee, context) {
	var iteratee = cb(iteratee, context);
	var len = obj.length || MyUtil.keys(obj).length;
	var results = new Array(len);
	if (MyUtil.isArrayLike(obj)) {
		for (i = 0, len = obj.length; i < len; i++) {
			results[i] = iteratee(obj[i], i, obj);
		}
	} else {
		var keys = MyUtil.keys(obj);
		for (i = 0, len = keys.length; i < len; i++) {
			results[i] = iteratee(obj[keys[i]], keys[i], obj);
		}
	}
	return results;
}
MyUtil.map = MyUtil.collect = function(obj, iteratee, context) {
	// 根据 context 确定不同的迭代函数
	iteratee = cb(iteratee, context);

	// 如果传参是对象，则获取它的 keys 值数组（短路表达式）
	var keys = !MyUtil.isArrayLike(obj) && MyUtil.keys(obj),
		// 如果 obj 为对象，则 length 为 key.length
		// 如果 obj 为数组，则 length 为 obj.length
		length = (keys || obj).length,
		results = Array(length); // 结果数组

	// 遍历
	for (var index = 0; index < length; index++) {
		// 如果 obj 为对象，则 currentKey 为对象键值 key
		// 如果 obj 为数组，则 currentKey 为 index 值
		var currentKey = keys ? keys[index] : index;
		results[index] = iteratee(obj[currentKey], currentKey, obj);
	}

	// 返回新的结果数组
	return results;
};
var getLength = MyUtil.property('length');
//查找符合条件的第一个值,没找到返回-1
function createPredicateIndexFinder(direction) {
	return function (array, callback, context) {
		var predicate = optimizeCb(callback, context);
		var len = getLength(array);
		var index = direction > 0 ? 0 : len - 1;
		for(index; index < len && index >= 0 ;index += direction) {
			if (predicate(array[index], index, array)) return index
		}
		return -1;
	}
}
MyUtil.findIndex = createPredicateIndexFinder(1);
MyUtil.findLastIndex = createPredicateIndexFinder(-1);

function createIndexFinder(direction) {
	return function (array, item, index) {
		var i = 0;
		var len = getLength(array);
		i = index >= 0 ? index : Math.max(i + length, i);
		for (i; i < len && i >= 0; i += direction) {
			if (array[i] === item) return i;
		}
		return -1;
	}
}
MyUtil.IndexOf = createIndexFinder(1);
MyUtil.indexLastOf = createIndexFinder(-1);
//数组过滤
MyUtil.filter = function (arr, predicate, context) {
	var res = [];
	predicate = optimizeCb(predicate, context);
	for (var i = 0, len = getLength(arr); i < len; i++) {
		if (predicate(arr[i], i , arr)) res.push(arr[i])
	}
	return res;
}
//剔除数组中的假值
MyUtil.compact = function (arr) {
	return MyUtil.filter(arr, MyUtil.identity)
}

//数组去重 双层循环
MyUtil.unique = function (arr) {
	var newArr = [];
	for (var i = 0, len = getLength(arr); i < len; i++) {
		for (var j = 0, newLen = newArr.length; j < newLen; j++) {
			if (newArr[j] === arr[i])
				break;
		}
		if (j === newLen) {
			newArr.push(arr[i])
		}
	}
	return newArr;
}
//用ES5的indexOf 以及 filter方法
MyUtil.unique = function (arr) {
	return arr.filter(function (item, index) {
		return arr.indexOf(item) === index;
	})
}
//多个数组合并后去重
MyUtil.union = function () {
	return MyUtil.unique(flatten(arguments, true, true));
}
//数组展开
//shallow表示是否深度展开；strict表示是否过滤非数组
var flatten = function (arr, shallow, strict, startIndex) {
	var res = [];
	for (var i = startIndex || 0,len = getLength(arr); i < len; i++) {
		var value = arr[i]
		if (MyUtil.isArray(arr[i]) || MyUtil.isArguments(arr[i])) {
			if (!shallow) value = flatten(value, shallow, strict);
			for (var j = 0, valLen = value.length; j < valLen; j ++) {
				res.push(value[j]);
			}
		} else if (!strict) {
			res.push(value);
		}
	}
	return res;
}
MyUtil.flatten = function (arr, shallow) {
	return flatten(arr, shallow, false)
}
//判断是否包含某个元素
MyUtil.contains = function (obj, item) {
	if(MyUtil.isObject(obj) && !MyUtil.isArray(obj)) obj = MyUtil.values(obj);
	return MyUtil.IndexOf(obj, item) >= 0;
}
//数组取交集
MyUtil.intersection = function (arr) {
	var res = [];
	var length = arguments.length;
	for (var i = 0, len = getLength(arr); i < len; i++) {
		var item = arr[i];
		if (MyUtil.contains(res, item)) continue;
		for (var j = 1; j < length; j++) {
			if (!MyUtil.contains(arguments[j], item)) break;
		}
		if (j === length) res.push(item);
	}
	return res;
}
//剔除数组中在其他数组中出现的元素
MyUtil.difference = function (arr) {
	//rest表示剩余参数
	var rest = flatten(slice.call(arguments,MyUtil.difference.length),true,true);
	return MyUtil.filter(arr, function (item) {
		return !MyUtil.contains(rest, item);
	})
}
MyUtil.without = function (arr) {
	return MyUtil.difference(arr, slice.call(arguments,1))
}

MyUtil.without = function (arr) {
	var args = slice.call(arguments, 1);
	return MyUtil.filter(arr, function (item) {
		return !MyUtil.contains(args, item)
	})
}
MyUtil.difference = function (arr) {
	var args = slice.call(arguments, 1);
	var args = MyUtil.union.apply(null,args);
	args.unshift(arr);
	return MyUtil.without.apply(null,args);
}

//常用类型判断
MyUtil.isArray = nativeIsArray || function (arg) {
		return toString.call(arg) === '[object Array]';
	}
MyUtil.isObject = function (arg) {
	var type = typeof arg;
	return type === 'fucntion' || type === "object" && !!arg;
}
MyUtil.isFunction = function (arg) {
	return typeof arg === 'function';
}
var className = ['Arguments', 'String', 'Number', 'Date', 'RegExp', 'Error']
MyUtil.each(className, function (item) {
	MyUtil['is' + item] = function (arg) {
		return toString.call(arg) === '[object ' + item + ']';
	}
})
//删除，插入，替换，返回删除的数组，会修改原数组
//TODO 实现仍有问题
MyUtil.splice = function (arr, start, length, insert) {
	var funcLen = arguments.length;
	var res = [];
	var newArr = [];
	if (funcLen == 3) {
		for(var i = 0; i < arr.length; i++) {

			if (i < start || i >= start + length ) {
				newArr.push(arr[i]);
			} else {
				res.push(arr[i]);
			}
		}
		arr = newArr;
		return res;
	}
}
//范围内随机取数
MyUtil.rand = function (min, max) {
	if (!max) {
		max = min;
		min = 0;
	}
	var len  = max - min + 1;
	return min + Math.floor(Math.random() * len)
}
//数组乱序
MyUtil.shuffle = function (arr) {
	var res = [];
	while (arr.length) {
		var index = Math.floor(Math.random() * arr.length);
		res.push(arr[index]);
		arr.splice(index, 1);
	}
	return res;
}
//Fisher–Yates Shuffle
//TODO
//数组中随机抽取N个数
MyUtil.sample = function (arr, n) {
	return MyUtil.shuffle(arr).slice(0, n);
}

//函数防抖
//核心:通过闭包保留上一次timeId的引用，如果两次触发时间小于wait，就会clear
//只有在两次事件触发时间相隔大于设置的wait时间才会触发
//应用场景：input框输入的回调事件;button绑定click触发ajax请求;滚动加载的时候，只有
// 停止滚动的时候才判断是否到了页面底部
/*
 *
 *
 *  imediate为true表示一开始就会响应一次
*/
MyUtil.debounce = function (func, wait, immediate) {
	var timer = null;  //设置timer为null，可以防止内存泄漏，
	return function () {
		var args = arguments;
		var context = this;
		if (!timer && immediate) {
			func.apply(context, args);
		}
		clearTimeout(timer);
		timer = setTimeout(function () {
			func.apply(context, args)
		}, wait)
	}
}
//函数节流
//让函数在一个时间段内周期性的执行
//应用:DOM 元素的拖拽功能实现（mousemove）
//射击游戏的 mousedown/keydown 事件（单位时间只能发射一颗子弹）
//计算鼠标移动的距离（mousemove）
//Canvas 模拟画板功能（mousemove）
//搜索联想（keyup）
//监听滚动事件判断是否到页面底部自动加载更多：给 scroll 加了 debounce 后，只有用户停止滚动后，
// 才会判断是否到了页面底部；如果是 throttle 的话，只要页面滚动就会间隔一段时间判断一次=
/*
 *
 * option传入  {leading: false} 忽略开始的调用
 {trailing: false} 忽略结尾的调用
 */
MyUtil.throttle = function (func, wait, option) {
	var timer = null;
	var lastTime;
	return function () {
		var context = this,
			args = arguments;
		var currentTime = new Date();
		if (lastTime && currentTime - lastTime < wait) {
			clearTimeout(timer);
			timer = setTimeout(function () {
				lastTime = currentTime;
				func.apply(context, args);
			}, wait)
		} else {
			lastTime = currentTime;
			func.apply(context, args);
		}
	}
}
//异同
//函数去抖在一段时间只执行一次，而函数节流则是间隔时间段执行

//不要多次调用debounce,而是把它保存到一个变量中
var debounceAjax = MyUtil.throttle(ajax, 1000, true);
function ajax(content) {
	console.log('ajax request ' + content)
}
var input = document.getElementById('search')
input.addEventListener('keyup', function(e) {
	debounceAjax(e.target.value)
})










