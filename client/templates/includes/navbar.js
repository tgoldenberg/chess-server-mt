Template.navbar.helpers({
  tempUser: function() {
    return Session.get('currentUser') != undefined && Meteor.userId() == null;
  },
  username: function() {
    return Session.get('currentUser');
  }
})
