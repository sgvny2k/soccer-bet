import { Collections } from "/lib/declarations";

Template.player_of_match.onCreated(function() {
  let self = this;
  self.autorun(function() {
    self.subscribe("last_match");
    self.subscribe("players");
  });
});

Template.player_of_match.helpers({
  lastMatch() {
    let match = Collections.Matches.findOne({result: {$exists: 1}}, {sort: {time: -1}});
    if (!match) return;
    let t = Template.instance();
    t.subscribe("ranking_match", match._id);

    return match;
  },
  matchDate() {
    return moment(this.time).format("HH:mm dddd D MMM YYYY");
  },
  mostEffPlayer() {
    return {
      id: this._id,
      collection: Collections.MatchSums,
      filter: {matchId: this._id},
      options: {sort: {win_rate: -1}}
    }
  },
  mostWonPlayer() {
    return {
      id: this._id,
      collection: Collections.MatchSums,
      filter: {matchId: this._id},
      options: {sort: {win_point: -1}}
    }
  },
  mostBetPlayer() {
    return {
      id: this._id,
      collection: Collections.MatchSums,
      filter: {matchId: this._id},
      options: {sort: {bet_sum: -1}}
    }
  },
});

Template.player_of_match.events({
  "click .match-row_match"(e, t) {
    Router.go("history.match", {_id: this._id});
    $(window).scrollTop(0);
  },
  "click .home-player-item"(e, t) {
    Router.go("history.match.player", {_id: this.matchId, playerId: this.playerId});
    $(window).scrollTop(0);
  },
});

Template.home_player_item.helpers({
  player() {
    return this.selector.collection.findOne(this.selector.filter, this.selector.options);
  },
  playerName() {
    let player = Collections.Players.findOne(this.playerId);
    return player && player.name;
  },
  labelClass() {
    if (this.win_point > 0) return "success";
    else if (this.win_point === 0) return "primary";
    else return "danger";
  },
});
