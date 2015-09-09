Template.navbar.helpers({
  tempUser: function() {
    return Session.get('currentUser') != undefined;
  },
  username: function() {
    return Session.get('currentUser');
  }
})
