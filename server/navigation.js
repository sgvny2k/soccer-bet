import { Meteor } from 'meteor/meteor';

/**
 * menus for different roles
 */
let defaultItems = [
  {divider: true},
  {link: true, text: "Account", route: "account"}
];

let menuItems = {
  // just registered but has not been approved
  registered: [
    {link: true, text: "Home", route: "home"},
    {link: true, text: "Account", route: "account"}
  ],
  normal: [
    {link: true, text: "Home", route: "home"},
    {link: true, text: "Sponsors", route: "sponsors"},
    {link: true, text: "Games", route: "player.matches"},
    {link: true, text: "Slips", route: "player.slips"},
    {link: true, text: "History", route: "history"},
    {divider: true, text: "Ranking", group: true},
    {link: true, text: "One Game", route: "ranking.matches"},
    {link: true, text: "One Day", route: "ranking.day", params: {date: "today"}},
    {link: true, text: "Overall", route: "ranking.overall"},
  ],
};

menuItems["operator"] = menuItems.normal.concat([
  {divider: true, text: "Operator"},
  {link: true, text: "Manage Games", route: "matches.manage"},
  {link: true, text: "Update result", route: "result.update"},
]);

menuItems["operator"] = menuItems["operator"].concat(defaultItems);

menuItems["administrator"] = menuItems.normal.concat([
    {divider: true, text: "Administrator"},
    {link: true, text: "Manage Users", route: "users"},
    {link: true, text: "Manage Games", route: "matches.manage"},
    {link: true, text: "Update result", route: "result.update"},
]);
menuItems["administrator"] = menuItems["administrator"].concat(defaultItems);

menuItems["normal"] = menuItems["normal"].concat(defaultItems);

Object.keys(menuItems).forEach(name => menuItems[name].unshift({divider: true, img: "/images/logo.png", text: ""}));

let rolesOrder = {
  "administrator": 0,
  "operator": 1,
  "normal": 2,
  "registered": 3
}

let menuFromRoles = (roles) => {
  if (roles) {
    roles.sort((a, b) => {
      return rolesOrder[a] - rolesOrder[b];
    });
  }
  let role = (roles && roles[0]) || "registered";
  return {menu: menuItems[role]};
}

Meteor.publish("menuitems", function() {
  if (!this.userId) return;
  let userCursor = Meteor.users.find(this.userId);
  let self = this;
  let userObserver = userCursor.observeChanges({
    added(id, doc) {
      self.added("menu", id, menuFromRoles(doc.roles));
    },
    changed(id, fields) {
      if (fields.roles) {
        self.changed("menu", id, menuFromRoles(fields.roles));
      }
    }
  });
  self.ready();
  self.onStop(() => {
    userObserver.stop();
  });
})
