var DB = require( '../index' ),
		t = require('cotest')

function addChanges(d,l,c) { this.push.apply(this, c) }

t('db - ref', function(end) {
	var db = DB({a:'a', aa:{b:'b', bb:{c:'c'}}}),
			ra = db.ref('aa'),
			rb = db.ref(['aa', 'bb']),
			rc = ra.ref('bb/cc'),
			changed = []

	rc.on('', addChanges, changed)
	rb.on('', addChanges, changed)
	ra.on('', addChanges, changed)
	db.on('', addChanges, changed)

	rc.set({d:'d'})

	setTimeout(function() {
		t('{===}', changed, ['aa', 'bb', 'cc', 'd'])
		end()
	})
})
