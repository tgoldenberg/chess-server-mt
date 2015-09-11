Accounts.onCreateUser(function(options, user) {
  user.profile =  {rating: 1200, gamesPlayed: 0, gamesWon: 0, gamesLost: 0, country: 'United States'};
  return user;
});
