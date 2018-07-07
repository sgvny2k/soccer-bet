import { Collections } from "/lib/declarations";
import { moment } from "meteor/momentjs:moment";
import { Router } from "meteor/iron:router";
import { initTimeFilter } from "../common/helpers";

Template.ranking_matches.onCreated(function() {
  let self = this;

  self.autorun(function() {
    let timeFilter = initTimeFilter(-1, 0);
    if (!timeFilter) return;
    self.subscribe("matches_past", {$gte: moment(timeFilter.startDate).toDate(), $lte: moment(timeFilter.endDate).endOf("day").toDate()});
  });
});

Template.ranking_matches.helpers({
  initFilter() {
    if (!initTimeFilter(-1, 0)) return;
    return {time: {$lte: new Date()}};
  },
});

Template.ranking_matches.events({
  "click .match-row_match"(e, t) {
    // go to the match ranking page
    Router.go("ranking.matches.match", {_id: this._id});
  },
});
