import { Collections } from "/lib/declarations";
import { initTimeFilter } from "../common/helpers";

Template.history_player_matches.onCreated(function() {
  let self = this;
  self.autorun(function() {
    if (!initTimeFilter(-1, 0)) return;
    self.subscribe("history_player_matches", Router.current().params._id);
  });
});

Template.history_player_matches.helpers({
  initFilter() {
    if (!initTimeFilter(-1, 0)) return;
    return {time: {$lte: new Date()}};
  },
});

Template.history_player_matches.events({
  "click .match-row_match"(e, t) {
    Router.go("history.match.player", {_id: this._id, playerId: Router.current().params._id});
  },
});
