import { Collections } from "/lib/declarations";
import { Router } from "meteor/iron:router";
import { moment } from "meteor/momentjs:moment";

Template.ranking_date.onCreated(function() {
	let self = this;
	self.autorun(function() {
		// reactively read date param so that this sub reruns when the param changed
		let paramDate = Iron.controller().getParams().date;
		if (paramDate === "today") {
			self.date = moment().startOf("day");
		} else {
			self.date = moment(paramDate);
			if (!self.date.isValid()) self.date = moment().startOf("day");
		}
		self.subscribe("ranking_date", self.date.format("YYYY-MM-DD"));
		self.subscribe("players");
		self.subscribe("transfers");
	});
});

Template.ranking_date.helpers({
	players() {
		// return Collections.DateSums.find({}, {sort: {position: 1}});
		let dateSums = Collections.DateSums.find({matchId: Router.current().params._id}, {sort: {win_point: -1, win_rate: -1, bet_sum: -1}});
		return dateSums.map((dateSum, idx) => {
			let player = Collections.Players.findOne(dateSum.playerId);
			if (player) {
				dateSum.position = idx + 1;
				dateSum.init_point = player.init_point;
				dateSum.name = player.name;
				return dateSum;
			}
		});
	},
	shownDate() {
		return Template.instance().date.format("dddd D MMM YYYY");
	},
	disableNext() {
		// the requested date should be in past
		if (moment().startOf("day").isSameOrBefore(Template.instance().date)) return true;
	},
});

Template.ranking_date.events({
	"click .js-more-matches-past"(e, t) {
		Router.go("ranking.day", {date: moment(t.date).add(-1, "day").format("YYYY-MM-DD")});
	},
	"click .js-more-matches"(e, t) {
		Router.go("ranking.day", {date: moment(t.date).add(1, "day").format("YYYY-MM-DD")});
	},
});
