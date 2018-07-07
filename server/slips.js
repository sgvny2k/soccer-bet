import { Mongo } from "meteor/mongo";
import { Collections } from "../lib/declarations";
import { Roles } from 'meteor/alanning:roles';
import { moment } from "meteor/momentjs:moment";

Meteor.methods({
	saveSlip(data) {
		if (!Meteor.userId() || Roles.getRolesForUser(Meteor.userId()).length === 0) return;
		_.extend(data, {userId: Meteor.userId()});

		if (moment(data.matchTime).isBefore(new Date())) {
			throw new Meteor.Error(400, "Cannot modified a slip in a happened game.");
			return;
		}

		return Collections.Slips.upsert(data, {$set: {marketIdx: data.marketIdx}});
	},
	removeSlip(slipId) {
		if (!Meteor.userId() || Roles.getRolesForUser(Meteor.userId()).length === 0) return;
		// remove a slip of a game in future
		return Collections.Slips.remove({_id: slipId, matchTime: {$gte: new Date}});
	},
	removePendingSlips() {
		if (!Meteor.userId() || Roles.getRolesForUser(Meteor.userId()).length === 0) return;
		return Collections.Slips.remove({userId: Meteor.userId(), bet: {$exists: 0}});
	},
	saveBet(data) {
		if (!Meteor.userId() || Roles.getRolesForUser(Meteor.userId()).length === 0) return;

		if (data.amount === "" || data.amount === 0) {
			return Collections.Slips.update(data.slipId, {$unset: {bet: "", oddValue: ""}});
		}

		// make sure the bet at least 5
		if (data.amount < 5) {
			throw new Meteor.Error(400, "Minimum amount is 5.");
			return;
		}

		// the bet should be for a game in future
		if (moment(data.matchTime).isBefore(new Date())) {
			throw new Meteor.Error(400, "Cannot change a bet for a happened game.");
			return;
		}

		// check if user has enough balance (double layers checking client+server)
		let player = Collections.Players.findOne({userId: Meteor.userId()});
		if (!player) return;

		// find the transfer amounts
		let transfers = Collections.Transfers.find({$or: [{from: player._id}, {to: player._id}]});
		let transfer = 0;
		transfers.forEach(t => {
			if (t.from === player._id) {
				transfer += t.amount;
			} else {
				transfer -= t.amount;
			}
		});

		let slips = Collections.Slips.find({playerId: player._id, won: {$exists: 0}});
		let bet_sum = 0;
		slips.forEach(slip => {
			bet_sum += slip.bet || 0;
		});
		let balance = player.init_point + player.win_sum - player.bet_sum - bet_sum - transfer;
		let slip = Collections.Slips.findOne(data.slipId);
		balance += (slip && slip.bet) || 0;
		if (balance < data.amount) {
			throw new Meteor.Error("Bet amount exceeds balance.", "Maximum value can be used is " + balance);
			return;
		}

		// store both bet amount and odd value for easy result updating
		return Collections.Slips.update(data.slipId, {$set: {bet: data.amount, oddValue: data.oddValue, matchTime: data.matchTime}});
	},
});

/**
 * Publish player and one's slips in future matches.
 * If matchId is passed to the publication, slips are limited to those in the match.
 */
Meteor.publishComposite("player_slips", function() {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return;

	// publish both logged in player and one's slips
	return {
		find() {
			// publish logged in player
			let players = Collections.Players.find({userId: this.userId});
			return players;
		},
		children: [{
		// publish slips of players
		find(player) {
			return Collections.Slips.find({
				playerId: player._id,
				$or: [
					// unbet slips:
					{$or: [{bet: {$exists: 0}}, {bet: 0}]},
					// bet ones in future:
					{matchTime: {$gte: new Date()}, bet: {$gt: 0}},
					// bet ones waiting for result
					{matchTime: {$lt: new Date()}, bet: {$gt: 0}, won: {$exists: 0}}
				]
			});
		},
		children: [{
			find(slip) {
			return Collections.Matches.find(slip.matchId);
			}
		}]
		}]
	}
});
