import { Collections } from "../lib/declarations";

/**
 * Publish a match and its slips for match history statistic
 */
Meteor.publishComposite("match_history_composite", function(matchId) {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return [];

	let player = Collections.Players.findOne({userId: this.userId});
	if (!player) return [];

	let playerGroup = player.group ? player.group : "";
	return {
		find() {
			return Collections.Matches.find({_id: matchId, time: {$lte: new Date()}});
		},
		children: [{
			find(match) {
				return Collections.Slips.find({matchId: match._id});
			},
			children: [{
				find(slip) {
					return Collections.Players.find({_id: slip.playerId, group: playerGroup});
				}
			}]
		}]
	}
});

/**
 * Publish a match and its slips for match history statistic
 */
Meteor.publishComposite("player_match_history", function(matchId, playerId) {
	if (!this.userId || Roles.getRolesForUser(this.userId).length === 0) return;

	let player = Collections.Players.findOne({userId: this.userId});
	if (!player) return [];

	let playerGroup = player.group ? player.group : "";
	return {
		find() {
			return Collections.Matches.find({_id: matchId, time: {$lte: new Date()}});
		},
		children: [{
			find(match) {
				return Collections.Slips.find({matchId: matchId, playerId: playerId});
			},
			}, {
				find(match) {
					return Collections.Players.find({_id: playerId, group: playerGroup});
				}
			}
		]
	}
});
