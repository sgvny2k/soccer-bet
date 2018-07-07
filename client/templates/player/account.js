import { Accounts } from "meteor/accounts-base";
import { Collections } from "/lib/declarations";

Template.account.helpers({
  displayName() {
    let player = Collections.Players.findOne({userId: Meteor.userId()});
    return player && player.name;
  },
});

Template.account.events({
  "submit #change-name"(e, t) {
    e.preventDefault();
    Meteor.call("changeName", t.$("#name").val().trim(), function(e, r) {
      if (e) {
        swal("Error", e.reason || e.message, "error");
        return;
      }
      swal("Name changed", "", "info");
      t.$("#change-name")[0].reset();
    });
  },
  "submit #change-password"(e, t) {
    e.preventDefault();
    Accounts.changePassword(t.$("#old-password").val(), t.$("#new-password").val(), function(e) {
      if (e) {
        swal("Error", e.reason || e.message, "error");
        return;
      }
      swal("Password changed", "", "info");
      t.$("#change-password")[0].reset();
    });
    return false;
  },
  "blur #new-password, blur #new-password-again"(e, t) {
    // compare new passwords
    if (t.$("#new-password").val() !== t.$("#new-password-again").val() && t.$("#new-password-again").val() !== "") {
      t.$("#new-password-again").parent().addClass("has-error").find("span").text("New passwords do not match.").removeClass("hidden");
      t.$("#new-password").parent().addClass("has-error").find("span").text("New passwords do not match.").removeClass("hidden");
    }
  },
  "keyup #new-password, keyup #new-password-again"(e, t) {
    let pp = t.$("#new-password-again").parent();
    if (pp.hasClass("has-error")) {
      pp.removeClass("has-error").find("span").text("").addClass("hidden");
      t.$("#new-password").parent().removeClass("has-error").find("span").text("").addClass("hidden");
    }
  },
});
