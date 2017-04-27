define.config({
	'a': 'a',
	'b': 'b',
	baseURL: 'src/'
})
require(['a','b'], function (fromA, fromB) {
	var c = fromA.testData + fromB.testData;
	console.log(c)
})