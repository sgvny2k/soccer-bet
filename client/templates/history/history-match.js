import { Collections } from "/lib/declarations";

Template.history_match.onCreated(function() {
	let self = this;
	self.autorun(function() {
		let matchId = Iron.controller().getParams()._id;
		self.subscribe("match_history_composite", matchId);
		// self.subscribe("players");
	});
});

Template.history_match.helpers({
	match() {
		// merge slips and player data to match data
		let match = Collections.Matches.findOne(Router.current().params._id);
		let slips = Collections.Slips.find({matchId: Router.current().params._id, bet: {$exists: 1}});
		slips.forEach(slip => {
			if (slip.marketIdx === -1) {
				let player = Collections.Players.findOne(slip.playerId);
				if (!player) return;
				if (!match.players) match.players = [];
				match.players.push({playerId: slip.playerId, name: player.name, bet: slip.bet});
				return;
			}

			let odd = match.markets[slip.marketIdx].odds[slip.oddIdx];
			if (!odd.players) odd.players = [];
			let player = Collections.Players.findOne(slip.playerId);
			if (!player) return;
			odd.players.push({playerId: slip.playerId, name: player.name, won: slip.won, bet: slip.bet});
		});
		return match;
	},
	matchDate() {
		return moment(this.time).format("HH:mm dddd D MMM YYYY");
	},
});

Template.odd_players.helpers({
	type() {
		return (this.won) ? "success" : ((Template.parentData(1).history === false)? "primary" : "danger");
	},
	stake() {
		let formatFloat = Blaze._globalHelpers.formatFloat;
		let str = formatFloat(this.bet);
		if (this.won) {
			str = formatFloat(this.won - this.bet) + "/" + str;
		}
		return str;
	},
});

Template.odd_players.events({
	"click .player-name"(e, t) {
		Router.go("history.match.player", {_id: Router.current().params._id, playerId: this.playerId});
		$(window).scrollTop(0);
	},
});
