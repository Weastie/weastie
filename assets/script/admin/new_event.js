/* global $ */

$(document).ready(function () {
	$('#eventForm').on('submit', function (e) {
		return verifyForm();
	});

	var curDate = new Date();

	const curDateLocale = curDate.getFullYear() + '-' +
                        leftPadZeroes(curDate.getMonth() + 1, 2) + '-' +
                        leftPadZeroes(curDate.getDate(), 2);
	console.log(curDateLocale);
	const curTimeLocale = leftPadZeroes(curDate.getHours() + ':' + curDate.getMinutes(), 5);

	let nextHourLocale;

	if (curDate.getHours() < 23) {
		nextHourLocale = leftPadZeroes(curDate.getHours() + 1 + ':' + curDate.getMinutes(), 5);
	} else {
		nextHourLocale = '23:59';
	}

	$('#date-start').val(curDateLocale);
	$('#time-start').val(curTimeLocale);

	$('#date-end').val(curDateLocale);
	$('#time-end').val(nextHourLocale);

	$('#date-start').on('change', checkDates);
	$('#date-end').on('change', checkDates);
	$('#title').on('input', checkTitle);
});

function checkDates () {
	let err = false;
	// check all dates exist

	// get full dates
	const startDate = new Date($('#date-start').val() + ' ' + $('#time-start').val());
	const endDate = new Date($('#date-end').val() + ' ' + $('#time-end').val());

	$('#start').val(startDate.getTime());
	$('#end').val(endDate.getTime());

	// Remove all errors
	$('#dateerror1').addClass('hidden');
	$('#dateerror2').addClass('hidden');

	$('#date-start').removeClass('formError');
	$('#date-end').removeClass('formError');

	// If the event does not start in the future, show error
	if (startDate.getTime() < Date.now()) {
		// The event began in the past
		err = true;
		$('#dateerror1').removeClass('hidden');
		$('#date-start').addClass('formError');
	}

	// If the event does not end after it starts, show error
	if (startDate.getTime() >= endDate.getTime()) {
		err = true;
		$('#dateerror2').removeClass('hidden');
		$('#date-end').addClass('formError');
	}

	return !err;
}

function checkTitle () {
	let err = false;
	$('#titleerror').addClass('hidden');
	$('#title').removeClass('formError');

	if ($('#title').val().length < 1 || $('#title').val().length > 75) {
		err = true;
		$('#titleerror').removeClass('hidden');
		$('#title').addClass('formError');
	}

	return !err;
}

function verifyForm () {
	return checkDates() && checkTitle() && 0;
}

function leftPadZeroes (string, length) {
	string = '' + string;
	while (string.length < length) {
		string = '0' + string;
	}
	return string;
}
