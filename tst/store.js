// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function compare(v,o,as,ms,ds) {
	t('!==', v, o, 'child event only if value changed: ')
	t('{===}', as, this[0])
	t('{===}', ms, this[1])
	t('{===}', ds, this[2])
}

t('ref - added keys', function(end) {
	var ref = DB()

	ref.ref('aa').once('',compare, [['bb','b'],[],[]])
	ref.once('aa/bb', compare, [['cc','c'],[],[]])
	ref.ref('aa').once('bb/cc', compare, [[],[],[]])
	ref.on('',compare, [['aa','a'],[],[]])

	ref.set('', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}, function(err) {
		t('!', err)
		t('{===}', ref.store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})

t('ref - del keys', function(end) {
	var ref = DB({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})

	ref.once('aa', compare, [[],[],['bb','b']])
	ref.once('aa/bb', compare, [[],[],['cc','c']])
	ref.ref('aa/bb/cc').once('',compare, [[],[],[]])
	ref.on('',compare, [[],[],['aa','a']])

	ref.del('',function(err) {
		t('!', err)
		t('{===}', ref.store.data, undefined)
		end()
	})
})

t('db - query', function(end) {
	var ref = DB([1,2,3,0]),
			xfo = ref.query(function(v) { return v.slice().sort() })

	xfo.once('',compare, [[],[0,3],[]])
	ref.set('',[1,2,3,0], function(err) {
		t('!', err)
		t('{===}', ref.store.data, [1,2,3,0])
		t('{===}', xfo.data, [0,1,2,3])
		end()
	})
})
