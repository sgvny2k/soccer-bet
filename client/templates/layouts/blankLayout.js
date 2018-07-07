Template.blankLayout.onRendered(function () {
  $("body").addClass("blank");
  $("body").removeClass("show-sidebar");
});

Template.blankLayout.onDestroyed(function () {
  $("body").removeClass("blank");
});
