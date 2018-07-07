import { Schemas, Collections } from "../lib/declarations";
import { check } from "meteor/check";
//import { Job } from "meteor/differential:workers";
//import "./workers/updatepoint-worker";
import { Jobs } from 'meteor/msavin:sjobs';
import SimpleSchema from "simpl-schema";

Meteor.methods({
	matchAdd(newMatch) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;
		return Collections.Matches.insert(newMatch);
	},
	matchRemove(matchId) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;
		return Collections.Matches.remove(matchId);
	},
	matchUpdate(matchData) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;

		check(matchData.modifier.$set, {
			name: String,
			time: Date
		});

		Collections.Matches.update(matchData._id, matchData.modifier);
		// also update match time in the slips
		Collections.Slips.update({matchId: matchData._id}, {$set: {matchTime: matchData.modifier.$set.time}}, {multi: true});

		return true;
	},
	saveMarkets(data) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;

		let updator = {$set: {markets: data.markets}};
		if (data.markets && data.markets.length === 0) {
			updator = {$unset: {markets: ""}};
		}

		if (!Schemas.Match.namedContext("saveMarkets").validate(updator, {modifier: true})) {
			throw new Meteor.Error("Data validation failed.", "Check Match schema.");
			return;
		}

		return Collections.Matches.update(data.matchId, updator);
	},
	saveResult(data) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;

		check(data, {
			id: String,
			val: String
		});

		return Collections.Matches.update(data.id, {$set: {result: data.val}});
	},
	saveOdd(data) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;

		let updateDoc = {};
		updateDoc["markets."+data.marketIdx+".odds."+data.oddIdx+".win"] = data.win || false;
		Collections.Matches.update(data.matchId, {$set: updateDoc});
	},
	saveOdds(data) {
		if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;

		// start a new background job to update credits for users who have bet in the match
		// since the task might be CPU intensive and take time.
		Jobs.run("updatePoint", data);
		return true;
	},
	allMatchNames() {
		if (!Meteor.userId() || Roles.getRolesForUser(Meteor.userId()).length === 0) return;
		let matches = Collections.Matches.find({}, {fields: {name: 1}});
		return matches.fetch();
	},
});

/**
 * Publish all matches for admin or operator
 */
Meteor.publish("manage_matches", function() {
	if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator", "operator"])) return [];
	return Collections.Matches.find({});
});

/**
* Publish a match in the future admin or operator to add markets
*/
Meteor.publish("manage_markets", function(matchId) {
	if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator", "operator"])) return [];
	return Collections.Matches.find({_id: matchId, time: {$gte: new Date()}});
});

/**
 * Publish a selected match in the past for win odds picking
 */
Meteor.publish("one_match_in_past", function(matchId) {
	if (!this.userId) return [];
	return Collections.Matches.find({_id: matchId, time: {$lte: new Date()}});
});

/**
 * Publish matches in the past has no result to notify operators to update result
 */
Meteor.publish("op_matches_update", function() {
	if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator", "operator"])) return [];
	return Collections.Matches.find({result: {$exists: 0}, time: {$lt: new Date()}});
});

/**
 * Publish matches in the past
 */
Meteor.publish("matches_past", function(timeFilter) {
	if (!this.userId) return [];

	if (timeFilter && timeFilter.wait) {
		return Collections.Matches.find({result: {$exists: 0}, time: {$lte: new Date()}});
	}

	if (timeFilter) {
		let m = moment();
		if (moment(timeFilter.$lte).isAfter(m)) {
			timeFilter.$lte = m.toDate();
		}
	} else {
		timeFilter = {$lte: new Date()};
	}
	return Collections.Matches.find({time: timeFilter});
});

/**
 * Publish last match having result
 */
Meteor.publish("last_match", function() {
	if (!this.userId) return [];
	return Collections.Matches.find({result: {$exists: 1}}, {sort: {time: -1}, limit: 1});
});

/**
 * Publish one match in the future
 */
Meteor.publishComposite("one_match_in_future", function(matchId) {
	if (!this.userId) return [];
	return {
		find() {
			let matchCursor = Collections.Matches.find({_id: matchId, time: {$gte: new Date()}, markets: {$exists: 1}});
			return matchCursor;
		},
		children: [{
			find(match) {
				let slipsCursor = Collections.Slips.find({matchId: match._id, bet: {$exists: 1}});
				return slipsCursor;
			}
		}]
	}
});

/**
 * Publish matches in the future. These matches should also have markets
 */
Meteor.publish("matches_future", function(matchId) {
	if (!this.userId) return [];
	return Collections.Matches.find({time: {$gte: new Date()}, markets: {$exists: 1}});
});

Meteor.publishComposite("history_player_matches", function(playerId) {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];

	return {
		find() {
			let playerCursor = Collections.Players.find(playerId);
			return playerCursor;
		},
		children: [{
			find(player) {
				let slipsCursor = Collections.Slips.find({playerId: player._id, bet: {$exists: 1}}, {fields: {matchId: 1}});
				let matchIds = slipsCursor.map(slip => {return slip.matchId});
				let matchesCursor = Collections.Matches.find({_id: {$in: matchIds}});
				return matchesCursor;
			}
		}]
	}
});
