/* global $ */

var drawer;
var raisedButtons;

$(document).ready(function () {
	drawer = $('.drawer');
	drawer.addClass('hidden');
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
		const target = $('#' + a.currentTarget.dataset.for);
		target.hasClass('hidden') || target.hasClass('drawerHide') ? openDrawer(target) : closeDrawer(target);
	});
});

function openDrawer (target) {
	target.removeClass('hidden');

	target.removeClass('drawerHide');
	target.addClass('drawerAppear');

	$(document.body).removeClass('toWhite');
	$(document.body).addClass('toBlack');
	$('#body').removeClass('fadeIn');
	$('#body').addClass('fadeOutHalf');
}
function closeDrawer (target) {
	if ($(target).hasClass('drawerAppear')) {
		target.removeClass('drawerAppear');
		target.addClass('drawerHide');
		$(document.body).removeClass('toBlack');
		$(document.body).addClass('toWhite');
		$('#body').removeClass('fadeOutHalf');
		$('#body').addClass('fadeIn');
	}
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
