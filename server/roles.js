import { Roles } from 'meteor/alanning:roles';

Meteor.publish("adminLoadRoles", function() {
	// only admin allowed
	if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator"])) return [];

	return Meteor.roles.find();
});
