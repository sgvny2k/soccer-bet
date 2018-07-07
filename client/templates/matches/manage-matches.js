import  SimpleSchema from "simpl-schema";
import { ReactiveVar } from "meteor/reactive-var";
import { moment } from "meteor/momentjs:moment";
import { Collections, Schemas } from "/lib/declarations";
import { initTimeFilter } from "../common/helpers";

SimpleSchema.debug = true;

Template.manage_matches.onCreated(function() {
	let self = this;

	self.match = new ReactiveVar({
		method: "matchAdd"
	});

	self.autorun(function() {
		if (!initTimeFilter(0, 1)) return;
		self.subscribe("manage_matches");
	});
});

Template.manage_matches.helpers({
	initFilter() {
		initTimeFilter(0, 1);
	},
	thisInstance() {
		return Template.instance();
	},
});

Template.manage_matches.events({
	"click .match-row_match"(e, t) {
		$("#modalMenu").modal("show");
		// bind match data to menu
		$("#modalMenu").data("match", this);
	},
	"click .list-group-item"(e, t) {
		$("#modalMenu").modal("hide");
		let $target = $(e.currentTarget);
		let data = $("#modalMenu").data("match");
		if ($target.hasClass("js-menu-markets")) {
		Router.go("matches.manage.markets", {_id: data._id});
		return;
		}

		if ($target.hasClass("js-menu-edit")) {
			editMatch(t, data);
			return;
		}

		if ($target.hasClass("js-menu-delete")) {
			deleteMatch(data);
			return;
		}
	},
	"click .js-match-markets"(e, t) {
		e.stopPropagation();
		Router.go("matches.manage.markets", {_id: this._id});
		return;
	},
	"click .js-match-edit"(e, t) {
		e.stopPropagation();
		editMatch(t, this);
	},
	"click .js-match-delete"(e, t) {
		e.stopPropagation();
		deleteMatch(this)
	},
	"click .js-add-match"(e, t) {
		// toggle add match form
		t.$("#collapsibleForm").collapse("show");
		t.match.set({
			method: "matchAdd"
		});
	},
	"click .js-cancel"(e, t) {
		t.match.set({
			method: "matchAdd"
		});
		t.$("#collapsibleForm").collapse("hide");
	},
	"submit #formMatch"(e, t) {
		t.$("#collapsibleForm input").blur();
		t.$("#collapsibleForm").collapse("hide");
	},
});

Template.match_edit.helpers({
	schema: Schemas.Match,
	methodType() {
		let pp = Template.parentData(0).pp;
		return (pp && pp.match.get().method.substr(5) === "Add") ? "method" : "method-update";
	},
	method() {
		let pp = Template.parentData(0).pp;
		return pp && pp.match.get().method;
	},
	methodName() {
		let pp = Template.parentData(1).pp;
		return pp && pp.match.get().method.substr(5);
	},
	match() {
		return this.pp && this.pp.match.get();
	},
});

let deleteMatch = function(data) {
	swal({
		title: "Are you sure?",
		text: "Deleting match.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Confirm",
		closeOnConfirm: false,
	}, function() {
		Meteor.call("matchRemove", data._id, function(err, r) {
		if (err) {
			swal("Error", err.reason || err.message, "error");
		}
		swal.close();
		});
	});
};

let editMatch = function(t, data) {
	t.match.set({
		method: "matchUpdate",
		name: data.name,
		time: data.time,
		_id: data._id
	});
	t.$("#collapsibleForm").collapse("show");
	$("html, body").scrollTop(0);
};
