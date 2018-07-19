/* globals $ */

// The functions corresponding to the HTML id of the field
var convertDict = {
	'base_asc': convertAsc,
	'base_bin': convertBin,
	'base_oct': convertOct,
	'base_dec': convertDec,
	'base_hex': convertHex,
	'base_64': convertB64
};

// How many characters to go through before adding a space
var splitDict = {
	'base_bin': 8,
	'base_oct': 4,
	'base_hex': 2
};

// Bases that can be converted directly with Number.parseInt()
var baseDict = {
	'base_bin': 2,
	'base_oct': 8,
	'base_hex': 16
};

$(document).ready(function () {
	$('.convertBtn').click(function (e) {
		// This gets the value and ID of the textarea node
		var val = e.target.parentNode.parentNode.childNodes[1].value;
		var type = e.target.parentNode.parentNode.childNodes[1].id;
		convertDict[type](val);
		convertFrom(type);
	});
	$('.splitBtn').click(function (e) {
		// This gets the value and ID of the textarea node
		var val = e.target.parentNode.parentNode.childNodes[1].value;
		var type = e.target.parentNode.parentNode.childNodes[1].id;
		split(type, val);
	});
});

// All data is converted to base 10 decimals, then converted from that to other units
var decData = [];

// Splits the data into groups of 1 byte
//  8 characters for binary, 4 for octal, 2 for hex
function split (type, val) {
	// Remove all spaces
	val = val.replace(/ /g, '');
	var interval = splitDict[type];
	var newStr = '';
	var counter = 0;
	// Start at the back
	for (var i = val.length - 1; i >= 0; i--) {
		newStr = val.charAt(i) + newStr;
		counter++;
		if (counter % interval === 0) {
			// Add a space
			newStr = ' ' + newStr;
		}
	}
	// Remove leading space
	if (newStr.charAt(0) === ' ') {
		newStr = newStr.substring(1);
	}
	// Make sure the first value has prepended zeroes
	if (newStr.indexOf(' ') < interval) {
		newStr = prependZero(newStr, newStr.length + (interval - newStr.indexOf(' ')));
	}
	$('#' + type).val(newStr);
}

// These series of functions convert from their respective types to decimal
function convertAsc (val) {
	decData = [];
	for (var i = 0; i < val.length; i++) {
		decData[i] = val.charCodeAt(i);
	}
}

function convertBin (val) {
	decData = [];
	var split = val.split(' ');
	for (var i = 0; i < split.length; i++) {
		var num = Number.parseInt(split[i], 2);
		isNaN(num) ? decData[i] = 0 : decData[i] = num;
	}
}

function convertOct (val) {
	decData = [];
	var split = val.split(' ');
	for (var i = 0; i < split.length; i++) {
		var num = Number.parseInt(split[i], 8);
		isNaN(num) ? decData[i] = 0 : decData[i] = num;
	}
}

function convertDec (val) {
	decData = [];
	var split = val.split(' ');
	for (var i = 0; i < split.length; i++) {
		var num = Number.parseInt(split[i]);
		isNaN(num) ? decData[i] = 0 : decData[i] = num;
	}
}

function convertHex (val) {
	decData = [];
	var split = val.split(' ');
	for (var i = 0; i < split.length; i++) {
		var num = Number.parseInt(split[i], 16);
		isNaN(num) ? decData[i] = 0 : decData[i] = num;
	}
}

function convertB64 (val) {
	var str = atob(val); // eslint-disable-line
	convertAsc(str);
}

// Convert decimal data to all other types
function convertFrom (type) {
	// Exclude the type so user input does not get over written
	var str;
	var i;
	var ascii;

	str = '';
	for (i = 0; i < decData.length; i++) {
		str += String.fromCharCode(decData[i]);
	}
	ascii = str;

	if (type !== 'base_asc') {
		$('#base_asc').val(ascii);
	}
	if (type !== 'base_64') {
		try {
			$('#base_64').val(btoa(ascii)); // eslint-disable-line
		} catch (err) {
			$('#base_64').val('> Invalid Base64');
		}
	}
	if (type !== 'base_dec') {
		str = '';
		for (i = 0; i < decData.length; i++) {
			str += decData[i] + ' ';
		}
		$('#base_dec').val(str.substring(0, str.length - 1));
	}

	// These are all converted the same way, so here is a shortcut
	for (var numType in baseDict) {
		if (type !== numType) {
			str = '';
			for (i = 0; i < decData.length; i++) {
				str += prependZero(decData[i].toString(baseDict[numType]), splitDict[numType]) + ' ';
			}
			$('#' + numType).val(str.substring(0, str.length - 1));
		}
	}
}

// Prepend zeroes to get byte sized intervals
function prependZero (str, length) {
	var newStr = str;
	for (var i = str.length; i < length; i++) {
		newStr = '0' + newStr;
	}
	return newStr;
}
