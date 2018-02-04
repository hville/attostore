var ct = require('cotest'),
		pK = require('../src/path-keys')

ct('string patterns', function() {
	ct('{===}', pK(''), [])
	ct('{===}', pK('a'), ['a'])
	ct('{===}', pK('a/'), ['a',''])

	ct('{===}', pK('a/b'), ['a','b'])
	ct('{===}', pK('a/b/'), ['a','b',''])
	ct('throws', function() { return pK('/') })
	ct('throws', function() { return pK('/a') })
})

ct('array path', function() {
	ct('{===}', pK([]), [])
	ct('{===}', pK([0]), ['0'])
	ct('{===}', pK(['0']), ['0'])
	ct('throws', function() { return pK([false]) })
	ct('throws', function() { return pK([true]) })
	ct('throws', function() { return pK([{}]) })
	ct('throws', function() { return pK([Object.create(null)]) })
	ct('throws', function() { return pK([/a/]) })
	ct('throws', function() { return pK([null]) })
	ct('throws', function() { return pK([[]]) })
	ct('throws', function() { return pK([undefined]) })
})

ct('other types', function() {
	ct('{===}', pK(null), [])
	ct('{===}', pK(undefined), [])
	ct('throws', function() { return pK(false) })
	ct('throws', function() { return pK(true) })
	ct('throws', function() { return pK({}) })
	ct('throws', function() { return pK(Object.create(null)) })
	ct('throws', function() { return pK(/a/) })
	ct('throws', function() { return pK([undefined]) })
})
