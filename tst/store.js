var S = require( '../index' ),
		t = require('cotest')

var create = S.createStore,
		changed = S.changedKeys,
		missing = S.missingKeys

function compare(v,o) {
	t('!==', v, o, 'child event only if value changed: ')
	if (this) {
		t('{==}', missing(v,o), this[0], 'added keys')
		t('{==}', changed(v,o), this[1], 'changed keys'+v+'|'+o)// TODO keys string vs No
		t('{==}', missing(o,v), this[2], 'deleted keys')
	}
}

t('ref - added keys', function(end) {
	var store = create()

	store.once('aa',compare, [['bb','b'],[],[]])
	store.once('aa.bb', compare, [['cc','c'],[],[]])
	store.once('aa.bb.cc', compare, [[],[],[]])
	store.on('',compare, [['aa','a'],[],[]])

	store.set('', {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'}, function(err) {
		t('!', err)
		t('{===}', store.data, {aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})
		end()
	})
})

t('ref - del keys', function(end) {
	var store = create({aa: {bb:{cc:{}, c: 'c'}, b: 'b'}, a:'a'})

	store.once('aa', compare, [[],[],['bb','b']])
	store.once('aa.bb', compare, [[],[],['cc','c']])
	store.once('aa.bb.cc',compare, [[],[],[]])
	store.on('',compare, [[],[],['aa','a']])

	store.set('', undefined,function(err) {
		t('!', err)
		t('{===}', store.data, undefined)
		end()
	})
})

t('db - query', function(end) {
	var store = create({data: {list: [1,0]}, view:{}, acts:{}, done:[]})

	store.on('data.list', function(v, o) {
		store.set('view.sort', v.slice().sort())
	})
	store.on('acts.push', function(v, o) {
		store.set('data.list', store.get('data.list').concat(v))
	})

	store.once('data.list',compare, [[2],[],[]])
	store.once('view.sort',compare, [[0,1,2],[],[]])
	store.once('acts.push',compare, [[],[],[]])

	store.set('acts.push', 9, function(err) {
		t('!', err)
		t('{===}', store.data.data.list, [1,0,9])//[1,0]
		t('{===}', store.data.view.sort, [0,1,9])//undefined
		t('{===}', store.data.acts.push, 9)
		end()
	})
})
