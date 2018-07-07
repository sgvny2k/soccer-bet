import { Mongo } from "meteor/mongo";
import { Schemas, Collections } from '../declarations';
import SimpleSchema from 'simpl-schema';

Schemas.Player = new SimpleSchema({
	userId: {
		type: String,
		unique: true
	},
	name: { // copy from user profile name
		type: String
	},
	group: {
		type: String,
		optional: true
	},
	init_point: {
		type: Number,
		defaultValue: 200
	},
	slips: {
		type: Array,
		optional: true
	},
	'slips.$': String,
	win_sum: {
		type: Number,
		optional: true
	},
	bet_sum: {
		type: Number,
		optional: true
	},
	win_rate: {
		type: Number,
		optional: true
	},
	win_point: {
		type: Number,
		optional: true
	},
});

let Players = Collections.Players = new Mongo.Collection("players");
Players.attachSchema(Schemas.Player);

// These schema and collection should be on client only. They keep only publish aggregated data
if (Meteor.isClient) {
	Collections.PlayerBalance = new Mongo.Collection("player_balance");
}
