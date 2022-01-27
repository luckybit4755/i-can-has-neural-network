#!/usr/bin/env node 

const nj = require('../src/njeez');

const verify = ( arr, expected ) => {
	const a = nj.toArray( arr );
	const s = JSON.stringify( a ).replace( / /g, '' );
	if ( expected ) {
		expect(s).toStrictEqual(expected)
	} else {
		console.log(s);
	}
};

test( 'nj.1d', () => { 
	verify( 
		nj.array([1,2,3])
		, '[1,2,3]'
	);
});

test( 'nj.2d', () => { 
	verify( 
		nj.array([[1,2,3],[4,5,6],[7,8,9]])
		, '[[1,2,3],[4,5,6],[7,8,9]]'
	);
});

test( 'nj.3d', () => { 
	verify( 
		nj.array([[[1,10],[2,20],[3,30]],[[4,40],[5,50],[6,60]],[[7,70],[8,80],[9,90]]])
		, '[[[1,10],[2,20],[3,30]],[[4,40],[5,50],[6,60]],[[7,70],[8,80],[9,90]]]'
	);
});

test( 'nj.lamda1', () => { 
	verify( 
		nj.array([2,3,5]).lamda( (v,i,n)=> v + 10 * i )
		, '[2,13,25]'
	);
});

test( 'nj.lamda2', () => { 
	verify( 
		nj.array([[2,3,5],[7,9,11]]).lamda( (v,i,n)=> v + 100 * i  )
		, '[[2,103,205],[307,409,511]]'
	);
});

test( 'nj.T', () => {
	verify( 
		nj.array([[1,2,3]]).T
		, '[[1],[2],[3]]'
	);
});

test( 'nj.dot.1', () => {
	verify(
		nj.array([2,3,5]).dot(nj.array([7,9,11]))
		, '[96]'
	);
});

test( 'nj.dot.2', () => {
	verify(
		nj.array( 
			[[2,3,5],[7,9,11]] //2x3
		).dot(
			nj.array([[13],[17],[19]]) // 3x1 
		)
		, '[[172],[453]]' // 2x1
	);
});
