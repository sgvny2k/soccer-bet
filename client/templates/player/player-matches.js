import { Meteor } from 'meteor/meteor';
import { moment } from "meteor/momentjs:moment";
import { Collections } from "/lib/declarations";
import { initTimeFilter } from "../common/helpers";

Template.player_matches.onCreated(function() {
  let self = this;

  self.autorun(function() {
    if (!initTimeFilter(0, 1)) return;
    self.subscribe("matches_future");
  });
});

Template.player_matches.helpers({
  initFilter() {
    if (!initTimeFilter(0, 1)) return;
    return {time: {$gte: new Date()}};
  },
  now() {
    return moment();
  },
});

Template.player_matches.events({
  "click .match-row_match"(e, t) {
    Router.go("player.matches.match", {_id: this._id});
  },
});
