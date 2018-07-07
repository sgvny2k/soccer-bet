import { Accounts } from 'meteor/accounts-base';

import './main.html';

Accounts.ui.config({
  passwordSignupFields: "USERNAME_AND_EMAIL"
});
