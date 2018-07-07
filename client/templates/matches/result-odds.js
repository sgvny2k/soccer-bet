import { Meteor } from "meteor/meteor";
import { Router } from "meteor/iron:router";
import { Collections } from "/lib/declarations";
import { updateResult } from "./result-update";

Template.result_odd_pick.onCreated(function() {
  let self = this;
  self.autorun(function() {
    self.matchId = Iron.controller().getParams()._id;
    self.subscribe("one_match_in_past", self.matchId);
  });
  self.match = new ReactiveVar();
});

Template.result_odd_pick.helpers({
  match() {
    let template = Template.instance();
    let match = Collections.Matches.findOne(template.matchId);
    template.match.set(match);
    return match;
  },
  markets() {
    let template = Template.instance();
    let match = template.match.get();
    return match && match.markets;
  },
  matchDate() {
    return moment(this.time).format("dddd D MMM YYYY");
  },
});

Template.result_odd_pick.events({
  "click .js-odd"(e, t) {
    // toggle winning state
    let jqOdd = $(e.currentTarget);
    let currentState = jqOdd.hasClass("mark");
    let oddIdx = parseInt(jqOdd.data("index"));
    let marketIdx = parseInt(jqOdd.closest("div.panel-body").siblings().first().data("index"));
    // save odd
    Meteor.call("saveOdd", {matchId: t.matchId, marketIdx: marketIdx, oddIdx: oddIdx, win: !currentState});
  },
  "click .js-save"(e, t) {
    // pass the markets to servers for saving
    let match = t.match.get();
    Meteor.call("saveOdds", {matchId: t.matchId, markets: match.markets}, function(e, r) {
      if (e) {
        swal("Error", e.reason || e.message, "error");
        return;
      }
      swal("Odds saved.", "", "info");
    });
  },
  "click .match-row_match"(e, t) {
    updateResult.apply(this);
  },
});
