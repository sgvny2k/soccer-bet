import { Collections } from "/lib/declarations";

Template.quick_info.helpers({
  balance() {
    let b = Collections.PlayerBalance.findOne();
    return b && b.balance;
  },
  player() {
    return Collections.Players.findOne({userId: Meteor.userId()});
  },
  betSum() {
    let bet_sum = 0;
    let slips = Collections.Slips.find({playerId: this._id, bet: {$gt: 0}, matchTime: {$gt: new Date()}});
    slips.forEach(slip => {
      bet_sum += slip.bet;
    });
    return this.bet_sum + bet_sum;
  },
  slipsBet() {
    let slips = Collections.Slips.find({playerId: this._id, bet: {$gt: 0}, matchTime: {$gt: new Date()}});
    return slips.count()
  },
  slipsWait() {
    let slips = Collections.Slips.find({playerId: this._id, $or: [{bet: 0}, {bet: {$exists: 0}}], matchTime: {$gt: new Date()}});
    return slips.count();
  },
});

Template.quick_info.events({
  "click .js-player-sum"(e, t) {
    Router.go("ranking.overall");
    $(window).scrollTop(0);
  },
  "click .js-player-slips"(e, t) {
    Router.go("player.slips");
    $(window).scrollTop(0);
  },
});
