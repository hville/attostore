// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function compare(v,o,as,ms,ds) {
	t('!==', v, o, 'child event only if value changed: ')
	t('{===}', as, this[0])
	t('{===}', ms, this[1])
	t('{===}', ds, this[2])
}


t('db - promise', function(end) {
	var root = DB(),
			ref_ = root.ref()

	ref_.once(compare, [['aa', 'a'],[],[]])
	ref_.ref('aa/bb').once(compare, [['cc', 'c'],[],[]])
	ref_.ref('aa').once(compare, [['bb', 'b'],[],[]])

	ref_.set({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}).then(function() {
		t('{===}', root.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})
