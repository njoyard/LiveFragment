define(['livefragment'], function(LiveFragment) {
	var createFragment = function(args) {
		return new LiveFragment(args[0], args[1], args[2], args[3]);
	};
	
	var getExpectedValues = function(args) {
		var parent = args[0],
			children = args[1],
			prevSibling = args[2],
			nextSibling = args[3];
		
		if (!children) {
			/* Unspecified children => parent children */
			children = parent.childNodes;
		}
		
		if (!prevSibling && children.length) {
			/* Find previous sibling from first child */
			prevSibling = children[0].previousSibling;
		}
		
		if (!nextSibling && children.length) {
			/* Find next sibling from last child */
			nextSibling = children[children.length - 1].nextSibling;
		}
	
		return {
			parentNode: parent,
			hasChildNodes: children.length > 0,
			firstChild: children[0] || null,
			lastChild: children[children.length - 1] || null,
			childNodes: children,
			previousSibling: prevSibling || null,
			nextSibling: nextSibling || null
		};
	};

	return {
		"LiveFragment creation": function() {
			expect( createFragment(this) instanceof LiveFragment ).toBe( true );
		},
		
		"LiveFragment#parentNode": function() {
			expect( createFragment(this).parentNode )
				.toBe( getExpectedValues(this).parentNode );
		},
		
		"LiveFragment#hasChildNodes()": function() {
			expect( createFragment(this).hasChildNodes() )
				.toBe( getExpectedValues(this).hasChildNodes );
		},
		
		"LiveFragment#firstChild": function() {
			expect( createFragment(this).firstChild )
				.toBe( getExpectedValues(this).firstChild );
		},
		
		"LiveFragment#lastChild": function() {
			expect( createFragment(this).lastChild )
				.toBe( getExpectedValues(this).lastChild );
		},
		
		"LiveFragment#previousSibling": function() {
			expect( createFragment(this).previousSibling )
				.toBe( getExpectedValues(this).previousSibling );
		},
		
		"LiveFragment#nextSibling": function() {
			expect( createFragment(this).nextSibling )
				.toBe( getExpectedValues(this).nextSibling );
		},
		
		"LiveFragment#childNodes": function() {
			var actual = createFragment(this).childNodes,
				expected = getExpectedValues(this).childNodes,
				i, len;
			
			expect( actual.length ).toBe( expected.length );
			if (actual.length === expected.length) {
				for (i = 0, len = actual.length; i < len; i++) {
					expect( actual[i] ).toBe( expected[i] );
				}
			}
		}
	};
});
