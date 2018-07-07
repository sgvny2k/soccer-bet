import { Meteor } from "meteor/meteor";
import { Router } from "meteor/iron:router";
import { Collections } from "/lib/declarations";
import { Player } from "../common/helpers";
import { scrollToPos } from "../common/helpers";

Template.player_match.onCreated(function() {
	let self = this;
	self.matchId = Iron.controller().getParams()._id;
	self.autorun(function() {
		self.subscribe("one_match_in_future", self.matchId);
		self.subscribe("players");
		if (self.subscriptionsReady()) {
			let user = Meteor.user();
			if (user) {
				let player = user.getPlayer();
				self.playerId = player && player._id;
			}
		}
	});

	self.markets = new ReactiveVar();
});

Template.player_match.helpers({
	balance() {
		let b = Collections.PlayerBalance.findOne();
		return (b && b.balance) || 0;
	},
	match() {
		let template = Template.instance();
		let match = Collections.Matches.findOne(template.matchId);
		template.match = match;
		if (!match) return;

		let slips = Collections.Slips.find({matchId: template.matchId, bet: {$exists: 1}});
		slips.forEach(slip => {
			let odd = match.markets[slip.marketIdx].odds[slip.oddIdx];
			if (!odd.players) odd.players = [];
			let player = Collections.Players.findOne(slip.playerId);
			if (!player) return;
			odd.players.push({playerId: slip.playerId, name: player.name, bet: slip.bet});
		});

		template.matchTime = match.time;
		template.markets.set(match.markets);
		return match;
	},
	matchDate() {
		return moment(this.time).format("dddd D MMM YYYY");
	},
	markets() {
		let template = Template.instance();
		return template.markets.get();
	},
	modOdds(marketIdx) {
		let data = this;
		data.odds.forEach((odd, idx) => {
			data.odds[idx].marketIndex = marketIdx;
		});
		return data.odds;
	},
	slip(marketIdx, oddIdx) {
		// slips should include odd data
		let template = Template.instance();
		let markets = template.markets.get();
		let slip = Collections.Slips.findOne({
			playerId: template.playerId,
			matchId: template.matchId,
			marketIdx: marketIdx,
			oddIdx: oddIdx
		});
		let data = _.clone(this);
		// don't know if slip exists so remove bet first
		delete data.bet;
		_.extend(data, slip, {time: template.matchTime});
		return data;
	},
	slipState() {
		if (this.oddValue === undefined) {
			return;
		}

		if (this.bet > 0) {
			return "mark";
		} else {
			return "wait"
		}
	},
	showBetForm() {
		return !this.bet && this.oddValue;
	},
	betAmount() {
		if (!this.bet) {
			return;
		}
		return this.bet;
	},
});

let _class = {
  wait: "",
  mark: "",
}

Template.player_match.events({
  "click .js-odd"(e, t) {
    let data = this;
    if (moment(data.time).isBefore(new Date())) {
      swal("Error", "Cannot change a bet for a happened game.", "error");
      return;
    }
    // toggle odd states
    let jqOdd = $(e.currentTarget);
    // guess the next class
    let classes = jqOdd.attr("class").split(/\s+/);
    let nextClass = "";
    let ev = classes.every(c => {
      if (_class[c] !== undefined) {
        jqOdd.removeClass(c);
        nextClass = _class[c];
        return false;
      }
      return true;
    });
    if (ev) {
      nextClass = "wait";
    }
    jqOdd.addClass(nextClass);

    // save the state to database
    let oddIdx = parseInt(jqOdd.data("index"));
    let slipId = jqOdd.data("slip");
    let marketIdx = parseInt(jqOdd.closest("div.panel-body").siblings().first().data("index"));
    // slip does not exist
    if (!data.oddValue) {
      let slip = {
        playerId: t.playerId,
        matchId: t.matchId,
        marketIdx: marketIdx,
        oddIdx: oddIdx,
        matchTime: t.matchTime,
        oddValue: data.value
      };
      Meteor.call("saveSlip", slip, function(err, result) {
        if (err) {
          swal("Error", err.reason || err.message, "error");
          // revert to the previous the odd state
          jqOdd.removeClass(nextClass);
          jqOdd.addClass(classes.join(" "));
          return;
        }
        // store the new slipId
        if (result && result.insertedId) {
          jqOdd.data("slip", result.insertedId);
        }
      });
    } else {
      // a bet slip
      if (data.bet) {
        let scrollPos = $(window).scrollTop();
        swal({
          title: "Are you sure?",
          text: "This slip is bet. Remove it anyway.",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Confirm",
          closeOnConfirm: true,
        }, function(isConfirm) {
          if (isConfirm) {
            Meteor.call("removeSlip", slipId);
          } else {
            // revert to the previous the odd state
            jqOdd.removeClass(nextClass);
            jqOdd.addClass(classes.join(" "));
          }
          scrollToPos(scrollPos);
        });
        jqOdd.parent().find(".player-names").collapse("toggle");
      } else {
        // an open slip
        Meteor.call("removeSlip", slipId);
      }
    }
  },
});
