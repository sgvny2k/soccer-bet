Template.mainLayout.onRendered(function(){

  // Add special class to minimalize page elements when screen is less than 768px
  setBodySmall();
  setTimeout(function () {
    fixWrapperHeight();
  }, 300);

  $(window).bind("resize click", function () {

    // Add special class to minimalize page elements when screen is less than 768px
    setBodySmall();

    // Wait until metisMenu, collapse effect finish and set wrapper height
    setTimeout(function () {
      fixWrapperHeight();
    }, 300);
  });

  let self = this;
  $(window).bind("scroll", function() {
    if (!self.scrollTimer) {
      self.scrollTimer = Meteor.setTimeout(() => {
        let docHeight = $(document).height();
        let windowHeight = $(window).height();
        let scrollTop = $(window).scrollTop();
        if (windowHeight < docHeight && scrollTop > docHeight * 0.2) {
          $(".scrollup-btn").show();
        } else {
          $(".scrollup-btn").hide();
        }
        delete self.scrollTimer;
      }, 500);
    }
  });
});

function fixWrapperHeight() {

  // Get and set current height
  let headerH = $("#navbar").outerHeight();
  $("#side-menu").css({height: "initial", "min-height": "initial"});
  let navigationH = $("#side-menu").outerHeight();
  let contentH = $(".content").outerHeight() + headerH + 20 /* header + margin-bottom */;
  let colorLineH = $(".color-line").outerHeight();
  let wrapperH = contentH;

  // compare with menu
  if (wrapperH < navigationH) {
    wrapperH = navigationH;
  }

  // compare with window
  if (wrapperH < $(window).height() - colorLineH) {
    wrapperH = $(window).height() - colorLineH;
  }

  // set it
  $("#wrapper").css("min-height", wrapperH + 'px');
  $("#wrapper").height(wrapperH);
  $("#side-menu").css("min-height", wrapperH + 'px');
  $("#side-menu").height(wrapperH);
}

function setBodySmall() {
  if ($(window).width() < 769) {
    $('body').addClass('page-small');
    if ($('body').hasClass('show-sidebar')) {
      $(".toggleMenu").addClass("active");
    } else {
      $(".toggleMenu").removeClass("active");
    }
  } else {
    $('body').removeClass('page-small');
    $('body').removeClass('show-sidebar');
    if (!$('body').hasClass('hide-sidebar')) {
      $(".toggleMenu").addClass("active");
    }
  }
}

Template.mainLayout.events({
  "click #overlay-panel"(e, t) {
    $("body").removeClass("show-sidebar");
  },
  "click .back-btn"(e, t) {
    history.back();
  },
  "click .scrollup-btn"(e, t) {
    $(window).scrollTop(0);
    t.$(".scrollup-btn").hide();
  },
});
