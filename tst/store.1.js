// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function addChangesL(v,k,n,o) {
	t('!==', n, o, 'child event only if value changed: '+k)
	t('!==', v, o && o[k], 'child event only if v[k] changed: '+k)
	this.push(k)
}
function addChangesU(v,k,n,o) {
	t('!==', n, o, 'child event only if value changed')
	t('!==', v, o && o[k], 'child event only if v[k] changed')
	this.push(k.toUpperCase())
}

t('db - callback', function(end) {
	var db = DB(),
			changed = []

	db.on('*', addChangesL, changed)
	db.once('aa', addChangesU, changed)
	db.on('aa/*', addChangesL, changed)
	db.once('aa/bb', addChangesU, changed)
	db.on(['aa','bb','*'], addChangesL, changed)
	db.once('aa/bb/cc', addChangesU, changed)

	db.patch([{k: '', v: {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}}], function(err) {
		t('!', err)
		t('{===}', db.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		t('{===}', changed, ['aa', 'a', 'bb', 'b', 'cc', 'c', 'CC', 'BB', 'AA'])
		changed.length = 0
		db.patch([{k:'aa/bb', v: {}}], function(e) {
			t('!', e)
			t('{===}', db.data, {aa: {bb:{}, b: 'b'}, a:'a'})
			t('{===}', changed, ['aa', 'bb', 'cc', 'c'])
			//t('===', db._db._trie.get(['aa', 'bb'])._kids.size, 0, 'dereferencing dtree')
			end()
		})
	})
})
