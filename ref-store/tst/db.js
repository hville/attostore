var DB = require( '../index' ),
		t = require('cotest')

function testDown(init, key, val) {
	var db = DB(init),
			ref = db.ref(key)
	t('===', ref.root, db)
	db.on(function(n, o) {
		t('===', o, init)
	})
	ref.on(function(n, o) {
		t('===', val, n)
	})
	ref.set(val)
}

t('db - updates propagate down', function() {
	testDown(null, 'a', 'A')
	testDown(null, ['a', 'b'], 'B')
	testDown(null, ['a', 'b'], {c: 'C'})
	testDown(0, 'a', 'A')
	testDown(0, ['a', 'b'], 'B')
	testDown(0, ['a', 'b'], {c: 'C'})
	testDown([0, 1], 'a', 'A')
	testDown([0, 1], ['a', 'b'], 'B')
	testDown([0, 1], ['a', 'b'], {c: 'C'})
	testDown({e: 'E'}, 'a', 'A')
	testDown({e: 'E'}, ['a', 'b'], 'B')
	testDown({e: 'E'}, ['a', 'b'], {c: 'C'})
})


function testUp(val, key, obj) { //TODO async + storage & net adapters
	var db = DB(),
			ref = db.ref(key)
	t('===', ref.root, db)
	db.on(function(n, o) {
		t('===', o, null)
		t('===', n, obj)
	})
	ref.on(function(n, o) {
		t('===', o, undefined)
		t('===', val, n)
	})
	db.set(obj)
}

t('db - updates propagate up', function() {
	testUp('A', 'a', {a: 'A'})
	testUp('B', ['a', 'b'], {a: {b: 'B'}})
	testUp('C', 'a/b/c', {a: {b: {c: 'C'}}})
})
