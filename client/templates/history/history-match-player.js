import { Collections } from "/lib/declarations";

Template.history_match_player.onCreated(function() {
  let self = this;
  self.autorun(function() {
    let params = Iron.controller().getParams();
    self.subscribe("one_match_in_past", params._id);
    self.subscribe("player_match_history", params._id, params.playerId);
  });
});

Template.history_match_player.helpers({
  match() {
    let match = Collections.Matches.findOne(Router.current().params._id);
    let slips = Collections.Slips.find({playerId: Router.current().params.playerId, matchId: Router.current().params._id, bet: {$exists: 1}});
    slips.forEach(slip => {
      if (slip.marketIdx === -1) {
        match.notBet = {bet: slip.bet};
        return;
      }
      let odd = match.markets[slip.marketIdx].odds[slip.oddIdx];
      odd.slip = {won: slip.won, bet: slip.bet};

      if (!match.bet) match.bet = slip.bet || 0;
      else match.bet += slip.bet || 0;
      if (!match.won) match.won = slip.won || 0;
      else match.won += slip.won || 0;
    });
    return match;
  },
  player() {
    return Collections.Players.findOne(Router.current().params.playerId);
  },
  matchDate() {
    return moment(this.time).format("HH:mm dddd D MMM YYYY");
  },
  totalStake() {
    let formatFloat = Blaze._globalHelpers.formatFloat;
    let str = formatFloat(this.bet);
    str = formatFloat(this.won - this.bet) + "/" + str;
    return str;
  },
  statusClass() {
    if (this.slip && this.slip.won) return "win";
    else if (this.slip && this.slip.bet) return "lost";
    else if (this.win) return "mark";
  },
});
