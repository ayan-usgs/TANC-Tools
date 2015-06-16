if(!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
    if(typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
    	throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");
	var aArgs = Array.prototype.slice.call(arguments, 1), 
	fToBind = this, 
	fNOP = function () {},
	fBound = function () {
		return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
	};

	fNOP.prototype = this.prototype;
	fBound.prototype = new fNOP();
		return fBound;
	};
}
if(!Object.keys) Object.keys = function(o){  
	if (o !== Object(o)) throw new TypeError('Object.keys called on non-object');  
	var ret=[],p;  
	for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);  
	return ret;  
}; 
function isNumber(input) {
	// type coercion to test for number
    return (input - 0) == input && input.length > 0;
}
function isDefined(value) {
	return typeof value !== 'undefined';
}
function isObject(value) {
	return typeof value === 'object';
}
function isFunction(value) {
	return typeof value === 'function';
}
function deepClone(obj) {
	// do not clone function or raw types
	if ( ! isObject(obj) || isFunction(obj) ) return obj;
	
	var clone = {};
	var keys  = Object.keys(obj);
	var k;
	for (k in keys) {
		var key = keys[k];
		clone.key = deepClone(obj.key);
	}
	return clone;
}
if ( ! String.prototype.isBlank ) {
	String.prototype.isBlank = function() {
		return this.trim().length == 0
	}
}
if (!String.prototype.replaceAt) {
	String.prototype.replaceAt=function(index, rep) {
		return this.substr(0, index) + rep + this.substr(index+rep.length);
	};
}
if (!String.prototype.startsWith) {
    /**
     * APIMethod: String.startsWith
     * *Deprecated*. Whether or not a string starts with another string. 
     * 
     * Parameters:
     * sStart - {String} The string we're testing for.
     *  
     * Returns:
     * {Boolean} Whether or not this string starts with the string passed in.
     */
    String.prototype.startsWith = function(sStart) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                {'newMethod':'OpenLayers.String.startsWith'}));
        return OpenLayers.String.startsWith(this, sStart);
    };
}
if (!String.prototype.contains) {
    /**
     * APIMethod: String.contains
     * *Deprecated*. Whether or not a string contains another string.
     * 
     * Parameters:
     * str - {String} The string that we're testing for.
     * 
     * Returns:
     * {Boolean} Whether or not this string contains with the string passed in.
     */
    String.prototype.contains = function(str) {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.contains'}));
        return OpenLayers.String.contains(this, str);
    };
}
if (!String.prototype.trim) {
    /**
     * APIMethod: String.trim
     * *Deprecated*. Removes leading and trailing whitespace characters from a string.
     * 
     * Returns:
     * {String} A trimmed version of the string - all leading and 
     *          trailing spaces removed
     */
    String.prototype.trim = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                      {'newMethod':'OpenLayers.String.trim'}));
        return OpenLayers.String.trim(this);
    };
}
if (!String.prototype.camelize) {
    /**
     * APIMethod: String.camelize
     * *Deprecated*. Camel-case a hyphenated string. 
     *     Ex. "chicken-head" becomes "chickenHead", and
     *     "-chicken-head" becomes "ChickenHead".
     * 
     * Returns:
     * {String} The string, camelized
     */
    String.prototype.camelize = function() {
        OpenLayers.Console.warn(OpenLayers.i18n("methodDeprecated",
                                  {'newMethod':'OpenLayers.String.camelize'}));
        return OpenLayers.String.camelize(this);
    };
}


/**
 * trim DOM-XSS chars from url
 * this is for tanc project needs and should be enh for other uses
 **/
function parseDomXss(str) {
	var end = str.search(/[^#\w-_]/)
	if (end < 0) return str;
	return str.substring(0,end);
}
