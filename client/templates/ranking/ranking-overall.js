import { Collections } from "/lib/declarations";

Template.ranking_overall.onCreated(function() {
	let self = this;
	self.autorun(function() {
		self.subscribe("players");
		self.subscribe("transfers");
	});
});

Template.ranking_overall.helpers({
	players() {
		return Collections.Players.find({}, {sort: {win_point: -1, win_rate: -1, bet_sum: -1}}).map((player, idx) => {
			player.position = idx + 1;
			return player;
		});
	},
});

Template.ranking_overall.events({
	"click .rank-item"(e, t) {
		Router.go("history.player.matches", {_id: this._id});
	},
});
