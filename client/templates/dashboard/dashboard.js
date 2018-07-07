import { Collections } from "/lib/declarations";

Template.main.onCreated(function() {
  let self = this;
  self.autorun(function() {
    self.subscribe("player_slips");
  });
});

Template.main.helpers({
  isPlayer() {
    return Collections.Players.findOne({userId: Meteor.userId()});
  }
});
