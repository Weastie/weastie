/* global $ */

$(document).ready(function () {
	$('form').on('submit', validateForm);
	$('#newpass').on('input', checkPasswords);
	$('#newpass2').on('input', checkPasswords);
});

function validateForm (e) {
	$('.errorLabel').addClass('hidden'); // Remove all error labels
	$('.formError').removeClass('formError'); // Remove all error indicators

	return checkPasswords();
}

function checkPasswords () {
	var pass = $('#newpass').val();
	var pass2 = $('#newpass2').val();

	var cont = true;

	$('.errorLabel[for=\'newpass\']').addClass('hidden');
	$('.errorLabel[for=\'newpass2\']').addClass('hidden');
	$('#newpass').removeClass('formError');
	$('#newpass2').removeClass('formError');

	if (pass !== pass2) {
		cont = false;
		$('.errorLabel[for=\'newpass2\']').removeClass('hidden');
		$('#newpass2').addClass('formError');
	}
	if (pass.length < 6 || pass.length > 512) {
		cont = false;
		$('#passRecsDiv').addClass('hidden');
		$('.errorLabel[for=\'newpass\']').removeClass('hidden');
		$('#newpass').addClass('formError');
	} else {
		$('#passRecsDiv').removeClass('hidden');
	}

	var passPros = [];
	var passCons = [];

	// Length
	if (pass.length < 10) {
		passCons.push('At least 10 characters');
	} else if (pass.length < 15) {
		passPros.push('At least 10 characters');
		passCons.push('At least 15 characters');
	} else {
		passPros.push('At least 15 characters');
	}

	// Lower and upper case letters
	var lettersTest = /([a-zA-Z]){2,}/; // Check for at least two letters
	if (pass === pass.toLowerCase() || pass === pass.toUpperCase() || !lettersTest.test(pass)) {
		passCons.push('A mix of upper and lower case letters');
	} else {
		passPros.push('A mix of upper and lower case letters');
	}

	// Numbers
	var numsRegex = /[0-9]/;
	if (numsRegex.test(pass)) {
		passPros.push('Numbers');
	} else {
		passCons.push('Numbers');
	}

	// Symbols
	var symbolsRegex = /([^a-zA-Z0-9])/; // Something other than letters and spaces
	if (symbolsRegex.test(pass)) {
		passPros.push('Symbols');
	} else {
		passCons.push('Symbols');
	}

	// If the user has more than one downside, print them out
	if (passCons.length > 0) {
		$('#passConsDiv').removeClass('hidden');
		var html = '';
		for (var i = 0; i < passCons.length; i++) {
			html += '<li>' + passCons[i] + '</li>';
		}
		$('#passCons').html(html);
	} else {
		$('#passConsDiv').addClass('hidden');
	}

	// If the user has more than one upside, print them out
	if (passPros.length > 0) {
		$('#passProsDiv').removeClass('hidden');
		var html2 = '';
		for (var j = 0; j < passPros.length; j++) {
			html2 += '<li>' + passPros[j] + '</li>';
		}
		$('#passPros').html(html2);
	} else {
		$('#passProsDiv').addClass('hidden');
	}

	return cont;
}
