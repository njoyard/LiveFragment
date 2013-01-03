define(function() {
	var full = document.querySelector(".full"),
		empty = document.querySelector(".empty");
	
	return {
		"empty fragment": {
			"from existing empty node": [empty],
			"between existing nodes": [full, [], full.querySelector(".child0"), full.querySelector(".child1")],
			"before existing node": [full, [], null, full.querySelector(".child0")],
			"after existing node": [full, [], full.querySelector(".child9")],
			"inside empty node": [empty, []]
		},
		
		"non-empty fragment": {
			"from existing non-empty node": [full],
			"at the beginning of parent": [full, [
					full.querySelector(".child0"),
					full.querySelector(".child1"),
					full.querySelector(".child2")
				]],
			"in the middle of parent": [full, [
					full.querySelector(".child3"),
					full.querySelector(".child4"),
					full.querySelector(".child5"),
					full.querySelector(".child6")
				]],
			"at the end of parent": [full, [
					full.querySelector(".child7"),
					full.querySelector(".child8"),
					full.querySelector(".child9")
				]]
		}
	};
});
