// @ts-check
var DB = require( '../index' ),
		t = require('cotest')

function addChangesL(v,o,k) {
	t('!==', v, o, 'child event only if value changed: '+k)
	//t('!==', v, o && o[k], 'child event only if v[k] changed: '+k)
	this.push(k)
}


t('db - promise', function(end) {
	var root = DB(),
			ref_ = root.ref(),
			changed = []
	ref_.on('*', addChangesL, changed)
	ref_.on('aa/bb/*', addChangesL, changed)
	ref_.ref('aa').on('*', addChangesL, changed)

	ref_.set('', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}).then(function() {
		t('{===}', root.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		t('{===}', changed, ['aa', 'a', 'cc', 'c', 'bb', 'b'])
		end()
	})
})
