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
	var ref = DB()

	ref.once('',compare, [['aa', 'a'],[],[]])
	ref.ref('aa').once('bb',compare, [['cc', 'c'],[],[]])
	ref.once('aa',compare, [['bb', 'b'],[],[]])

	ref.set('',{aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}).then(function() {
		t('{===}', ref.store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})
