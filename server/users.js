import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { Collections } from "../lib/declarations";

let formatUser = function(user) {
	let retUser = {_id: user.id, roles: user.roles, name: user.profile.name}
	// format user email
	if (user.emails) {
		retUser.email = user.emails[0].address;
	} else {
		retUser.email = user.services && ((user.services.facebook && user.services.facebook.email) || (user.services.google && user.services.google.email));
	}
	if (!retUser.email) {
		retUser.email = "unknown@unknown.co";
	}
	let match = retUser.email.match(/.{2}(.+).{2}@.+\..+/);
	if (match) retUser.email = retUser.email.replace(match[1], "**");

	if (user.username) {
		retUser.uname = user.username;
		match = retUser.uname.match(/.{2}(.+).{2}/);
		if (match) retUser.uname = retUser.uname.replace(match[1], "**");
	} else {
		retUser.uname = (user.services.facebook && "Facebook Account") || (user.services.google && "Google Account");
	}
	return retUser;
}

Meteor.publish("users", function() {
	let self = this;
	let observer = Meteor.users.find({}).observeChanges({
		added(id, doc) {
			self.added("users", id, formatUser(doc));
		},
		changed(id, doc) {
			self.changed("users", id, doc);
		},
		removed(id) {
			self.removed("users", id);
		}
	});

	self.ready();
	self.onStop(function () {
		observer.stop();
	});
});

Meteor.methods({
	updateUser(userId, dataToSet, roles) {
		if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator"])) return;
		if (dataToSet["$set"]) {
			Meteor.users.update(userId, dataToSet);
			Collections.Players.update({ userId: userId }, { $set: { name: dataToSet.$set.profile.name, group: dataToSet.$set.group } });
		}
		// update roles
		var userRoles = Roles.getRolesForUser(userId);
		Roles.removeUsersFromRoles(userId, userRoles);
		Roles.addUsersToRoles(userId, roles);
	},
	removeUser(userId) {
		if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator"])) return;
		// remove player first
		Meteor.call("removePlayer", userId);
		// then the user
		return Meteor.users.remove(userId);
	},
	changeName(newName) {
		if (!this.userId) return;
		Meteor.users.update(this.userId, {$set: {"profile.name": newName}});
		Collections.Players.update({userId: this.userId}, {$set: {name: newName}});
	},
	setPassword(userId) {
		if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator"])) return;
		Accounts.setPassword(userId, "1234567");
	}
});
