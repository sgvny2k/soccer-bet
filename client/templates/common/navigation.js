import { Collections } from "/lib/declarations";
import { Player } from "../common/helpers";

Template.navigation.onCreated(function() {
  let self = this;
  self.menu = new ReactiveVar();
  self.autorun(function() {
    self.subscribe("player_slips");
    self.subscribe("player_balance");
    self.subscribe("op_matches_update");
    self.subscribe("menuitems");
  });
});

Template.navigation.helpers({
  /**
   * Fetch menu items from server
   */
  menuItems() {
    let menu = Collections.MenuItems.findOne();
    if (menu) {
      $(window).trigger("resize");
      return menu.menu;
    }
  },
  showBadges() {
    let slipsBet = Collections.Slips.find({userId: Meteor.userId(), bet: {$gt: 0}, matchTime: {$gt: new Date()}});
    let slipsBetPast = Collections.Slips.find({userId: Meteor.userId(), bet: {$gt: 0}, matchTime: {$lte: new Date()}, won: {$exists: 0}});
    let slipsWait = Collections.Slips.find({userId: Meteor.userId(), $or: [{bet: 0}, {bet: {$exists: 0}}], matchTime: {$gt: new Date()}});
    // @NOTE: menu data are available but the template takes sometime to render
    // so give it some times before going on
    Meteor.setTimeout(
      _showBadges.bind(
        this,
        Template.instance(),
        slipsBet && slipsBet.count(),
        slipsWait && slipsWait.count(),
        slipsBetPast && slipsBetPast.count()
      ),
      100
    );
  },
  showOpBadges() {
    let matches = Collections.Matches.find({result: {$exists: 0}, time: {$lt: new Date()}});
    Meteor.setTimeout(
      _showOpBadges.bind(
        this,
        Template.instance(),
        matches && matches.count()
      ),
      100
    );
  },
});

let _hideMenu = function() {
  // mobile mode should hide menu when click
  if ($('body').hasClass('show-sidebar')) {
    $('body').removeClass('show-sidebar');
    $(".toggleMenu").removeClass("active");
  }
  $('body').scrollTop(0);
}

Template.navigation.events({
  "click a"(e, t) {
    _hideMenu();
  },
  "click .js-games-wait"(e, t) {
    e.preventDefault();
    e.stopPropagation();
    Router.go("result.update", {}, {query: {wait: 1}});
    _hideMenu();
    return false;
  },
});

let _showBadges = function(t, slipsBetCount, slipsWaitCount, slipsBetPastCount) {
  let selector = "li a[href='" + Router.routes["player.slips"].path() + "']";
  let jqItem = t.$(selector);

  if (jqItem.length === 0) {
    // wait a bit more for template to generate items with new data
    Meteor.setTimeout(
      _showBadges.bind(
        this,
        t,
        slipsBetCount,
        slipsWaitCount,
        slipsBetPastCount
      ),
      100
    );
    return;
  }

  let badge = t.$("span.badge.js-sum-bet");
  if (slipsBetCount) {
    if (badge.length === 0) {
      badge = $("<span class=\"badge js-sum-bet\"></span>");
      badge.appendTo(jqItem);
    }
    if (badge.html() != slipsBetCount) {
      badge.html(slipsBetCount).animateCss("bounce");
    }
  } else {
    badge.animateCss("fadeOut");
    badge.remove();
  }

  badge = t.$("span.badge.js-sum-wait");
  if (slipsWaitCount) {
    if (badge.length === 0) {
      badge = $("<span class=\"badge js-sum-wait\"></span>");
      badge.appendTo(jqItem);
    }
    if (badge.html() != slipsWaitCount) {
      badge.html(slipsWaitCount).animateCss("bounce");
    }
  } else {
    badge.animateCss("fadeOutUp", function() {
      badge.remove()
    });
  }

  badge = t.$("span.badge.js-sum-bet-past");
  if (slipsBetPastCount) {
    if (badge.length === 0) {
      badge = $("<span class=\"badge js-sum-bet-past\"></span>");
      badge.appendTo(jqItem);
    }
    if (badge.html() != slipsBetPastCount) {
      badge.html(slipsBetPastCount).animateCss("bounce");
    }
  } else {
    badge.animateCss("fadeOutUp", function() {
      badge.remove()
    });
  }
};

let _showOpBadges = function(t, matchesCount) {
  let selector = "li a[href='" + Router.routes["result.update"].path() + "']";
  let jqItem = t.$(selector);

  if (jqItem.length === 0) {
    // wait a bit more for template to generate items with new data
    Meteor.setTimeout(
      _showOpBadges.bind(
        this,
        t,
        matchesCount
      ),
      100
    );
    return;
  }

  let badge = t.$("span.badge.js-games-wait");
  if (matchesCount) {
    if (badge.length === 0) {
      badge = $("<span class=\"badge js-games-wait\"></span>");
      badge.appendTo(jqItem);
    }
    if (badge.html() != matchesCount) {
      badge.html(matchesCount).animateCss("bounce");
    }
  } else {
    badge.animateCss("fadeOut");
    badge.remove();
  }
};
