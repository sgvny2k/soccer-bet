Template.header.events({
  "click .toggleMenu"(e, t) {
    // toggle menu
    t.$(".toggleMenu").toggleClass("active");
    if ($(window).width() < 769) {
      $("body").toggleClass("show-sidebar");
    } else {
      $("body").toggleClass("hide-sidebar");
    }
  },
});
