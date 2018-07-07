import { Router } from "meteor/iron:router";
import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";

Router.configure({
  layoutTemplate: "mainLayout",
  notFoundTemplate: "notFound"
});

Router.onBeforeAction(function() {
  if (!Meteor.userId()) {
    this.layout("blankLayout");
    this.render("login");
    return;
  }

  // all good, move on
  this.next();
});

AccountsTemplates.configure({
  onLogoutHook() {
    Router.go("/");
  }
});

//========= Normal player routes ============
Router.route("/", function() {
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Home"}});
  this.render("main");
}, {name: "home", title: "Home", loadingTemplate: 'loading',});

Router.route("/sponsors", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Sponsors List"}});
  this.render("sponsors");
}, {name: "sponsors", title: "Sponsors", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/matches", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Games List"}});
  this.render("player_matches");
}, {name: "player.matches", title: "Games", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/match/:_id", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Markets & Odds"}});
  this.render("player_match");
}, {name: "player.matches.match", title: "Game", parent: "player.matches", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/slips", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Slips List"}});
  this.render("slips");
}, {name: "player.slips", title: "Slips", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/ranking", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Ranking"}});
  this.render("ranking_overall");
}, {name: "ranking.overall", title: "Ranking", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/ranking/matches", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Game Ranking"}});
  this.render("ranking_matches");
}, {name: "ranking.matches", title: "Game Ranking", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/ranking/match/:_id", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Game Ranking"}});
  this.render("ranking_match");
}, {name: "ranking.matches.match", title: "Game", parent: "ranking.matches", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/ranking/day/:date", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Day Ranking"}});
  this.render("ranking_date");
}, {name: "ranking.day", title: "Day Ranking - :date", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/history", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "History"}});
  this.render("history");
}, {name: "history", title: "History", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/history/match/:_id", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Game History"}});
  this.render("history_match");
}, {name: "history.match", title: "Game", parent: "history", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/history/player/:_id", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Player History"}});
  this.render("history_player_matches");
}, {name: "history.player.matches", title: "Player", parent: "history", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/history/match/:_id/player/:playerId", function() {
  if (Roles.getRolesForUser(Meteor.userId()).length === 0) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Player Game History"}});
  this.render("history_match_player");
}, {name: "history.match.player", title: "Player", parent: "history.match", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/account", function() {
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Account"}});
  this.render("account");
}, {name: "account", title: "Account", parent: "home", loadingTemplate: 'loading'});

//============== Admin and Operator routes =============
Router.route("/users", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Users Management"}});
  this.render("users");
}, {name: "users", title: "Manage Users", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/users/:_id", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "User Editing"}});
  this.render("user");
}, {name: "user.edit", title: "User", parent: "users", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/matches/manage", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Games Management"}});
  this.render("manage_matches");
}, {name: "matches.manage", title: "Manage Games", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/matches/manage/markets/:_id", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Markets Importing"}});
  this.render("import_markets");
}, {name: "matches.manage.markets", title: "Import Markets", parent: "matches.manage", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/result/update", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Result Updating"}});
  this.render("result_update");
}, {name: "result.update", title: "Update Result", parent: "home", loadingTemplate: 'loading', waitOn: function() {
  return Meteor.subscribe("_roles");
}});

Router.route("/result/update/:_id", function() {
  if (!Roles.userIsInRole(Meteor.userId(), ["administrator", "operator"])) {
    Router.go("home");
    return;
  }
  this.layout(this.lookupOption("layoutTemplate"), {data: {title: "Win Odds Picking"}});
  this.render("result_odd_pick");
}, {name: "result.update.odds", title: "Pick Win Odds", parent: "result.update", loadingTemplate: 'loading',waitOn: function() {
  return Meteor.subscribe("_roles");
}});
