import  SimpleSchema  from "simpl-schema";
import { Schemas, Collections } from "/lib/declarations";
import { moment } from "meteor/momentjs:moment";
import { URLFormatter } from "../common/helpers";
import { Session } from 'meteor/session';
import { initTimeFilter } from "../common/helpers";

Template.match_list.onCreated(function() {
	let wait = Router.current().getParams().query.wait;
	if (!wait) {
		initTimeFilter(-1, 1);
	}
});

Template.match_list.helpers({
	matchesByDates() {
		let selector = {};
		let timeFilter = Router.current().getParams().query;

		if (this.noPast && moment().startOf("day").isAfter(timeFilter.startDate)) {
			timeFilter.startDate = moment().format("YYYY-MM-DD");
		}
		if (this.noFuture && moment().endOf("day").isBefore(timeFilter.endDate)) {
			timeFilter.endDate = moment().format("YYYY-MM-DD");
		}

		if (timeFilter.startDate && timeFilter.endDate) {
			selector.time = {
				$gte: moment(timeFilter.startDate).toDate(),
				$lte: moment(timeFilter.endDate).endOf("day").toDate()
			};
			if (this.init && this.init.time) {
				if (this.init.time.$lte && moment(this.init.time.$lte).isBefore(selector.time.$lte)) {
					selector.time.$lte = this.init.time.$lte;
				}
				if (this.init.time.$gte && moment(this.init.time.$gte).isAfter(selector.time.$gte)) {
					selector.time.$gte = this.init.time.$gte;
				}
			}
		}

		let text = Session.get("teamFilter");
		if (text && text.length > 0) {
			selector.name = {$regex: ".*" + text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ".*", $options: "i"};
			// user requested: if name is selected, no time filter
			if (this.init && this.init.time) {
				selector.time = this.init.time;
			}
		}

		if (this.init && this.init.time && !selector.time) {
			selector.time = this.init.time;
		}

		if (timeFilter.wait) {
			selector.result = {$exists: 0};
		}
		matches = Collections.Matches.find(selector, {sort: {time: 1, name: 1}});

		let matchesByDates = {};
		matches.forEach((match, idx) => {
			let strDate = moment(match.time).format("dddd D MMM YYYY");
			if (!matchesByDates[strDate]) {
				matchesByDates[strDate] = {date: strDate, matches: []};
			}
			matchesByDates[strDate].matches.push(match);
		});
		// return new created array
		return Object.keys(matchesByDates).map(strDate => {
			return matchesByDates[strDate];
		});
	},
	timeFilter() {
		let timeFilter = Router.current().getParams().query;
		return {
			startDate: moment(timeFilter.startDate).format("DD/MM/YYYY"),
			endDate: moment(timeFilter.endDate).format("DD/MM/YYYY")
		};
	},
	showTimeFilter() {
		let timeFilter = Router.current().getParams().query;
		return (!timeFilter.wait);
	}
});

Template.match_list.events({
	"click .js-more-matches"(e, t) {
		t.$(".js-more-matches").blur();
		let timeFilter = Router.current().getParams().query;
		timeFilter.endDate = moment(timeFilter.endDate).add(1, 'days').format("YYYY-MM-DD");
		Router.go(Router.current().route.getName(), Router.current().getParams(), {query: timeFilter});
	},
	"click .js-more-matches-past"(e, t) {
		t.$(".js-more-matches-past").blur();
		let timeFilter = Router.current().getParams().query;
		timeFilter.startDate = moment(timeFilter.startDate).add(-1, 'days').format("YYYY-MM-DD");
		Router.go(Router.current().route.getName(), Router.current().getParams(), {query: timeFilter});
	},
	"click .match-list-period"(e, t) {
		Router.go(Router.current().route.getName(), Router.current().getParams(), {query: {
			startDate: moment().add(-1, 'days').format("YYYY-MM-DD"),
			endDate: moment().add(1, 'days').format("YYYY-MM-DD")
		}});
	},
});

Template.match_item.helpers({
	teamHome() {
		let names = this.name.toLowerCase().split(" vs ");
		if (names.length === 2) {
			return names[0].trim();
		} else {
			return names;
		}
	},
	teamAway() {
		let names = this.name.toLowerCase().split(" vs ");
		if (names.length === 2) {
			return names[1].trim();
		}
	},
	matchTime() {
		if (this.result) {
			return this.result;
		}
		// no result, return match time
		return moment(this.time).format("HH:mm");
	},
	marketsCount() {
		return (this.markets && this.markets.length) || 0;
	},
	removeSpaces(text) {
		return text.replace(/\s/g, '');
	}
});

Template.match_filter.onCreated(function() {
	this.groups = new ReactiveVar();
});

Template.match_filter.helpers({
	teamGroups() {
		let t = Template.instance();
		let teamGroups = t.groups.get();
		if (teamGroups) return teamGroups;

		Meteor.call("allMatchNames", function(e, r) {
			if (e) {
				swal("Error", e.reason || e.message, "error");
				return;
			}
			let teams = {};
			r.forEach(match => {
				var names = match.name.toLowerCase().split(" vs ");
				if (names.length === 2) {
					teams[names[0].trim()] = "";
					teams[names[1].trim()] = "";
				}
			});
			let groups = [];
			let idx = 0;
			groups = Object.keys(teams).sort((a, b) => {
				return a.localeCompare(b);
			});
			t.groups.set(groups);
		});
	},
	filter() {
		return Session.get("teamFilter");
	},
});

Template.match_filter.events({
	"click .js-filter"(e, t) {
		t.$(".js-filter").blur();
	},
	"click .team-item"(e, t) {
		t.$(".collapse").collapse("hide");
		Session.set("teamFilter", this.toString());
	},
	"click .js-clear-filter"(e, t) {
		Session.set("teamFilter", undefined);
		delete Session.keys.teamFilter;
		t.$(".collapse").collapse("hide");
	},
});
