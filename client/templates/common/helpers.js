import { moment } from "meteor/momentjs:moment";
import { Template } from "meteor/templating";
import { Collections } from "/lib/declarations";

// extend jquery with animation.css, code from https://github.com/daneden/animate.css
$.fn.extend({
  animateCss(animationName, cb) {
    let animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    $(this).addClass('animated ' + animationName).one(animationEnd, function() {
      // Chrome has both webkitAnimationEnd and animationend so mark the item with new class to reduce one call
      if (cb) {
        if (!$(this).hasClass("processed")) {
          $(this).addClass("processed");
          cb.apply(this);
        }
      } else {
        $(this).removeClass('animated ' + animationName);
      }
    });
    // because of animation removal for small screens
    // the above event may not occur. Call the callback anyway.
    let animation = $(this).css("-webkit-animation") || $(this).css("-moz-animation")
      || $(this).css("-o-animation") || $(this).css("-ms-animation") || $(this).css("animation");
    if (cb && animation && animation.match("none")) {
      cb.apply(this);
    }
  }
});

Template.registerHelper("formatDateTime", function(dateObj) {
  return moment(dateObj).format("DD/MM/YYYY HH:mm");
});

Template.registerHelper("formatDate", function(dateObj) {
  return moment(dateObj).format("DD/MM/YYYY");
});

Template.registerHelper("toDate", function(dateString) {
	return moment(dateString, "DD/MM/YYYY HH:mm").toDate();
  });

Template.registerHelper("formatFloat", function(value) {
  if (!value) return 0;
  if (Math.round(value) === value) {
    return value;
  }
  return value.toFixed(2);
});

export let URLFormatter = {
  format(options) {
    let data = {};

    // copy values in search params
    let search = [];
    if (location.search.length > 0) {
      search = location.search.split("&");
    }
    search.forEach(function(item, idx) {
      if (item.startsWith("?")) item = item.substr(1);
      let key_val = item.split("=");
      data[key_val[0]] = key_val[1];
    });

    // overwrite the data with values from options
    $.extend(data, options);
    let fmA = [];
    Object.keys(data).forEach(function(key) {
      fmA.push(key + "=" + data[key]);
    });
    return "?" + fmA.join("&");
  },

  get(name) {
    let search = [];
    if (location.search.length > 0) {
      search = location.search.split("&");
    }

    if (name !== undefined) {
      let val;
      search.every(item => {
        if (item.startsWith("?")) item = item.substr(1);
        let key_val = item.split("=");
        if (name === key_val[0]) {
          val = key_val[1];
          return false;
        }
        return true;
      }, this);

      return val;
    }

    // name is undefined
    let queries = {};
    search.forEach(item => {
      if (item.startsWith("?")) item = item.substr(1);
      let key_val = item.split("=");
      queries[key_val[0]] = key_val[1];
    });
    return queries;
  },
};

export let TablePageHelper = function(selector, path, callbacks) {
  this.selector = selector
  this.dataTable = $(selector).DataTable();
  this.path = path;
  this.callbacks = callbacks;
  this._state = 0;

  this.onPage = function() {
    let cb = this.callbacks && this.callbacks.onPage;
    let info = this.dataTable.page.info();
    if (info.pages === 0) {
      if (cb instanceof Function) {
        cb(null);
      }
      return;
    }
    history.pushState(history.state, "", this.path + URLFormatter.format({"pg": info.page}));
    if (cb instanceof Function) {
      cb(null);
    }
  };

  this.onInit = function() {
    this._state = 1;
    let p = URLFormatter.get("pg");
    if (p !== undefined) {
      this._setPage(parseInt(p), this.callbacks && this.callbacks.onInit);
    }
  };

  this.onDraw = function() {
    let cb = this.callbacks && this.callbacks.onDraw;
    if (this._state !== 1) return;

    this._state = 2;
    if (cb instanceof Function) {
      cb(null);
    }
  };

  /**
   * Try to set page. If fails, try another one at a timeout
   */
  this._setPage = function(page, cb) {
    if (!this.dataTable) {
      if (cb instanceof Function) {
        cb(new Error("Undefined data table"));
      }
      return;
    }
    // wait for DataTable to finish its draw after it initialized
    if (this._state !== 2) {
      // DataTable is not ready. Wait then.
      setTimeout(this._setPage.bind(this), 50, page, cb);
      return;
    }

    let info = this.dataTable.page.info();
    if (page !== info.page && page < info.pages) {
      // go to page
      this.dataTable.page(page);
      // check if the page is actually set
      info = this.dataTable.page.info();
      if (info.page !== page) {
        setTimeout(this._setPage.bind(this), 50, page, cb);
      } else {
        // render new page
        this.dataTable.draw("page");
        if (cb instanceof Function) {
          cb(null);
        }
      }
    }
  };

  // register event handlers
  $(this.selector).on("init.dt", this.onInit.bind(this));
  $(this.selector).on("draw.dt", this.onDraw.bind(this));
  $(this.selector).on("page.dt", this.onPage.bind(this));

  this.onInit();

  return this.dataTable;
};

export let scrollToPos = function(pos, numTry) {
  if (!numTry) numTry = 0;
  if (numTry === 10 || $(window).scrollTop() === pos) return;
  $(window).scrollTop(pos);
  Meteor.setTimeout(scrollToPos.bind(this, pos, numTry + 1), 50);
}

export let initTimeFilter = function(startOffset, endOffset) {
  let timeFilter = Router.current().getParams().query;
  // set a default today[startOffset, endOffset] range of time
  if (!timeFilter.startDate || !timeFilter.endDate) {
    if (!timeFilter.startDate) timeFilter.startDate = moment().add(startOffset, "days").format("YYYY-MM-DD");
    if (!timeFilter.endDate) timeFilter.endDate = moment().add(endOffset, "days").format("YYYY-MM-DD");
    // replace the current bare URL with startDate and endDate in query
    Router.go(Router.current().route.getName(), Router.current().getParams(), {replaceState: true, query: timeFilter});
    return;
  }
  return timeFilter;
}
