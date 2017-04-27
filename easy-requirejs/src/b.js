define('b', ['a'], function (fromA) {
	var b = fromA.testData + 1;
	return {
		testData : b
	}
})