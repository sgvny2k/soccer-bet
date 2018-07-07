import { Collections } from "/lib/declarations";
import { moment } from "meteor/momentjs:moment";

Template.sponsors.onCreated(function() {
  let self = this;
  self.autorun(function() {
    self.subscribe("players");
    self.subscribe("transfers");
  });
});

Template.sponsors.helpers({
  sponsors() {
    let t = Template.instance();
    t.sum = 0;
    let sponsors = Collections.Players.find({}, {sort: {init_point: -1}});
    return sponsors.map((sponsor, idx) => {
      t.sum += sponsor.init_point;
      sponsor.position = idx + 1;
      return sponsor;
    });
  },
  sum() {
    return Template.instance().sum;
  },
  transfers() {
    return Collections.Transfers.find({}, {sort: {when: -1}}).map(transfer => {
      let fromPlayer = Collections.Players.findOne(transfer.from);
      let toPlayer = Collections.Players.findOne(transfer.to);
      return {
        from: fromPlayer.name,
        to: toPlayer.name,
        amount: transfer.amount,
        when: moment(transfer.when).format("DD/MM/YYYY HH:mm")
      }
    });
  },
});

Template.sponsors.events({
  "click .sponsor-amount"(e, t) {
    if ($(e.currentTarget).parent().hasClass("no-event")) {
      return;
    }

    // the event target is a child of rank-item so stop event bubbling
    if (topup({playerId: this._id, userId: this.userId})) {
      e.stopPropagation();
    }
  },
  "click .rank-item"(e, t) {
    if ($(e.currentTarget).hasClass("no-event")) {
      return;
    }
    let self = this;
    // there is no point transferring point to oneself
    if (self.userId === Meteor.userId()) {
      // oneself can topup
      topup({playerId: self._id, userId: self.userId});
      return;
    }

    let playerName = $(e.currentTarget).find(".rank-name").text();
    let b = Collections.PlayerBalance.findOne();
    let formatFloat = Blaze._globalHelpers.formatFloat;
    let balance = (b && b.balance) || 0;
    swal({
      title: "Transfer points",
      text: "Transfer your points to " + playerName + ". Your balance is: " + formatFloat(balance),
      type: "input",
      inputType: "number",
      inputValue: 100,
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "OK",
      closeOnConfirm: false,
    }, function(val) {
      // cancel
      if (val === false) return;
      if (val <= 0) {
        swal.showInputError("Invalid value.");
        return;
      }
      if (val > balance) {
        swal.showInputError("The amount exceeds your balance.");
        return;
      }
      let data = {
        playerId: self._id,
        amount: val
      };
      Meteor.call("transfer", data, function(e, r) {
        if (e) {
          swal.showInputError(e.reason || e.message);
          return;
        }
        swal.close();
      });
    });
    // set some constraints for number input
    $(".sweet-alert input").attr({step: 100/*, min: 100*/});
  },
});

let topup = function(data) {
  // only admin has rights to topup to others
  if (!Roles.userIsInRole(Meteor.userId(), "administrator") && data.userId !== Meteor.userId()) {
    return false;
  }
  let selfTopup = (data.userId === Meteor.userId() && !Roles.userIsInRole(Meteor.userId(), "administrator"));
  let msg = (selfTopup) ? "Please enter a multiplication of 100." : "Negative numbers for transfering.";

  swal({
    title: "Sponsor",
    text: msg,
    type: "input",
    inputType: "number",
    inputValue: 100,
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "OK",
    closeOnConfirm: false,
  }, function(val) {
    if (selfTopup) {
      // check value
      if (val < 100 || val % 100 !== 0) {
        swal.showInputError("Please enter a number multiplied by 100.");
        return;
      }
    }
    if (val === false) return true;

    data.amount = val;
    Meteor.call("topup", data, function(e, r) {
      if (e) {
        swal.showInputError(e.reason || e.message);
        return;
      }
      swal.close();
    });
  });
  // set some constraints for number input
  let attrs = {step: 100};
  if (selfTopup) {
    attrs.min = 100;
  }
  $(".sweet-alert input").attr(attrs);
  return true;
}
