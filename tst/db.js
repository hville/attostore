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

t('db - ref', function(end) {
	var db = DB({k: 'aa', aa:{k: 'bb', bb:{}}}),
			ra = db.ref('aa'),
			rb = db.ref(['aa', 'bb']),
			rc = ra.ref('bb/cc'),
			rd = rc.ref(['dd']),
			re = db.ref('aa/bb/cc/dd/ee'),
			changed = []

	db.on('child', addChanges, changed)
	ra.on('child', addChanges, changed)
	rb.on('child', addChanges, changed)
	rc.on('child', addChanges, changed)
	rd.on('child', addChanges, changed)
	re.on('child', addChanges, changed)

	ra.on('value', checkValue, changed)
	db.on('value', checkValue, changed)


	rb.set({cc:{dd:{e:'e'}}}) //TODO set async?

	setTimeout(function() {
		t('{===}', changed, ['e', 'dd', 'cc', 'bb', 'aa', 'AA', 'BB'])
		end()
	})
})
