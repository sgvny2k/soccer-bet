import { Mongo } from "meteor/mongo";
import { Collections } from "../lib/declarations";
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

/**
 * Allow a logged in user to view players in same group
 */
Meteor.publish("players", function() {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];
	
	let player = Collections.Players.findOne({userId: this.userId});
	if (!player) return [];

	// return Collections.Players.find(player.group ? {group: player.group} : {});
	return Collections.Players.find({group: player.group ? player.group : ""});
});

Meteor.publish("all-players", function() {
	if (!this.userId || !Roles.userIsInRole(this.userId, "administrator")) return [];
	return Collections.Players.find();
});

Meteor.publish("player_balance", function() {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];

	let self = this;

	// watch for changes in players, slips, and transfers to publish one's balance
	// get cursor of logged in player
	let players = Collections.Players.find({userId: this.userId});
	if (players.count() <= 0) return [];
	let player = players.fetch()[0];

	// get cursors of all slips
	let slips = Collections.Slips.find({playerId: player._id});
	// get cursors of all transfers relating to player
	let transfers = Collections.Transfers.find({$or: [{from: player._id}, {to: player._id}]});

	let playerObserver = players.observeChanges({
		added(id, doc) {
			self.added("player_balance", player._id, {balance: calculateBalance(player)});
		},
		changed(id, doc) {
			_.extend(player, doc);
			self.changed("player_balance", player._id, {balance: calculateBalance(player)});
		}
	});
	let slipsObserver = slips.observeChanges({
		changed(id, doc) {
			// notify subscribers only when bet value changed
			if (doc.bet !== undefined) {
				// let p = Collections.Players.findOne(player._id);
				self.changed("player_balance", player._id, {balance: calculateBalance(player)});
			}
		},
		removed(id) {
			// let p = Collections.Players.findOne(player._id);
			self.changed("player_balance", player._id, {balance: calculateBalance(player)});
		}
	});
	let transferObserver = transfers.observeChanges({
		added(id, transfer) {
			self.changed("player_balance", player._id, {balance: calculateBalance(player)});
		},
	});

	self.ready();
	self.onStop(function () {
		playerObserver.stop();
		slipsObserver.stop();
		transferObserver.stop();
	});
});

Meteor.publish("ranking_match", function(matchId) {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];
	return Collections.MatchSums.find({matchId: matchId});
});

Meteor.publish("ranking_date", function(dateStr) {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];
	let date = moment(dateStr);
	return Collections.DateSums.find({date: date.toDate()});
});

Meteor.publish("winner_last_date", function() {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];
	return Collections.DateSums.find({}, {sort: {date: -1, win_point: -1}, limit: 1});
});

Meteor.methods({
	createPlayer(user) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator"])) return;
		Roles.addUsersToRoles(user._id, "normal");
		let playerId = Collections.Players.insert({
			userId: user._id,
			name: user.name,
			init_point: 200
		});
		return playerId;
	},
	removePlayer(userId) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator"])) return;

		// remove only normal role from player
		Roles.removeUsersFromRoles(userId, "normal");
		// remove all slips
		Collections.Slips.remove({userId: userId});
		// remove ranking items
		Collections.DateSums.remove({userId: userId});
		Collections.MatchSums.remove({userId: userId});
		// remove the player
		return Collections.Players.remove({userId: userId});
	},
	topup(data) {
		// // only admin can topup (comment next lines if this restriction isnt needed)
		// if (!Roles.userIsInRole(this.userId, "administrator")) {
		//   throw new Meteor.Error("Only an admin can perform this action.");
		//   return;
		// }

		// normal player can only topup for oneself, admin can do that for everyone
		if (!Roles.userIsInRole(this.userId, "administrator") && data.userId !== this.userId) {
			throw new Meteor.Error("Only an admin can perform this action.");
			return;
		}

		// multiplication of 100
		if (!Roles.userIsInRole(this.userId, "administrator") && (data.amount < 100 || data.amount % 100 !== 0)) {
			throw new Meteor.Error(400, "Please enter an integer multiplication of 100. Eg. 100, 200...");
			return;
		}

		if (data.userId) {
			let player = Collections.Players.findOne({userId: data.userId});
			return Collections.Players.update(player._id, {$inc: {init_point: data.amount}});
		} else {
			return Collections.Players.update(data.playerId, {$inc: {init_point: data.amount}});
		}
	},
	transfer(data) {
		if (!Meteor.userId()) return;

		if (data.amount <= 0) {
			throw new Meteor.Error("Invalid action", "The amount is invalid.");
			return;
		}
		// check user balance against transfer amount
		let player = Collections.Players.findOne({userId: Meteor.userId()});
		if (!player) return;

		let balance = calculateBalance(player);
		if (balance < data.amount) {
			throw new Meteor.Error("Invalid action", "The amount exceeds your balance");
			return;
		}
		// save new transfer transaction
		Collections.Transfers.insert({from: player._id, to: data.playerId, amount: data.amount, when: new Date()});
	}
});

let calculateBalance = function(player) {
	// find all transfers relating to player to calculate points one gave out or received
	let transfer = 0;
	Collections.Transfers.find({$or: [{from: player._id}, {to: player._id}]}).forEach((t) => {
		if (t.from === player._id) {
			transfer += t.amount;
		} else {
			transfer -= t.amount;
		}
	});

	let sum_bet = 0;
	// all slips bet but have no result update
	let slips = Collections.Slips.find({playerId: player._id, won: {$exists: 0}});
	// get all the bets. Should subtract this amount from balance
	slips.forEach(slip => {
		sum_bet += slip.bet || 0;
	});

	return player.init_point + (player.win_sum || 0) - (player.bet_sum || 0) - sum_bet - transfer;
}
