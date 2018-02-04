var changed = require('../changed-keys'),
		missing = require('../missing-keys'),
		t = require('cotest')


t('compare - changed', function() {
	t('{==}', changed([0,1,2], [0,1,9]), [2])
	t('{==}', changed([0,1,2], [9,1,2]), ['0'])
	t('{==}', changed({0:'0', 1:1, 2:2}, [0]), [0])
	t('{==}', changed([0,1], {'0':0, 1:'1', 2:2}), ['1'])
	t('{==}', changed({0:0, '1':1}, {'0':0, 1:1}), [])

	t('{==}', changed({0:0, '1':1}, '01'), [])
})

t('compare - missing', function() {
	t('{==}', missing([0,1,2], [0,1,9]), [])
	t('{==}', missing({0:0, 1:1, 2:2}, [0]), [1,2])
	t('{==}', missing({0:0, '1':1}, {'0':0, 1:1}), [])

	t('{==}', missing({0:0, '1':1}, '01'), [0,1])
})
