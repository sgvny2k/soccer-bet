import { Collections } from "/lib/declarations";

Template.user.onCreated(function() {
	let self = this;
	self.autorun(function() {
		self.subscribe("users");
		self.subscribe("all-players");
		self.subscribe("adminLoadRoles");
	});

	self.userRoles = new ReactiveVar();
});

Template.user.helpers({
	user() {
		let userId = Router.current().params._id;
		if (!userId) return;

		return Meteor.users.findOne(userId);
	},
	hasUsername() {
		return this.username;
	},
	hasEmail() {
		return this.emails;
	},
	email() {
		return this.emails[0].address;
	},
	group() {
		let userId = Router.current().params._id;
		if (!userId) return;

		let player = Collections.Players.findOne({userId: userId});
		if (player) return player.group;
		return "";
	},
	currentRoles() {
		let userRoles = Template.instance().userRoles.get();
		if (userRoles) return userRoles;

		Template.instance().userRoles.set(Roles.getRolesForUser(this._id));
	},
	otherRoles() {
		let userRoles = Template.instance().userRoles.get();
		if (!userRoles) {
			userRoles = [];
		}
		return Meteor.roles.find({name: {$nin: userRoles}});
	},
});

Template.user.events({
	"click .js-cancel"(e, t) {
		history.back();
	},
	"click .js-update"(e, t) {
		let user = undefined;
		let val = t.$("#username").val();
		if (val) {
			if (!user) user = {};
			user.username = val;
		}
		val = t.$("#name").val();
		if (val) {
			if (!user) user = {};
			user.profile = {name: val};
		}
		val = t.$("#email").val();
		if (val) {
			if (!user) user = {};
			user.emails = [{address: val, verified: false}];
		}
		val = t.$("#group").val();
		if (val) {
			if (!user) user = {};
			user.group = val;
		}
		Meteor.call("updateUser", this._id, {$set: user}, t.userRoles.get(), function(e, r) {
			if (e) {
				swal("Error", e.reason || e.message, "error");
				return;
			}
			history.back();
		});
	},
	"click span.glyphicon-remove"(e, t) {
		let userRoles = t.userRoles.get();
		let idx = userRoles.indexOf(this.toString());
		if (idx !== -1) {
			userRoles.splice(idx, 1);
			t.userRoles.set(userRoles);
		}
	},
	"click span.glyphicon-plus"(e, t) {
		let userRoles = t.userRoles.get();
		userRoles.push(this.name);
		t.userRoles.set(userRoles);
	},
	"click .js-reset-password"(e, t) {
		e.stopPropagation();
		resetPassword(this);
	},
});

let resetPassword = function(user) {
	swal({
		title: "Are you sure?",
		text: "Reset user password.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Confirm",
		closeOnConfirm: false,
	}, function() {
		Meteor.call("setPassword", user._id, function(err, r) {
			if (err) {
				swal("Error", err.reason || err.message, "error");
			} else {
				swal("Success", "Password reset to '1234567'.", "info");
			}
		});
	});
}