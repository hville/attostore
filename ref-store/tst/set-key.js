var imports = require( '../imports' )
var t = require('cotest')

imports(['../src/key-set', '../src/is-eq', '../src/clone'], function(m) {
	var setKey = m.setKey,
			clone = m.clone,
			isEqual = m.isEqual

	var obs = {a0: {b0: 'b0'}, a1: 'a1'},
			cln = clone(obs)


	t('set key obj', function() {
		cln = setKey(obs, 'a2', 'a2')
		t('!==', obs, cln, 'unequal')
		t('!', isEqual(obs, cln), 'different')
		t('==', obs.a2, null, 'immutable')
		t('===', cln.a2, 'a2', 'changed')
	})

	t('set key arr', function() {
		var arr = [0,1,2]
		cln = setKey(arr, 3, 3)
		t('!==', obs, cln, 'unequal')
		t('!', isEqual(obs, cln), 'different')
		t('!!', isEqual(arr, [0,1,2]), 'immutable')
		t('!!', isEqual(cln, [0,1,2,3]), 'added')
	})

})
