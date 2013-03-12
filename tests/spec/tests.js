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

	
	var checkNodeRelations = function(fragment, node, position, previous, next) {
		// Check hasChildNodes()
		expect( fragment.hasChildNodes() ).toBe( true );

		// Check childNodes, firstChild, lastChild
		expect( fragment.childNodes[position] ).toBe( node );

		if (!previous) {
			expect( fragment.firstChild ).toBe( node );
		}

		if (!next) {
			expect( fragment.lastChild ).toBe( node );
		}

		// Check relations with siblings 
		if (previous) {
			expect( previous.nextSibling ).toBe( node );
		} else if (fragment.previousSibling) {
			expect( fragment.previousSibling.nextSibling ).toBe( node );
		}

		if (next) {
			expect( next.previousSibling ).toBe( node );
		} else if (fragment.nextSibling) {
			expect( fragment.nextSibling.previousSibling ).toBe( node );
		}
		expect( node.previousSibling ).toBe( previous || fragment.previousSibling );
		expect( node.nextSibling ).toBe( next || fragment.nextSibling );

		// Check relations with parent node
		expect( node.parentNode ).toBe( fragment.parentNode );
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
		},

		"LiveFragment#appendChild(new node)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				prev = fragment.lastChild,
				children = fragment.childNodes.length,
				result;

			node.className = "appended";
			result = fragment.appendChild(node);

			expect( result ).toBe( node );
			checkNodeRelations(fragment, node, children, prev, null);

			node.parentNode.removeChild(node);
		},

		"LiveFragment#appendChild(node already in document)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				prev = fragment.lastChild,
				children = fragment.childNodes.length,
				result;

			node.className = "appended";

			document.body.appendChild(node);
			result = fragment.appendChild(node);

			expect( result ).toBe( node );
			checkNodeRelations(fragment, node, children, prev, null);

			node.parentNode.removeChild(node);
		},

		"LiveFragment#insertBefore(new node)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				next = fragment.lastChild,
				children = fragment.childNodes.length,
				prev = children > 1 ? next.previousSibling : null,
				result;

			node.className = "appended";

			result = fragment.insertBefore(node, next);
			
			expect( result ).toBe( node );
			checkNodeRelations(fragment, node, children > 0 ? children - 1 : 0, prev, next);

			node.parentNode.removeChild(node);
		},

		"LiveFragment#insertBefore(node already in document)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				next = fragment.lastChild,
				children = fragment.childNodes.length,
				prev = children > 1 ? next.previousSibling : null,
				result;

			node.className = "appended";

			document.body.appendChild(node);
			result = fragment.insertBefore(node, next);
			
			expect( result ).toBe( node );
			checkNodeRelations(fragment, node, children > 0 ? children - 1 : 0, prev, next);

			node.parentNode.removeChild(node);
		},

		"LiveFragment#insertBefore(unknown reference node) throws DOMException 8": function() {
			var fragment = createFragment("this"),
				node = document.createElement("div"),
				ref = document.createElement("div"),
				exc;

			node.className = "appended";
			ref.className = "reference";

			document.body.appendChild(ref);
			try {
				fragment.insertBefore(node, ref);
			} catch(e) {
				exc = e;
			}

			expect( exc instanceof DOMException ).toBe( true );
			expect( exc.code ).toBe( 8 );
			expect( exc.name ).toBe( "NotFoundError" );

			ref.parentNode.removeChild(ref);
		}

	};
});
