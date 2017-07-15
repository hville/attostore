/**
 * @typedef {Object} Action
 * @prop {string} [uid]
 * @prop {Operations} ops
 * @prop {string} [err]
 */

/**
 * @typedef {Action[]} Actions
 */

/**
 * @typedef {function(any): Action} ActionCreator
 */

t('db - actions', function() {
	var store = create(),
			history = [],
			actions = {
				init: function() { return { val:[] }},
				push: function(v) { var arr = this.get(); return {key: arr.length, val: v}}
			},
			expected = {newVal:[], oldVal:undefined, history:[]}

	store.act = function(name, val) {
		this.set(actions[name].call(this, val), function(err, res) {
			if (!err && !res) return
			var act = {act: name}
			if (val !== undefined) act.arg = val
			if (err) act.err = err.message
			history.push(act)
		})
	}
	store.on('', function(v,k,o) {
		t('===', this, store)
		t('{===}', v, expected.newVal)
		t('===', k, null)
		t('{===}', o, expected.oldVal)
		t('{===}', history, expected.history)
		t('{===}', store.data, expected.newVal)
	})
	store.act('init')
	expected = {newVal:[4], oldVal:[], history:[{act: 'init'}]}
	store.act('push', 4)
	expected = {newVal:[4,2], oldVal:[4], history:[{act: 'init'}, {act: 'push', arg:4}]}
	store.act('push', 2)
})
