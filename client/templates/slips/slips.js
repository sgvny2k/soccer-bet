import { Meteor } from "meteor/meteor";
import { Router } from "meteor/iron:router";
import  SimpleSchema  from "simpl-schema";
import { Collections } from "/lib/declarations";
import { Player } from "../common/helpers";
import { moment } from "meteor/momentjs:moment";
import { scrollToPos } from "../common/helpers";

Template.slips.onCreated(function() {
	let self = this;
	self.autorun(function() {
		// suppose to subscribe to "player_slips" but it has been done in navigation
		// self.subscribe("player_slips");
	});
});

/**
 * Add match data to a slip.
 * @param slip: the slip
 * @param t: template instance which keeps a cache of matches from DB
 * @return the slip with match data attached to it.
 */
let matchSlip = function(slip, t) {
	let match = Collections.Matches.findOne(slip.matchId);
	if (!match) return;

	// attach match data to slip
	slip.matchName = match.name;
	slip.time = match.time;
	slip.matchTime = moment(match.time).format("DD/MM/YYYY HH:mm");

	slip.marketName = match.markets[slip.marketIdx].name;
	slip.oddName = match.markets[slip.marketIdx].odds[slip.oddIdx].name;
	slip.oddValue = match.markets[slip.marketIdx].odds[slip.oddIdx].value;

	return slip;
}

/**
 * Sort slips by match time, then match name
 */
let sortSlips = function(slip1, slip2) {
	let timeCompare = moment(slip1.time).unix() - moment(slip2.time).unix();
	if (timeCompare !== 0) return timeCompare;
	return slip1.matchName.localeCompare(slip2.matchName);
}

Template.slips.helpers({
	balance() {
		let b = Collections.PlayerBalance.findOne();
		return (b && b.balance) || 0;
	},
	waitingSlips() {
		let slips = Collections.Slips.find({userId: Meteor.userId(), $or: [{bet: 0}, {bet: {$exists: 0}}]});
		let t = Template.instance();
		return slips.map(function(slip) {
			if (slip.marketIdx !== -1) return matchSlip(slip, t);
		}).sort(sortSlips);
	},
	betSlips() {
		let slips = Collections.Slips.find({userId: Meteor.userId(), bet: {$gt: 0}, matchTime: {$gt: new Date()}});
		let t = Template.instance();
		return slips.map(slip => {
			if (slip.marketIdx !== -1) return matchSlip(slip, t);
		}).sort(sortSlips);
	},
	betSlipsNotUpdated() {
		let slips = Collections.Slips.find({userId: Meteor.userId(), bet: {$gt: 0}, won: {$exists: 0}, matchTime: {$lte: new Date()}});
		let t = Template.instance();
		return slips.map(slip => {
			if (slip.marketIdx !== -1) return matchSlip(slip, t);
		}).sort(sortSlips);
	},
});

Template.slip_list.events({
	"click .js-remove-all"(e, t) {
		swal({
		title: "Are you sure?",
		text: "This will remove all your pending slips in different matches. You will have to choose them again.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Confirm",
		closeOnConfirm: false,
		}, function() {
			Meteor.call("removePendingSlips", function(e, r) {
				if (e) {
					swal("Error", e.reason || e.message, "error");
					return;
				}
				swal.close();
			});
		});
	},
});


Template.slip_item.helpers({
	slipStatus(pp) {
		return pp.slipStatus;
	},
	betAmount() {
		return this.bet;
	},
	nonRemovable() {
		let data = Template.parentData(1);
		return (data.slipStatus === "lost");
	},
});

Template.slip_item.events({
	"click .js-remove-slip"(e, t) {
		e.stopPropagation();
		removeSlip(this, t);
	},
	"click .js-odd"(e, t) {
		Router.go("player.matches.match", {_id: this.matchId});
	},
});

Template.bet_form.onCreated(function() {
	let slip = this.data;
	this.etw = new ReactiveVar((slip && slip.bet && (slip.bet * slip.oddValue - slip.bet).toFixed(2)) || 0);
});

Template.bet_form.helpers({
	estimateWin() {
		let etw = Template.instance().etw.get();
		return isNaN(etw) ? 0 : etw;
	},
	disabled() {
		let data = Template.parentData(1);
		return (data.slipStatus === "lost");
	},
});

Template.bet_form.events({
	"click .js-save-slip"(e, t) {
		let slip = this;
		if (moment(slip.time).isBefore(new Date())) {
			swal("Error", "Cannot change a bet for a happened game.", "error");
			return;
		}
		let betAmount = parseFloat(t.$(".js-betAmount").val());
		if (isNaN(betAmount)) betAmount = 0;
		if (betAmount === slip.bet || (!slip.bet && !betAmount)) return;
		// check with current balance
		let balance = Collections.PlayerBalance.findOne().balance;
		if (slip.bet) balance += slip.bet;
		if (balance < betAmount) {
			swal("Bet amount exceeds balance.", "Maximum value can be used is " + balance, "error");
			return;
		}
		let bet = {
			slipId: slip._id,
			amount: betAmount,
			oddValue: slip.oddValue,
			matchTime: slip.time,
			// playerId: slip.playerId
		}
		// save scroll position since the saving rerenders the page with new data
		// mobile version scrolls to top automatically
		let scrollPos = $(window).scrollTop();
		Meteor.call("saveBet", bet, function(e, r) {
			if (e) {
				swal("Error", e.reason || e.message, "error");
				return;
			}
			if (betAmount > 0) {
				swal({
					title: "Your bet was saved.",
					type: "info",
					closeOnConfirm: true,
				}, function() {
					scrollToPos(scrollPos);
				});
			} else if (slip.bet) {
				swal({
					title: "Your bet has been changed to an open slip.",
					text: "Remember to bet before the match starts.",
					type: "info",
					closeOnConfirm: true,
				}, function() {
					scrollToPos(scrollPos);
				});
			}
		});
	},
	"blur .js-betAmount, keyup .js-betAmount"(e, t) {
		let bet = parseFloat(t.$(".js-betAmount").val());
		t.etw.set((this.oddValue * bet - bet).toFixed(2));
		if (e.type === "keyup" && e.keyCode === 13) {
			t.$(".js-save-slip").trigger("click");
		}
	},
	"submit #formBet"(e, t) {
		// Do not let the form submit. It will load a new web page.
		return false;
	},
});

export let removeSlip = function(slip, t) {
	let scrollPos = $(window).scrollTop();
	swal({
		title: "Are you sure?",
		text: "Remove the slip permanently.",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "OK",
		closeOnConfirm: true,
	}, function() {
		scrollToPos(scrollPos);
		t.$(".js-remove-slip").animateCss("rotateIn");

		// keep parent element for adding the slip UI back if could not remove it
		let jqEl = t.$(".market-item");
		jqEl.animateCss("fadeOut", function() {
			Meteor.call("removeSlip", slip._id, function(e, r) {
				if (e) {
					jqEl.removeClass("animated fadeOut");
					swal("Error", e.reason || e.message, "error");
					return;
				}
				jqEl.remove();
			});
		});
	});
}
