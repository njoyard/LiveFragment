/*global define, expect, document, DOMException */
define(['livefragment'], function(LiveFragment) {
	/* Create a LiveFragment from a definition in `fragments` */
	var createFragment = function(args) {
		return new LiveFragment(args[0], args[1], args[2], args[3]);
	};
	
	/* Return expected LiveFragment property values from a definition in `fragments` */
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

	/* Check `node` relations within `fragment`.
		It is expected to be at `position`, following `previous` (unless null) and
		preceding `next` (unless null).  If specified, those siblings must also be
		in the fragment.  When one of them is null, it means `node` is either at
		the beginning or end of the fragment, and thus we test for relations with
		the fragment siblings directly.
	 */
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
	
	/* Check if `run` throws given DOMException */
	var expectDOMException = function(code, name, run) {
		var exc;
		
		try {
			run();
		} catch(e) {
			exc = e;
		}

		expect( exc instanceof DOMException ).toBe( true );
		expect( exc instanceof Error ).toBe( true );
		expect( exc.code ).toBe( code );
		expect( exc.name ).toBe( name );
		expect( exc.message ).toBe( name + ": DOM Exception " + code );
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
			var fragment = createFragment(this),
				node = document.createElement("div"),
				ref = document.createElement("div");

			node.className = "appended";
			ref.className = "reference";

			document.body.appendChild(ref);
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.insertBefore(node, ref);
			});

			ref.parentNode.removeChild(ref);
		},

		"LiveFragment#removeChild()": function() {
			var fragment = createFragment(this),
				firstChild = fragment.firstChild,
				nextSibling, previousSibling, removed;

			if (firstChild) {
				previousSibling = firstChild.previousSibling;
				nextSibling = firstChild.nextSibling;

				removed = fragment.removeChild(firstChild);

				expect( removed ).toBe( firstChild );
				expect( removed.parentNode ).toBe( null );
				expect( removed.nextSibling ).toBe( null );
				expect( removed.previousSibling ).toBe( null );
				
				fragment.parentNode.insertBefore(removed, fragment.firstChild);
			}
		},
		
		"LiveFragment#removeChild(unknown reference node) throws DOMException 8": function() {
			var fragment = createFragment(this),
				ref = document.createElement("div"),
				exc;

			ref.className = "reference";
			document.body.appendChild(ref);
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.removeChild(ref);
			});
			
			ref.parentNode.removeChild(ref);
		},
		
		"LiveFragment#replaceChild(new node)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				replaced = fragment.firstChild,
				next, result;
				
			node.className = "replacement";
			
			if (replaced) {
				next = replaced.nextSibling;
				result = fragment.replaceChild(node, replaced);
			
				expect( result ).toBe( replaced );
				expect( replaced.parentNode ).toBe( null );
				checkNodeRelations(fragment, node, 0, null, next);
				
				node.parentNode.replaceChild(replaced, node);
			}
		},
		
		"LiveFragment#replaceChild(node already in document)": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				replaced = fragment.firstChild,
				next, result;
				
			node.className = "replacement";
			
			if (replaced) {
				document.body.appendChild(node);
				
				next = replaced.nextSibling;
				result = fragment.replaceChild(node, replaced);
			
				expect( result ).toBe( replaced );
				expect( replaced.parentNode ).toBe( null );
				checkNodeRelations(fragment, node, 0, null, next);
				
				node.parentNode.replaceChild(replaced, node);
			}
		},
		
		"LiveFragment#replaceChild(unknown reference node) throws DOMException 8": function() {
			var fragment = createFragment(this),
				node = document.createElement("div"),
				ref = document.createElement("div"),
				exc;
				
			node.className = "replacement";
			ref.className = "reference";
			
			document.body.appendChild(ref);
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.replaceChild(node, ref);
			});
			
			ref.parentNode.removeChild(ref);
		},
		
		"LiveFragment#empty()": function() {
			var fragment = createFragment(this),
				childNodes = [].slice.call(fragment.childNodes);
				
			fragment.empty();
			
			expect( fragment.hasChildNodes() ).toBe( false );
			expect( fragment.childNodes.length ).toBe( 0 );
			childNodes.forEach(function(child) {
				expect( child.parentNode ).toBe( null );
			});
			
			childNodes.forEach(function(child) {
				fragment.appendChild(child);
			});
		},
		
		"LiveFragment#extend(nextSibling)": function() {
			var fragment = createFragment(this),
				lastChild = fragment.lastChild,
				nextSibling = fragment.nextSibling,
				children = fragment.childNodes.length;
		
			if (nextSibling) {
				fragment.extend(nextSibling);
				checkNodeRelations(fragment, nextSibling, children, lastChild, null);
			}
		},
		
		"LiveFragment#extend(previousSibling)": function() {
			var fragment = createFragment(this),
				firstChild = fragment.firstChild,
				previousSibling = fragment.previousSibling;
		
			if (previousSibling) {
				fragment.extend(previousSibling);
				checkNodeRelations(fragment, previousSibling, 0, null, firstChild);
			}
		},
		
		"LiveFragment#extend(child node) throws DOMException 8": function() {
			var fragment = createFragment(this),
				firstChild = fragment.firstChild;
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.extend(firstChild);
			});
		},
		
		"LiveFragment#extend(node outside parent) throws DOMExeption 8": function() {
			var fragment = createFragment(this),
				node = document.createElement("div");
			
			node.className = "reference";
			document.body.appendChild(node);
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.extend(node);
			});
			
			node.parentNode.removeChild(node);
		},
		
		"LiveFragment#extend(invalid sibling) throws DOMException 8": function() {
			var fragment = createFragment(this),
				node = document.createElement("div");
				
			node.className = "invalidSibling";
			
			if (fragment.nextSibling !== null) {
				fragment.parentNode.appendChild(node);
				
				expectDOMException(8, "NotFoundError", function() {
					fragment.extend(node);
				});
				
				node.parentNode.removeChild(node);
			}
			
			if (fragment.previousSibling !== null) {
				fragment.parentNode.insertBefore(node, fragment.parentNode.firstChild);
				
				expectDOMException(8, "NotFoundError", function() {
					fragment.extend(node);
				});
				
				node.parentNode.removeChild(node);
			}
		},
		
		"LiveFragment#shrink(firstChild)": function() {
			var fragment = createFragment(this),
				firstChild = fragment.firstChild;
				
			if (firstChild) {
				fragment.shrink(firstChild);
				
				expect( fragment.childNodes.indexOf(firstChild) ).toBe( -1 );
				expect( fragment.previousSibling ).toBe( firstChild );
				
				if (fragment.hasChildNodes()) {
					expect( fragment.firstChild ).toBe( firstChild.nextSibling );
				}
			}
		},
		
		"LiveFragment#shrink(lastChild)": function() {
			var fragment = createFragment(this),
				lastChild = fragment.lastChild;
				
			if (lastChild) {
				fragment.shrink(lastChild);
				
				expect( fragment.childNodes.indexOf(lastChild) ).toBe( -1 );
				expect( fragment.nextSibling ).toBe( lastChild );
				
				if (fragment.hasChildNodes()) {
					expect( fragment.lastChild ).toBe( lastChild.previousSibling );
				}
			}
		},
		
		"LiveFragment#shrink(other child) throws DOMException 8": function() {
			var fragment = createFragment(this);
			
			if (fragment.childNodes.length > 2) {
				expectDOMException(8, "NotFoundError", function() {
					fragment.shrink(fragment.childNodes[1]);
				});
			}
		},
		
		"LiveFragment#shrink(unknown node) throws DOMException 8": function() {
			var fragment = createFragment(this),
				node = document.createElement("div");
				
			node.className = "unknown";
			document.body.appendChild(node);
			
			expectDOMException(8, "NotFoundError", function() {
				fragment.shrink(node);
			});
			
			node.parentNode.removeChild(node);
		},
		
		"LiveFragment#getDocumentFragment": function() {
			var fragment = createFragment(this),
				children = [].slice.call(fragment.childNodes),
				result;
				
			result = fragment.getDocumentFragment();
			
			expect( result.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( result.ownerDocument ).toBe( document );
			expect( fragment.hasChildNodes() ).toBe( false );
			
			children.forEach(function(node) {
				expect( [].slice.call(fragment.parentNode.childNodes).indexOf(node) ).toBe( -1 );
				expect( [].slice.call(result.childNodes).indexOf(node) ).toNotBe( -1 );
			});
			
			fragment.appendChild(result);
		}
	};
});