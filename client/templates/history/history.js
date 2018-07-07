import { initTimeFilter } from "../common/helpers";

Template.history.onCreated(function() {
  let self = this;
  self.autorun(function() {
    let timeFilter = initTimeFilter(-1, 0);
    if (!timeFilter) return;
    self.subscribe("matches_past", {$gte: moment(timeFilter.startDate).toDate(), $lte: moment(timeFilter.endDate).endOf("day").toDate()});
  });
});

Template.history.helpers({
  initFilter() {
    if (!initTimeFilter(-1, 0)) return;
    return {time: {$lte: new Date()}};
  },
});

Template.history.events({
  "click .match-row_match"(e, t) {
    Router.go("history.match", {_id: this._id});
  },
});
