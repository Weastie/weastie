/* global $ */

var drawer;
var raisedButtons;

$(document).ready(function () {
	drawer = $('.drawer');
	drawer.css('transform', 'translateX(-300px)');
	raisedButtons = $('.btnRaised');

	// Create alerts
	var serverAlerts = $('#serverAlerts').data('alerts');
	for (var i = 0; i < serverAlerts.length; i++) {
		alerts.add(serverAlerts[i].message, serverAlerts[i].type);
	}

	// Format dates
	$('.formatDate').each(function (i, e) {
		let node = $(e);
		const date = new Date(Number(node.html()));
		node.html(date.toLocaleString());
	});

	raisedButtons.on('mousedown', function (e) {
		$(e.target).addClass('shadow-8dp');
		$(e.target).removeClass('shadow-2dp');
	});
	raisedButtons.on('mouseup', function (e) {
		$(e.target).addClass('shadow-2dp');
		$(e.target).removeClass('shadow-8dp');
	});
	raisedButtons.on('mouseleave', function (e) {
		$(e.target).addClass('shadow-2dp');
		$(e.target).removeClass('shadow-8dp');
	});

	$(document).click(function (a) {
		if (!hasParentWithClass($(a.target), 'drawer') && !hasParentWithClass($(a.target), 'drawerBtn')) {
			closeDrawer(drawer);
		}
	});

	// Menu buttons
	$('.drawerBtn').click(function (a) {
		// const target = $('#' + a.currentTarget.dataset.for);
		// // target.hasClass('hidden') || target.hasClass('drawerHide') ? openDrawer(target) : closeDrawer(target);
		// $(target).css('margin-left') === '0px' ? closeDrawer(target) : openDrawer(target);
		$(drawer).removeClass('hidden');
		$(drawer).position().left > -150 ? closeDrawer() : openDrawer();
	});
});

function openDrawer () {
	// Move in the drawer
	// $(drawer).css('margin-left', '0px');
	$(drawer).css('transform', 'translateX(0px)');

	// Fade out the body (besides the drawer)
	$(document.body).css('background-color', '#424242');
	$('#body').css('opacity', '0.3');
}
function closeDrawer () {
	// Move out the drawer
	// $(drawer).css('margin-left', '-300px');
	$(drawer).css('transform', 'translateX(-300px)');

	// Fade in the body (besides the drawer)
	$(document.body).css('background-color', 'white');
	$('#body').css('opacity', '1');
}

function hasParentWithClass (element, className) {
	if (element.hasClass(className)) {
		return true;
	} else if (element.parent().length === 0) {
		return false;
	} else {
		return hasParentWithClass(element.parent(), className);
	}
}

// Alerts
var alerts = { // eslint-disable-line
	id: 0,
	clear: function () {
		$('#alertsDiv').html('');
		alerts.id = 0;
	},
	add: function (message, type) {
		var newhtml = '<div id=\'alert-' + alerts.id + '\' class=\'alert ' + type + '\'>' +
									message + '<a href=\'#\' onclick=\'alerts.delete(' + alerts.id + ')\'>×</a></div>';
		$('#alertsDiv').html($('#alertsDiv').html() + newhtml);
		alerts.id++;
	},
	delete: function (id) {
		$('#alert-' + id).remove();
	}
};
