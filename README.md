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
will _not_ add them to `myFragment`.

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

### `LiveFragment#childNodes`

### `LiveFragment#firstChild`

### `LiveFragment#lastChild`

### `LiveFragment#previousSibling`

### `LiveFragment#nextSibling`

### `LiveFragment#hasChildNodes()`

### `LiveFragment#appendChild(node)`

### `LiveFragment#insertBefore(node, refNode)`

### `LiveFragment#removeChild(node)`

### `LiveFragment#replaceChild(node, refNode)`

Caveats
-------

Additional helper methods
-------------------------

### `LiveFragment#empty()`

### `LiveFragment#extend(node)`

### `LiveFragment#shrink(node)`

### `LiveFragment#getDocumentFragment()`

Plans
-----