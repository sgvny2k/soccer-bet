Template.datetimepicker.onRendered(function() {
	var dtp = this.$('.datetimepicker');
	dtp.datetimepicker({
		format: 'DD/MM/YYYY HH:mm',
		stepping: 15,
		sideBySide: true
	});
});

AutoForm.addInputType('datetimepicker', {
	template: 'datetimepicker',
	valueIn: function(val, atts) {
		$(atts.selector).val(Blaze._globalHelpers.formatDateTime(val));
	},
	valueOut: function () {
		// this == jQuery
		return Blaze._globalHelpers.toDate(this.val());
	}
});