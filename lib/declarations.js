import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

export let Schemas = {};
export let Collections = {};

export let TabularTables = {};

Meteor.isClient && Template.registerHelper('TabularTables', TabularTables);

export let PermissionMap = {
	permissions: {
		listUsers: [],
		listMatchesAdmin: [],
		listMatchesOperator: [],
		listMatches: [],
		ranking: ["normal"],
	},

	get(action) {
		let roles = this.permissions[action];
		if (roles) {
			// admin should have any rights for any existing action
			roles.push("administrator");
		}
		return roles || [];
	}
}