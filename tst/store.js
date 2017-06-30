// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function addChangesL(v,o,k) {
	t('!==', v, o, 'child event only if value changed: '+k)
	this.push(k)
}
function addChangesU(v,o,k) {
	t('!==', v, o, 'child event only if value changed')
	this.push(k.toUpperCase())
}
function addChangesV(v,o,k) {
	t('!==', v, o, 'child event only if value changed')
	this.push(k+v)
}

t('db - callback', function(end) {
	var root = DB(),
			ref_ = root.ref(),
			refa = root.ref('aa'),
			changed = []

	ref_.once('aa', addChangesU, changed)
	refa.on('*', addChangesL, changed)
	ref_.once('aa/bb', addChangesU, changed)
	ref_.on(['aa','bb','*'], addChangesL, changed)
	refa.once('bb/cc', addChangesU, changed)
	ref_.on('*', addChangesL, changed)


	ref_.set('', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}, function(err) {
		t('!', err)
		t('{===}', root.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		t('{===}', changed, ['bb', 'b', 'cc', 'c', 'CC', 'BB', 'AA', 'aa', 'a'])
		changed.length = 0
		ref_.set('aa/bb', {}, function(e) {
			t('!', e)
			t('{===}', root.data, {aa: {bb:{}, b: 'b'}, a:'a'})
			t('{===}', changed, ['bb', 'cc', 'c', 'aa'])
			refa.off('*', addChangesL, changed)
			ref_.off('*', addChangesL, changed)
			refa.off(['bb','*'], addChangesL, changed)
			t('===', root.trie._ks.size, 0, 'dereferencing dtree')
			end()
		})
	})
})

t('db - wildCard', function(end) {
	var root = DB(),
			ref_ = root.ref(),
			changed = []

	ref_.on('*/x', addChangesV, changed)


	ref_.set('', {A: {a:'Aa', x:'Ax'}, B: {b:'Bb'}, C: {x:'Cx'}}, function(err) {
		t('!', err)
		t('{===}', root.data, {A: {a:'Aa', x:'Ax'}, B: {b:'Bb'}, C: {x:'Cx'}})
		t('{===}', changed, ['xAx', 'xCx'])
		end()
	})
})

t('db - query', function(end) {
	var src = DB(),
			ref = src.ref(),
			xfo = ref.query(function(v) { return v.slice().sort() })

	xfo.on('', function(v,o,k,s) {
		t('===', k, undefined)
		t('===', s, undefined)
		t('!==', v, o, 'child event only if value changed')
		t('{==}', v, [0,1,2,3])
	})
	xfo.on('*', function(v,o,k,s) {
		t('!==', v, o, 'child event only if value changed')
		t('!!', Array.isArray(s))
		t('!!', typeof k, 'number')
		t('{==}', s, [0,1,2,3])
	})

	ref.set('', [1,2,3,0], function(err) {
		t('!', err)
		t('{===}', src.data, [1,2,3,0])
		end()
	})
})
