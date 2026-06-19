import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './Login.html';

Template.login.events({
  'submit .login-form'(e) {
    e.preventDefault();

    const target = e.target;
    const username = target.username.value;
    const password = target.password.value;

    // Built-in Meteor client login sequence
    Meteor.loginWithPassword(username, password, (error) => {
      if (error) {
        alert("Authentication failed: " + error.reason);
      }
    });
  }
});
