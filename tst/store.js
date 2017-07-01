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
	var root = DB(),
			ref_ = root.ref(),
			refa = root.ref('aa')

	refa.once(compare, [['bb','b'],[],[]])
	ref_.ref('aa/bb').once(compare, [['cc','c'],[],[]])
	refa.ref('bb/cc').once(compare, [[],[],[]])
	ref_.on(compare, [['aa','a'],[],[]])


	ref_.set({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}, function(err) {
		t('!', err)
		t('{===}', root.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})

t('ref - del keys', function(end) {
	var root = DB({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}),
			ref_ = root.ref(),
			refa = root.ref('aa')

	refa.once(compare, [[],[],['bb','b']])
	ref_.ref('aa/bb').once(compare, [[],[],['cc','c']])
	refa.ref('bb/cc').once(compare, [[],[],[]])
	ref_.on(compare, [[],[],['aa','a']])

	ref_.del(function(err) {
		t('!', err)
		t('{===}', root.data, undefined)
		end()
	})
})

t('db - query', function(end) {
	var src = DB(),
			ref = src.ref(),
			xfo = ref.query(function(v) { return v.slice().sort() })

	xfo.on(compare, [[],[0,3],[]])
	ref.set([1,2,3,0], function(err) {
		t('!', err)
		t('{===}', src.data, [1,2,3,0])
		t('{===}', xfo.data, [0,1,2,3])
		end()
	})
})
