/*global define, document */
define(function() {
	var full = document.querySelector(".full"),
		empty = document.querySelector(".empty");
	
	/* Categorized fragment definitions to run tests against.
		Each definition is basically an array containing the arguments to pass
		to the LiveFragment constructor. */
	return {
		"empty fragment": {
			"from existing empty node": [empty],
			"between existing nodes": [full.querySelector(".child0"), full.querySelector(".child1")],
			"before existing node": [null, full.querySelector(".child0")],
			"after existing node": [full.querySelector(".child9"), null]
		},
		
		"non-empty fragment": {
			"from existing non-empty node": [full],
			"at the beginning of parent": [[
					full.querySelector(".child0"),
					full.querySelector(".child1"),
					full.querySelector(".child2")
				]],
			"in the middle of parent": [[
					full.querySelector(".child3"),
					full.querySelector(".child4"),
					full.querySelector(".child5"),
					full.querySelector(".child6")
				]],
			"at the end of parent": [[
					full.querySelector(".child7"),
					full.querySelector(".child8"),
					full.querySelector(".child9")
				]]
		}
	};
});
