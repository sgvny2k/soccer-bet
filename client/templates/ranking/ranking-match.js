import { Collections } from "/lib/declarations";
import { Router } from "meteor/iron:router";

Template.ranking_match.onCreated(function() {
	let self = this;
	let matchId = Router.current().params._id;
	self.autorun(function() {
		self.subscribe("ranking_match", matchId);
		self.subscribe("players");
		self.subscribe("transfers");
		self.subscribe("one_match_in_past", matchId);
	});
});

Template.ranking_match.helpers({
  players() {
	let matchSums = Collections.MatchSums.find({matchId: Router.current().params._id}, {sort: {win_point: -1, win_rate: -1, bet_sum: -1}});
	return matchSums.map((matchSum, idx) => {
		let player = Collections.Players.findOne(matchSum.playerId);
		if (player) {
			matchSum.position = idx + 1;
			matchSum.init_point = player.init_point;
			matchSum.name = player.name;
			return matchSum;
		}
	});
	},
	match() {
		return Collections.Matches.findOne(Router.current().params._id);
	},
	matchDate() {
		return moment(this.time).format("dddd D MMM YYYY");
	},
});

Template.ranking_match.events({
	"click .rank-item"(e, t) {
		Router.go("history.match.player", {_id: Router.current().params._id, playerId: this.playerId});
	},
});
