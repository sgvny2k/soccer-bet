import { Meteor } from 'meteor/meteor';
import { moment } from "meteor/momentjs:moment";
import { Collections } from "/lib/declarations";
import { initTimeFilter } from "../common/helpers";

Template.result_update.onCreated(function() {
  let self = this;
  self.autorun(function() {
    let wait = Router.current().getParams().query.wait;
    if (!wait) {
      let timeFilter = initTimeFilter(-1, 0);
      if (!timeFilter) return;
      self.subscribe("matches_past", {$gte: moment(timeFilter.startDate).toDate(), $lte: moment(timeFilter.endDate).endOf("day").toDate()});
    } else {
      self.subscribe("matches_past", {wait: true});
    }
  });
});

Template.result_update.helpers({
  thisInstance() {
    return Template.instance();
  },
  initFilter() {
    let wait = Router.current().getParams().query.wait;
    if (!wait) {
      if (!initTimeFilter(-1, 0)) return;
    }
    return {time: {$lte: new Date()}};
  },
});

export let updateResult = function() {
  let data = this;
  swal({
    title: "Update score",
    text: data.name,
    type: "input",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    inputPlaceholder: "Score",
    confirmButtonText: "Save",
    closeOnConfirm: false,
  }, function(val) {
    if (val === false) return false;
    if (val === "") {
      swal.showInputError("There must be a score.");
      return false;
    }
    let saveData = {id: data._id, val: val};
    Meteor.call("saveResult", saveData, function(err, r) {
      if (err) {
        swal("Error", e.reason || e.message, "error");
        return;
      }
      swal.close();
    });
  });
  $(".sweet-alert input").val(data.result);
}

Template.result_update.events({
  "click .match-row_match"(e, t) {
    updateResult.apply(this);
  },
  "click .match-info span"(e, t) {
    e.stopPropagation();
    Router.go("result.update.odds", {_id: this._id});
  },
});
