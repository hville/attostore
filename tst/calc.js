var esImport = require('node-dynamic-import'),
		t = require('cotest')

function value(chain) {
	return chain.__v
}

esImport('../src/_calc.js').then(function(m) {
	var A = new m.Calc(),
			B = new m.Calc(),
			C = new m.Calc(function(a,b) { return 'c:'+a+b }, [A,B]),
			D = new m.Calc(function(a,c) { return 'd:'+a+c }, [A,C]),
			E = new m.Calc(function(c,b,a) { return 'e:'+c+b+a }, [C,B,A])

	A.set('a')
	B.set('b')

	t('getters', function() {
		t('===', A.get(), 'a', 'A data getter')
		t('===', B.get(), 'b', 'B data getter')
		t('===', C.get(), 'c:ab', 'C data getter '+C.get())
		t('===', D.get(), 'd:ac:ab', 'D data getter')
		t('===', E.get(), 'e:c:abba', 'E data getter')
	})

	t('links', function() {
		t('===', A._ts.map(value).join(','), 'c:ab', 'A -> C...'+A._ts.map(value).join(','))
		t('===', B._ts.map(value).join(','), 'c:ab', 'B -> C')
		t('===', C._ss.map(value).join(','), 'a,b', 'C <- A,B')
		t('===', C._ts.map(value).join(','), 'd:ac:ab,e:c:abba', 'C -> D,E :'+C._ts.map(value).join(','))
		t('===', C._ss.map(value).join(','), 'a,b', 'C <- A,B')
		t('===', D._ts.map(value).join(','), '', 'D -> E : '+D._ts.map(value).join(','))
		t('===', D._ss.map(value).join(','), 'a,c:ab', 'D <- A,C')
		t('===', E._ts.map(value).join(','), '', 'E->null')
		t('===', E._ss.map(value).join(','), 'c:ab,b,a', 'E <- C,B,A')
	})

	t('updates', function() {
		A.set('A')
		t('===', A.get(), 'A', 'A data getter')
		t('===', B.get(), 'b', 'B data getter')
		t('===', C.get(), 'c:Ab', 'C data getter')
		t('===', D.get(), 'd:Ac:Ab', 'D data getter '+D.get())
		t('===', E.get(), 'e:c:AbbA', 'E data getter '+E.get())
	})

	t('multiple changes, single update', function() {
		var cnt = 0,
				S = new m.Calc(),
				X = new m.Calc(function(s) { return 'x'+ (cnt++) + ':' + s.a }, [S]),
				Y = new m.Calc(function(s) { return 'y'+ (cnt++) + ':' + s.b }, [S]),
				T = new m.Calc(function(x,y) { return 't'+ (cnt++) + ':' + x+y  }, [X,Y])
		S.set({a:'A', b:'B'})
		t('{===}', S.get(), {a:'A', b:'B'})
		t('===', X.get(), 'x0:A')
		t('===', Y.get(), 'y1:B')
		t('===', T.get(), 't2:x0:Ay1:B')
		S.set({a:'a', b:'b'})
		t('{===}', S.get(), {a:'a', b:'b'})
		t('===', X.get(), 'x3:a')
		t('===', Y.get(), 'y4:b')
		t('===', T.get(), 't5:x3:ay4:b')
	})



})
