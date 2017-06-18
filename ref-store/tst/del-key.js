var imports = require( '../imports' )
var t = require('cotest')

imports(['../src/key-del', '../src/is-eq', '../src/clone'], function(m) {
	var delKey = m.delKey,
			clone = m.clone,
			isEqual = m.isEqual

	var obs = {a0: {b0: 'b0'}, a1: 'a1'},
			cln = clone(obs)

	t('del key obj', function() {
		cln = delKey(obs, 'a1')
		t('!==', obs, cln, 'unequal')
		t('!', isEqual(obs, cln), 'different')
		t('===', obs.a1, 'a1', 'immutable')
		t('===', cln.a1, undefined, 'deleted')
	})

	t('del key arr', function() {
		var arr = [0,1,2]
		cln = delKey(arr, 2)
		t('!==', arr, cln, 'different')
		t('!', isEqual(arr, cln), 'different')
		t('!!', isEqual(arr, [0,1,2]), 'immutable')
		t('!!', isEqual(cln, [0,1,]), 'deleted')
	})

})


