/*
 * Converts a string array, or a single string, into the form of
 * A[0] | A[1] | A[N] | SFTechClub
 */
module.exports.formatTitle = function (words) {
	// If the input is a single word, make it an array of itself for ease.
	if (typeof words === 'string') {
		words = [words];
	}
	words.reverse();
	var result = '';
	for (var i in words) {
		result += words[i] + ' | ';
	}
	result += 'Weastie';
	return result;
};

/*
 * Converts a string into a title that can be entered into a URL.
 */
module.exports.stringToPageTitle = function (string, length) {
	length = length || 45;
	// Replace white space with _ and ? # " ' ; with nothing
	return encodeURIComponent(string.substr(0, length).replace(/\s/g, '_').replace(/[(?)(#)(")(')(;)]/g, ''));
};

/*
 *
 */
module.exports.convertID = function (id) {
	if (typeof id === 'string') {
		return Number.parseInt(id, 32);
	} else if (typeof id === 'number') {
		return id.toString(32);
	}
};
