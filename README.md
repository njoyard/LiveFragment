LiveFragment
============

LiveFragment is a transparent container that allows manipulating a group of
contiguous sibling DOM nodes as if they were in a real container node.

```
	+-Parent----------------------------------------+
	|        +-LiveFragment---------+               |
	| [Node] | [Node] [Node] [Node] | [Node] [Node] |
	|        +----------------------+               |
	+-----------------------------------------------+
```

You can (almost) manipulate a `LiveFragment` as if it were a real container node,
for example reading its `childNodes`, `firstChild` or `nextSibling` properties
or calling its `appendChild()`, `removeChild()` or `insertBefore()` methods.

Creation
--------

LiveFragments always have a parentNode, which is the parentNode all nodes inside
the LiveFragment will have.  The simplest form of a LiveFragment is created as
follows:

```js
var parent = document.querySelector("#i-have-lots-of-children");
var myFragment = new LiveFragment(parent);
```

In this case, `myFragment` holds all nodes that were children of `parent` at the
time of its creation.  As `parent` is the parentNode of all children of the fragment,
we also call it the parentNode of `myFragment`.  Note that adding nodes to the parent
will _not_ add them to `myFragment`, but the reverse will.

An other way of creating a LiveFragment is by passing it a contiguous slice of its
parentNode children:

```js
var parent = document.querySelector("#i-have-lots-of-children");
var children = [].slice.call(parent.childNodes, 1, 4);
var myFragment = new LiveFragment(parent, children);
```

Now `myFragment` holds the second to fourth children of `parent`.  Calling
`myFragment.appendChild(node)` will insert `node` inside `parent`, between the fourth
and fifth children.  The second argument to the `LiveFragment` constructor can be
either an `Array` or a `NodeList`.

It is also possible to create an empty LiveFragment inside a node. In this case, you
must specify where the LiveFragment resides inside its parent:

```js
var parent = document.querySelector("#i-have-lots-of-children");
var child = parent.querySelector(".someChild");
var myFragment = new LiveFragment(parent, [], child, child.nextSibling);
```

Here, calling `myFragment.appendChild(node)` will insert `node` inside `parent` between
`child` and its next sibling.  Note that when creating an empty LiveFragment, the third
and fourth arguments can be `null` when the LiveFragment resides at the beginning or at
the end of its parent (or both, if the parent is empty).

DOM interface
-------------

### `LiveFragment#parentNode`

Returns the parentNode, which is the parent of all nodes contained in the
LiveFragment.  This is the node that was used as the first parameter of the
`LiveFragment` constructor.

### `LiveFragment#childNodes`

This is an `Array`, not a `NodeList`.  It contains all nodes currently in the
LiveFragment.

### `LiveFragment#firstChild`

Returns the first node inside the LiveFragment, or `null` if there are none.
This is equivalent to `childNodes[0]`.

### `LiveFragment#lastChild`

Returns the last node inside the LiveFragment, or `null` if there are none.
This is equivalent to `childNodes[childNodes.length - 1]`.

### `LiveFragment#previousSibling`

Returns the last node in the parentNode and before the LiveFragment, or `null` if
there are none. This is equivalent to `firstChild.previousSibling` when there are
nodes inside the LiveFragment.

### `LiveFragment#nextSibling`

Returns the first node in the parentNode and after the LiveFragment, or `null` if
there are none. This is equivalent to `lastChild.nextSibling` when there are nodes
inside the LiveFragment.

### `LiveFragment#hasChildNodes()`

Returns `true` if and only if the LiveFragment has children.

### `LiveFragment#appendChild(node)`

Adds `node` to the end of the LiveFragment, and also to `parentNode`, just before
`nextSibling`.  `node` is removed from its parent, if it already has one, when doing
this.  When `node` is a DocumentFragment or another LiveFragment, they are emptied
in the operation, but the LiveFragment stays in its `parentNode`.

### `LiveFragment#insertBefore(node, refNode)`

Inserts `node` just before `refNode` or at the end of the LiveFragment if `refNode`
is `null`.  `node` is also inserted in `parentNode`.  `node` is removed from its
parent, if it already has one, when doing this.  When `node` is a DocumentFragment
or another LiveFragment, they are emptied in the operation, but the LiveFragment
stays in its `parentNode`.

Note that when `refNode` is not `null`, it must be in the LiveFragment, or a
NOT_FOUND_ERR DOM Exception is thrown.

### `LiveFragment#removeChild(node)`

Removes `node` from the LiveFragment and also from `parentNode`.  `node` must be in
the LiveFragment, or a NOT_FOUND_ERR DOM Exception is thrown.

### `LiveFragment#replaceChild(node, refNode)`

Replaces `refNode` with `node` in the LiveFragment and also in `parentNode`.  `node`
is removed from its parent, if it already has one, when doing this.

Note that `refNode` must be in the LiveFragment, or a NOT_FOUND_ERR DOM Exception
is thrown.

Caveats
-------

* `LiveFragment#childNodes` should not be modified directly.  
* No outside operation (to be defined)
* Not real DOM exceptions

Additional helper methods
-------------------------

### `LiveFragment#empty()`

This method removes all nodes from the LiveFragment and its parentNode, just as
calling `LiveFragment#removeChild()` on every child node.

### `LiveFragment#extend(node)`

This method extends a LiveFragment to a direct sibling node.  It only works when
called with either the node that precedes the LiveFragment in its parentNode or the
node that follows it.  Any other argument triggers a NOT_FOUND_ERR DOM exception.

```
//	+-Parent----------------------+
//	|     +-LiveFragment+         |
//	| [A] | [B] [C] [D] | [E] [F] |
//	|     +-------------+         |
//	+-----------------------------+

liveFragment.extend(E);

//	+-Parent----------------------+
//	|     +-LiveFragment----+     |
//	| [A] | [B] [C] [D] [E] | [F] |
//	|     +-----------------+     |
//	+-----------------------------+
```

### `LiveFragment#shrink(node)`

This method is the reverse from `#extend()`.  It removes a node from the LiveFragment
but keeps it in the parentNode.  It only works when called with either the first or
the last node in the LiveFragment.  Any other argument triggers a NOT_FOUND_ERR DOM
exception.

```
//	+-Parent----------------------+
//	|     +-LiveFragment----+     |
//	| [A] | [B] [C] [D] [E] | [F] |
//	|     +-----------------+     |
//	+-----------------------------+

liveFragment.shrink(B);

//	+-Parent----------------------+
//	|         +-LiveFragment+     |
//	| [A] [B] | [C] [D] [E] | [F] |
//	|         +-------------+     |
//	+-----------------------------+
```

### `LiveFragment#getDocumentFragment()`

This method removes all nodes from the LiveFragment and its parentNode, and returns
them inside a newly created DocumentFragment.  This may be useful to extract nodes
from the document before performing operations on them:

```js
// Extract nodes from the document
var extractedNodes = liveFragment.getDocumentFragment()

// Perform heavy operations
heavyTransformation(extractedNodes);

// Get the transformed nodes back in place
liveFragment.appendChild(extractedNodes);
```

Plans
-----

* Automatic detection of changes made from the outside (i.e. without calling the
  LiveFragment methods)
* Allow nested LiveFragments
* More DOM interfaces
* Easier constructor syntax

