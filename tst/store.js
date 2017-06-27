// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function addChanges(d,o,c) {
	t('!==', d, o, 'child event only if value changed')
	t('!==', d && d[c], o && o[c], 'child event only if v[k] changed')
	this.push(c)
}
function checkValue(d,o) {
	t('!==', d, o, 'value event only if value changed')
	t('!!', d[o.k], 'vlue event with old and new values')
	this.push(o.k.toUpperCase())
}

t('db - callback', function(end) {
	var db = DB({k: 'aa', aa:{k: 'bb', bb:{}}}).ref(),
			ra = db.ref('aa'),
			rb = db.ref(['aa', 'bb']),
			rc = ra.ref('bb/cc'),
			rd = rc.ref(['dd']),
			re = db.ref('aa/bb/cc/dd/e'),
			changed = []

	db.on('child', addChanges, changed)
	ra.once('child', addChanges, changed)
	rb.on('child', addChanges, changed)
	rc.once('child', addChanges, changed)
	rd.on('child', addChanges, changed)
	re.on('child', addChanges, changed)

	ra.once('value', checkValue, changed)
	db.on('value', checkValue, changed)

	rb.set({cc:{dd:{e:'e'}}}, function(err) {
		t('!', err)
		t('{===}', db._db.state, {k: 'aa', aa:{k: 'bb', bb:{cc:{dd:{e:'e'}}}}})
		t('{===}', changed, ['aa', 'bb', 'cc', 'dd', 'e', 'BB', 'AA'])//
		rd.off('child', addChanges, changed)
		re.off('child', addChanges, changed)
		changed.length = 0
		rb.set({cc:{d:'d'}}, function(e) {
			t('!', e)
			t('{===}', db._db.state, {k: 'aa', aa:{k: 'bb', bb:{cc:{d:'d'}}}})
			t('{===}', changed, ['aa', 'AA'])
			t('{==}', db._db._trie.get(['aa', 'bb']).dtree, {}, 'dereferencing dtree')
			end()
		})
	})
})

t('db - promise', function(end) {
	var db = DB().ref(),
			changed = []
	db.ref('').on('child', addChanges, changed)
	db.ref('aa/bb').on('child', addChanges, changed)
	db.ref('aa').on('child', addChanges, changed)

	db.set({a:'a', aa:{bb:{c:'c'}}, b:'b'}).then(function() {
		t('{===}', db._db.state, {a:'a', aa:{bb:{c:'c'}}, b:'b'})
		t('{===}', changed, ['aa', 'bb'])
		end()
	})
})
