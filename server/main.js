import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
// import { Schemas, Collections } from "../lib/declarations";
// import "../lib/collections/groups";

Meteor.startup(() => {
	// code to run on server at startup

	// create roles administrator, operator and normal
	let role = Meteor.roles.findOne({name: "administrator"});
	if (!role) {
		Roles.createRole("administrator");
	}
	role = Meteor.roles.findOne({name: "operator"});
	if (!role) {
		Roles.createRole("operator");
	}
	role = Meteor.roles.findOne({name: "normal"});
	if (!role) {
		Roles.createRole("normal");
	}

	// make sure admin user exists and has role administrator
	let user = Meteor.users.findOne({username: "admin"});
	let userId;
	if (!user) {
		userId = Accounts.createUser({
		username: "admin",
		password: "admin",
		email: "sgvny2k@gmail.com",
		profile: {
			name: "Administrator"
		}
		});
	} else {
		userId = user._id
	}
	Roles.setUserRoles(userId, "administrator");
});
