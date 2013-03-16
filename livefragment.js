(function(global) {
	"use strict";

	var slice = Array.prototype.slice,
		DOCUMENT_FRAGMENT_NODE = 11,
		domExceptions,
		makeDOMException, LiveFragment, previous, privateGetter;

	/* Browser vendors: please allow instanciating DOMExceptions ! */
	domExceptions = {
		"8": "NotFoundError",
		"9": "NotSupportedError"
	};
	makeDOMException = function makeDOMException(code) {
		var exc = Object.create(new Error(domExceptions[code] + ": DOM Exception " + code));
		
		exc.code = code;
		exc.name = domExceptions[code];
		
		return exc;
	};

	
	/*
	 * LiveFragment object; used to represent a "live"-DocumentFragment.
	 *
	 * Has the same API as a DocumentFragment, with some additions.  Operations
	 * on a LiveFragment are propagated to its parent.
	 *
	 * new LiveFragment(parent)
	 *  creates a LiveFragment holding all child nodes of `parent`.
	 *
	 * new LiveFragment([nodes])
	 *  creates a LiveFragment holding all nodes in `nodes`, which must be
	 *  contiguous and have the same parent
	 *
	 * new LiveFragment(prevSibling, nextSibling)
	 *  creates a LiveFragment between `prevSibling` and `nextSibling`.  At least
	 *  one of the arguments must be non-null, and when they are both present, they
	 *  must have the same parent and be specified in the right order.
	 */
	LiveFragment = function LiveFragment() {
		var args = [].slice.call(arguments),
			valid = false,
			parent, children, prev, next, node, i, len;
		
		if (args.length === 2) {
			prev = args[0];
			next = args[1];
			
			if (prev || next) {
				parent = prev ? prev.parentNode : next.parentNode;
				children = [];
				node = prev ? prev.nextSibling : parent.firstChild;
				
				while (node && node !== next) {
					children.push(node);
					node = node.nextSibling;
				}
				
				if (node === next) {
					valid = true;
				}
			}
		} else if (args.length == 1) {
			if (typeof args[0].length === 'number' && args[0].length > 0) {
				children = [].slice.call(args[0]);
				parent = children[0].parentNode;
				node = prev = children[0].previousSibling;
				
				for (i = 0, len = children.length; i < len; node = children[i++]) {
					if (node && node.nextSibling !== children[i]) {
						throw makeDOMException(9);
					}
				}
				
				next = children[len - 1].nextSibling;
				valid = true;
			} else if (typeof args[0].nodeType === 'number') {
				parent = args[0];
				children = [].slice.call(parent.childNodes);
				prev = next = null;
				valid = true;
			}
		}
		
		if (!valid) {
			throw makeDOMException(9);
		}
		
		this._parentNode = parent;
		this._childNodes = children;
		this._previousSibling = prev || null;
		this._nextSibling = next || null;
		this._ownerDocument = this._parentNode.ownerDocument;
		this._nodeType = DOCUMENT_FRAGMENT_NODE;
	};
	
	LiveFragment.prototype = {
		/* Append node to fragment, removing it from its parent first.
			Can be called with a DocumentFragment or a LiveFragment */
		appendChild: function(node) {
			if (node instanceof LiveFragment) {
				node = node.getDocumentFragment();
			}
			
			if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
				slice.call(node.childNodes).forEach(this.appendChild, this);
				return;
			}
		
			// Remove child from its parent first
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
			
			this._removeChildNoFail(node);
		
			if (this.nextSibling) {
				this._parentNode.insertBefore(node, this.nextSibling);
			} else {
				this._parentNode.appendChild(node);
			}
			
			this._childNodes.push(node);
			
			return node;
		},
		
		/* Insert node into fragment before reference node, removing it from its
			parent first. Can be called with a DocumentFragment or a
			LiveFragment */
		insertBefore: function(newNode, refNode) {
			var index;
			
			if (!refNode) {
				return this.appendChild(newNode);
			}
			
			if (newNode instanceof LiveFragment) {
				newNode = newNode.getDocumentFragment();
			}
			
			if (newNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
				slice.call(newNode.childNodes).forEach(function(n) {
					this.insertBefore(n, refNode);
				}, this);
				return;
			}
			
			// Remove child from its parent first
			if (newNode.parentNode) {
				newNode.parentNode.removeChild(newNode);
			}
			
			this._removeChildNoFail(newNode);
			
			index = this._childNodes.indexOf(refNode);
			
			if (index === -1) {
				throw makeDOMException(8);
			}
			
			this._parentNode.insertBefore(newNode, refNode);
			this._childNodes.splice(index, 0, newNode);
			
			return newNode;
		},
		
		/* Remove node from fragment */
		removeChild: function(node) {
			var index = this._childNodes.indexOf(node);
			
			if (index === -1) {
				throw makeDOMException(8);
			}
			
			this._parentNode.removeChild(node);
			this._childNodes.splice(index, 1);
			
			return node;
		},
		
		_removeChildNoFail: function(node) {
			var index = this._childNodes.indexOf(node);
			
			if (index === -1) {
				return;
			}
			
			this._parentNode.removeChild(node);
			this._childNodes.splice(index, 1);
			
			return node;
		},
		
		/* Replace node in fragment */
		replaceChild: function(newNode, oldNode) {
			var index = this._childNodes.indexOf(oldNode);
			
			if (index === -1) {
				throw makeDOMException(8);
			}
			
			this._parentNode.replaceChild(newNode, oldNode);
			this._childNodes.splice(index, 1, newNode);
			
			return oldNode;
		},
		
		/* Remove all nodes from fragment */
		empty: function() {
			this._childNodes.forEach(function(node) {
				this._parentNode.removeChild(node);
			}, this);
			
			this._childNodes = [];
		},
		
		/* Extend fragment to adjacent node */
		extend: function(node) {
			if (node) {
				if (node === this._nextSibling) {
					this._childNodes.push(this._nextSibling);
					this._nextSibling = this._nextSibling.nextSibling;
					return;
				}
				
				if (node === this._previousSibling) {
					this._childNodes.unshift(this._previousSibling);
					this._previousSibling = this._previousSibling.previousSibling;
					return;
				}
			}
			
			throw makeDOMException(8);
		},
		
		/* Shrink fragment by removing extremal node */
		shrink: function(node) {
			if (node) {
				if (node === this.firstChild) {
					this._childNodes.shift();
					this._previousSibling = node;
					return;
				}
				
				if (node === this.lastChild) {
					this._childNodes.pop();
					this._nextSibling = node;
					return;
				}
			}
			
			throw makeDOMException(8);
		},
		
		/* Empty LiveFragment and return a DocumentFragment with all nodes.
			Useful to perform operations on nodes while detached from the
			document.  Call LiveFragment#appendChild with the DocumentFragment
			to reattach nodes.  Useless when LiveFragment is empty. */
		getDocumentFragment: function() {
			var frag = this.ownerDocument.createDocumentFragment();
			this._childNodes.forEach(frag.appendChild, frag);
			this._childNodes = [];
			return frag;
		},
		
		hasChildNodes: function() {
			return this._childNodes.length > 0;
		},
		
		/* Prepend node inside frament */
		prepend: function(node) {
			this.insertBefore(node, this.firstChild);
		},
		
		/* Append node inside fragment */
		append: function(node) {
			this.appendChild(node);
		},
		
		/* Insert node outside and before fragment */
		before: function(node) {
			var newPrevious;
			
			if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
				newPrevious = node.lastChild;
			} else {
				newPrevious = node;
			}
			
			this.parentNode.insertBefore(node, this.firstChild || this.nextSibling);
			this._previousSibling = newPrevious;
		},
		
		/* Insert node outside and after fragment */
		after: function(node) {
			var newNext;
			
			if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
				newNext = node.firstChild;
			} else {
				newNext = node;
			}
			
			this.parentNode.insertBefore(node, this.nextSibling);
			this._nextSibling = newNext;
		},
		
		/* Replace nodes in this fragment */
		replace: function(node) {
			var newChildren;
			
			if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
				newChildren = [].slice.call(node.childNodes);
			} else {
				newChildren = [node];
			}
			
			this.parentNode.insertBefore(node, this.nextSibling);
			this.empty();
			
			this._childNodes = newChildren;
		},
		
		/* Remove nodes in this fragment */
		remove: function() {
			this.empty();
		},
		
		/* Check for child existence */
		contains: function(node) {
			var i, len;
			
			if (node === this) {
				return true;
			} else {
				for (i = 0, len = this._childNodes.length; i < len; i++) {
					if (this._childNodes[i].contains(node)) {
						return true;
					}
				}
			}
			
			return false;
		}
	};
	
	LiveFragment.prototype.__defineGetter__("firstChild", function() {
		return this._childNodes[0] || null;
	});
	
	LiveFragment.prototype.__defineGetter__("lastChild", function() {
		return this._childNodes[this._childNodes.length - 1] || null;
	});
	
	LiveFragment.prototype.__defineGetter__("childNodes", function() {
		return this._childNodes;
	});
	
	privateGetter = function(property) {
		return function() {
			return this["_" + property];
		};
	};
	
	["parentNode", "previousSibling", "nextSibling", "ownerDocument",
		"nodeType"].forEach(function(prop) {
		LiveFragment.prototype.__defineGetter__(prop, privateGetter(prop));
	});
		
	if (typeof global.define === 'function' && global.define.amd) {
		global.define(function() {
			return LiveFragment;
		});
	} else {
		previous = global.LiveFragment;
		
		LiveFragment.noConflict = function() {
			global.LiveFragment = previous;
			return LiveFragment;
		};
		
		global.LiveFragment = LiveFragment;
	}
}(this));
