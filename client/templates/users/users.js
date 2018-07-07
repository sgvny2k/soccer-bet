import { Tabular } from "meteor/aldeed:tabular";
import { Roles } from "meteor/alanning:roles";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Collections } from "/lib/declarations";

Template.users.onCreated(function() {
	let self = this;

	self.autorun(function() {
		self.subscribe("all-players");
	});
});

Template.users.events({
	"click #table-users tr"(e, t) {
		$("#modalMenu").modal("show");
		// bind user data to menu
		let dataTable = $(e.target).closest('table').DataTable();
		let rowData = dataTable.row(e.currentTarget).data();
		if (!rowData) return; // there won't be data if a placeholder row is clicked
		$("#modalMenu").data("user", rowData);
	},
	"click .list-group-item"(e, t) {
		$("#modalMenu").modal("hide");
		let $target = $(e.currentTarget);
		let data = $("#modalMenu").data("user");

		if ($target.hasClass("js-edit")) {
			Router.go("user.edit", {_id: data._id});
			return;
		}

		if ($target.hasClass("js-delete")) {
		swal({
			title: "Are you sure?",
			text: "Deleting user.",
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Confirm",
			closeOnConfirm: false,
		}, function() {
			// delete user here
			Meteor.call("removeUser", data._id, function(err, r) {
			if (err) {
				swal("Error", err.reason || err.message, "error");
				return;
			}
			swal.close();
			});
		});
		}
	},
});

Template.user_roles.helpers({
	roles() {
		return Roles.getRolesForUser(this._id);
	}
});

Template.user_player.events({
	"click #createPlayer"(e, t) {
		e.stopPropagation();
		Meteor.call("createPlayer", this, function(err, result) {
			if (err) {
				swal("There is a problem", err.reason || err.message, "error");
				return;
			}
			swal("Player is successfully created.");
		});
	},
	"click #removePlayer"(e, t) {
		e.stopPropagation();
		let self = this;
		swal({
			title: "Are you sure?",
			text: "Remove the player associating with this account.",
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: false,
			html: false
		}, function() {
			Meteor.call("removePlayer", self._id, function(err, result) {
				if (err) {
					swal("There is a problem", err.reason || err.message, "error");
					return;
				}
				swal("Player is successfully removed.");
			});
		});
	},
});
