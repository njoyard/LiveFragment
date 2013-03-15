/*jshint es5:true */
/*global DOMException */
(function(global) {
	"use strict";

	var slice = Array.prototype.slice,
		DOCUMENT_FRAGMENT_NODE = 11,
		DOMException_, LiveFragment, previous;

	/* Browser vendors: please allow instanciating DOMExceptions ! */
	DOMException_ = function DOMException_(code, name, message) {
		this.code = code;
		this.name = name;
		this.message = message;
	};
	DOMException_.prototype = (DOMException || Error).prototype;

	
	/*
	 * LiveFragment object; used to represent a "live"-DocumentFragment.
	 *
	 * Has the same API as a DocumentFragment, with some additions.  Operations
	 * on a LiveFragment are propagated to its parent.
	 *
	 * new LiveFragment(node)
	 *  creates a LiveFragment holding all child nodes of 'node'.  Can be used
	 *  with a "real" node, a DocumentFragment or an other LiveFragment.
	 *
	 * new LiveFragment(node, [], prevNode, nextNode)
	 *  creates an empty LiveFragment inside 'node' between 'prevNode' and
	 *  'nextNode'
	 *
	 * new LiveFragment(node, [nodes...])
	 *  creates a LiveFragment holding a subset of child nodes from 'node'.  The
	 *  subset must be contiguous (and it may be an Array or a NodeList).
	 */
	LiveFragment = function LiveFragment(parent, nodes, prev, next) {
		prev = prev || null;
		next = next || null;
	
		if (typeof nodes === 'undefined') {
			this._childNodes = slice.call(parent.childNodes);
			this.previousSibling = null;
			this.nextSibling = null;
		} else {
			if (nodes.length === 0) {
				/* If prev is null, next must be firstChild, which means an
					empty LiveFragment at the beginning of parent. Same thing if
					next is null. Corollary: prev and next can be null if parent
					is empty. */
				if ((!prev && next !== parent.firstChild) ||
					(!next && prev !== parent.lastChild)) {
					throw new Error("Cannot find adjacent siblings");
				}
			
				// TODO check validity of prev/next
				this.previousSibling = prev;
				this.nextSibling = next;
			} else {
				// TODO check whether nodes are contiguous
				this.previousSibling = nodes[0].previousSibling;
				this.nextSibling = nodes[nodes.length - 1].nextSibling;
			}
			
			this._childNodes = slice.call(nodes);
		}
		
		if (parent instanceof LiveFragment) {
			this._parentNode = parent.parentNode;
		} else {
			// TODO check validity of parent
			this._parentNode = parent;
		}
		
		this.ownerDocument = this._parentNode.ownerDocument;
		this.nodeType = DOCUMENT_FRAGMENT_NODE;
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
				throw new DOMException_(8, "NotFoundError",	"NotFoundError: DOM Exception 8");
			}
			
			this._parentNode.insertBefore(newNode, refNode);
			this._childNodes.splice(index, 0, newNode);
			
			return newNode;
		},
		
		/* Remove node from fragment */
		removeChild: function(node) {
			var index = this._childNodes.indexOf(node);
			
			if (index === -1) {
				throw new DOMException_(8, "NotFoundError",	"NotFoundError: DOM Exception 8");
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
				throw new DOMException_(8, "NotFoundError", "NotFoundError: DOM Exception 8");
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
				if (node === this.nextSibling) {
					this._childNodes.push(this.nextSibling);
					this.nextSibling = this.nextSibling.nextSibling;
					return;
				}
				
				if (node === this.previousSibling) {
					this._childNodes.unshift(this.previousSibling);
					this.previousSibling = this.previousSibling.previousSibling;
					return;
				}
			}
			
			throw new DOMException_(8, "NotFoundError", "NotFoundError: DOM Exception 8");
		},
		
		/* Shrink fragment by removing extremal node */
		shrink: function(node) {
			if (node) {
				if (node === this.firstChild) {
					this._childNodes.shift();
					this.previousSibling = node;
					return;
				}
				
				if (node === this.lastChild) {
					this._childNodes.pop();
					this.nextSibling = node;
					return;
				}
			}
			
			throw new DOMException_(8, "NotFoundError", "NotFoundError: DOM Exception 8");
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
	
	LiveFragment.prototype.__defineGetter__("parentNode", function() {
		return this._parentNode;
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
