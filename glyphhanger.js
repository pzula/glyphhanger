(function( root, factory ) {
		if( typeof exports === "object" && typeof exports.nodeName !== "string" ) {
			// CommonJS
			module.exports = factory( require( "characterset" ) );
		} else {
			// Browser
			root.GlyphHanger = factory( root.CharacterSet );
		}
}( this, function( CharacterSet ) {

	var GH = function() {
		this.set = new CharacterSet();
	};

	GH.prototype.init = function( parentNode ) {
		if( parentNode ) {
			if(OPTIONS.language) {
				console.log("Yay, we're inside the language option!");
				this.findTextNodesWithLangAttribute(parentNode, OPTIONS.language).forEach(function (node) {
					this.saveGlyphs(node.nodeValue);
				}.bind(this));
			} else {
				this.findTextNodes(parentNode).forEach(function (node) {
					this.saveGlyphs(node.nodeValue);
				}.bind(this));
			}
		}
	}

	GH.prototype.findTextNodesWithLangAttribute = function(parentNode, selectedLanguage){
		var _ = this;
		var treeWalker = document.createTreeWalker(
			parentNode,
			// Only consider nodes that are text nodes (nodeType 3)
			NodeFilter.SHOW_TEXT,
			// Object containing the function to use for the acceptNode method
			// of the NodeFilter
			{
				acceptNode: function(node) {
					// Logic to determine whether to accept, reject or skip node
					// In this case, only accept nodes that have content
					// other than whitespace
					if (!/^\s*$/.test(node.data)) {
						// Test the language attribute
						var nearestParentWithLang = node.parentElement;
						if (!nearestParentWithLang.hasAttribute("lang")) {
							nearestParentWithLang = _.findNearestParentElementWithLang(node.parentElement);
						}
						if ( nearestParentWithLang.attributes["lang"].value == selectedLanguage) {
							return NodeFilter.FILTER_ACCEPT;
						}
					}
				}
			},
			false
		);

		var nodeList = [];

		while (treeWalker.nextNode()) nodeList.push(treeWalker.currentNode);

		return nodeList;
	};


	GH.prototype.findTextNodes = function( node ) {
		// via http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var all = [];
		for( node = node.firstChild; node; node = node.nextSibling ) {
			if( node.nodeType == 3 && !!node.nodeValue.trim() ) {
				all.push( node );
			} else {
				all = all.concat( this.findTextNodes( node ) );
			}
		}
		return all;
	};

	GH.prototype.findNearestParentElementWithLang = function(textParent) {
		if(!textParent) return textParent;
		while(textParent){
			if(textParent.hasAttribute("lang")) return textParent;
			else textParent = textParent.parentElement;
		}
	};

	GH.prototype.saveGlyphs = function( text ) {
		this.set = this.set.union( new CharacterSet( text ) );
	};

	GH.prototype.getGlyphs = function() {
		return this.set.toArray();
	};

	GH.prototype.toString = function() {
		return this.set.toString();
	};

	return GH;
}));
