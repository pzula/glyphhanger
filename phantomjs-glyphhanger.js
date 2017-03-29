"use strict";
var webpage = require( "webpage" );
var CharacterSet = require( "characterset" );
var Rsvp = require( "rsvp" );
var args = require( "system" ).args;


var pluginName = "glyphhanger";
var options = {};

function requestUrl( url, options ) {
	return new Rsvp.Promise(function( resolve, reject ) {
		var page = webpage.create();
		var myOptions = options;

		page.onConsoleMessage = function( msg ) {
			console.log( pluginName + " phantom console:", msg );
		};

		page.onLoadFinished = function( status ) {
			console.log(args);
			console.log("logging inside onLoadFinished " + myOptions.language);
			if( status !== "success" ) {
				reject( "onLoadFinished error", status );
			}

			page.evaluateJavaScript('function() { window.OPTIONS = ' + JSON.stringify(options) + ';}');

			if( page.injectJs( "node_modules/characterset/lib/characterset.js" ) &&
					page.injectJs( "glyphhanger.js" ) ) {

				resolve( page.evaluate( function() {
					var hanger = new GlyphHanger();
					hanger.init( document.body );

					return hanger.getGlyphs();
				}) );
			} else {
				reject( "injectJs error" );
			}
		};

		page.open( url, function( status ) {
			if( status !== "success" ) {
				reject( url, status );
			}
		});
	});
}

var combinedCharacterSet = new CharacterSet();
var promises = [];

/*
 *Arguments List

 1. script name
 2. isVerbose ("true" or "false")
 3. output unicodes
 4. whitelisted characters
 5. language
 6. weight
 7 and up. urls
*/

// Remove the script name argument
args.shift();

// Verbose
var isVerbose = args.shift() === "true";

// Output code points
var isCodePoints = args.shift() === "true";

// Whitelist
var whitelist = args.shift();
if( whitelist.length ) {
	combinedCharacterSet = combinedCharacterSet.union( new CharacterSet( whitelist ) );
}

// Language
var language = args.shift();

// Weight
var weight = args.shift();


// Add URLS
args.forEach(function( url ) {
	promises.push( requestUrl( url, options ) );
	if( isVerbose ) {
		console.log( pluginName + " requesting:", url );
	}
});

if(language) {
	options.language = language;
}
if(weight) {
	options.weight = weight;
}

Rsvp.all( promises ).then( function( results ) {
	results.forEach( function( result ) {
		combinedCharacterSet.add.apply( combinedCharacterSet, result );
	});

	if( isVerbose ) {
		console.log( pluginName + " output (" + combinedCharacterSet.getSize() + "):" );
	}

	if( language ) {
		console.log( "language is " + language );
	}

	if( weight ) {
		console.log( "weight is " + weight );
	}


	if( isCodePoints ) {
		console.log( combinedCharacterSet.toArray().map(function( code ) {
				return 'U+' + code.toString(16);
			}).join(',') );
	} else {
		console.log( combinedCharacterSet.toArray().map(function( code ) {
				return String.fromCharCode( code );
			}).join('') );
	}

	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});
