import { Collections } from "/lib/declarations";

Meteor.publish("transfers", function() {
  if (!this.userId) return [];
  return Collections.Transfers.find();
});
