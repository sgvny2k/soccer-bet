import  SimpleSchema  from "simpl-schema";
import { Schemas, Collections } from "/lib/declarations";

Template.import_markets.onCreated(function() {
  var self = this;
  self.autorun(function() {
    self.subscribe("parser");
    self.subscribe("manage_markets", Router.current().params._id);
  });
  self.markets = new ReactiveVar([]);
  self.parser = "";
});

Template.import_markets.helpers({
  match() {
    return Collections.Matches.findOne({_id: Router.current().params._id});
  },
  matchDate() {
    return moment(this.time).format("dddd D MMM YYYY");
  },
  schema() {
    return new SimpleSchema({
      html: {
        type: String,
        optional: true,
        label: "HTML"
      },
      parser: {
        type: String,
        optional: true
      }
    });
  },
  loadParser() {
    let parser = Collections.Parser.findOne();
    let parserText = Template.instance().parser = (parser && parser.text) || "";
    return parserText;
  },
  markets() {
    let t = Template.instance();
    // make sure DOM was created
    if (t.view._domrange) {
      t.$(".market-item").removeClass("animated fadeOut processed");
      // recalculate wrapper
      $(window).trigger("resize");
    }
    return t.markets.get();
  },
  hasMarkets() {
    var l = Template.instance().markets.get().length;
    return l;
  },
});

Template.import_markets.events({
  "click .js-save-parser"(e, t) {
    Meteor.call("saveParser", {text: t.$("#parser").val()}, function(e, r) {
      if (e) {
        swal("Error", e.reason || e.message, "error");
        return;
      }
      swal("Success", "Parse code saved.", "info");
    });
  },
  "click .js-load-parser"(e, t) {
    t.$("#parser").val(t.parser);
  },
  "change #html"(e, t) {
    // clear markets preview
    t.markets.set([]);
  },
  "click .js-parse"(e, t) {
    let text = t.$("#html").val();
    let funcText = t.$("#parser").val();
    let func = Function("text", funcText);
    let parseResult = func(text);
    if ($.isArray(parseResult)) {
      // show parsed items for a review
      t.markets.set(parseResult);
      Meteor.setTimeout(function() {
        $("html, body").scrollTop($(".markets-preview").offset().top);
      }, 100);
    } else {
      swal("No market found.", "Please check the parser and html.", "warning");
    }
  },
  "click .js-clear"(e, t) {
    // clear markets preview
    t.markets.set([]);
  },
  "click .market-remove"(e, t) {
    let self = this;
    let removeBtn = t.$(e.currentTarget);
    removeBtn.animateCss("rotateIn");
    // market container:
    let marketItem = removeBtn.closest(".market-item");
    marketItem.animateCss("fadeOut", function() {
      // find the item in market list and remove it
      let markets = t.markets.get();
      markets.every(function(market, idx) {
        if (market.name === self.name) {
          markets.splice(idx, 1);
          return false;
        }
        return true;
      });
      t.markets.set(markets);
      // BLAZE somehow keeps classes of the removed item and apply them to the item taking over its place.
      // Or in another way, BLAZE just trims the DOM, does not remove the item. If we don't remove the
      // animation classes, the new item will be hidden. If we remove the classes, we see the old item
      // re-appears for a moment. So we let the new item be hidden then remove the animation classes in
      // "markets" helper instead.
    });
  },
  "click .js-save-markets"(e, t) {
    var markets = t.markets.get();
    // inject ids to odds for later references
    markets.forEach(function(market, idx) {
      market.odds.forEach(function(odd, idx) {
        odd._id = new Meteor.Collection.ObjectID().valueOf();
        market.odds[idx] = odd;
      });
      markets[idx] = market;
    });

    // validate data
    if (!Schemas.Match.namedContext("saveMarkets").validate({$set: {markets: markets}}, {modifier: true})) {
      console.error("Failed to validate data. Invalid keys:\n", Schemas.Match.namedContext("saveMarkets").validationErrors());
      swal("Error", "Failed to validate data. Please check console for details.", "error");
      return;
    }
    // save markets
    Meteor.call("saveMarkets", {
      matchId: Router.current().params._id,
      markets: markets
    }, function(err, r) {
      if (err) {
        swal("Error", err.reason || err.message, "error");
        return;
      }
      swal({
        title: "Success",
        text: "Markets saved.",
        type: "info",
        showCancelButton: false,
        closeOnConfirm: true,
      }, function() {
        // go back
        history.back();
      });
    });
  },
});
