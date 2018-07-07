import { Collections } from "/lib/declarations";

Template.player_of_day.onCreated(function() {
  let self = this;
  self.autorun(function() {
    self.subscribe("winner_last_date");
    self.subscribe("players");
  });
});

Template.player_of_day.helpers({
  lastDate() {
    return Collections.DateSums.findOne({}, {sort: {date: -1}});
  },
  date() {
    return moment(this.date).format("dddd DD MMM YYYY")
  },
  mostEffPlayer() {
    return {
      id: this.date,
      collection: Collections.DateSums,
      filter: {date: this.date},
      options: {sort: {win_rate: -1}}
    }
  },
  mostWonPlayer() {
    return {
      id: this.date,
      collection: Collections.DateSums,
      filter: {date: this.date},
      options: {sort: {win_point: -1}}
    }
  },
  mostBetPlayer() {
    return {
      id: this.date,
      collection: Collections.DateSums,
      filter: {date: this.date},
      options: {sort: {bet_sum: -1}}
    }
  },
});

Template.player_of_day.events({
  "click .home-player-item"(e, t) {
    Router.go("ranking.day", {date: moment(this.date).format("YYYY-MM-DD")});
    $(window).scrollTop(0);
  },
});
