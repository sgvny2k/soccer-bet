import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Roles } from 'meteor/alanning:roles';
import { TabularTables, Collections } from '/lib/declarations';
import Tabular from 'meteor/aldeed:tabular';

Collections.MenuItems = new Mongo.Collection("menu");

Meteor.users.helpers({
	/**
	 * Check if user has a player account
	 */
	getPlayer() {
		return Collections.Players.findOne({userId: this._id});
	},
	/**
	 * return roles current user is having
	 */
	roles() {
		return Roles.getRolesForUser(this._id);
	}
});

TabularTables.Users = new Tabular.Table({
	name: "Users",
	processing: false,
	responsive: true,
	autoWidth: false,
	pageLength: 200,
	dom: "tip",
	collection: Meteor.users,
	order: [[5, "asc"], [0, "asc"]],
	pub: "users",
	allow(userId) {
		return Roles.userIsInRole(userId, "administrator");
	},
	columns: [
		{data: "name", title: "Name"},
		{data: "uname", title: "Username"},
		{data: "email", title: "Email"},
		{title: "Roles", tmpl: Meteor.isClient && Template.user_roles},
		{title: "Has Player", tmpl: Meteor.isClient && Template.user_player},
		{title: "Group", tmpl: Meteor.isClient && Template.user_group},
	],
	extraFields: ["roles"]
});
