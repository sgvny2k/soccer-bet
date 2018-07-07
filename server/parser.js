import { Collections } from "/lib/declarations";

Meteor.publish("parser", function() {
  if (!this.userId || !Roles.userIsInRole(this.userId, ["administrator", "operator"])) return [];
  return Collections.Parser.find();
});

Meteor.methods({
  saveParser(parser) {
    if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) return;
    var id = Collections.Parser.insert(parser);
    // just keep one version for now
    Collections.Parser.remove({_id: {$ne: id}});
  },
});
