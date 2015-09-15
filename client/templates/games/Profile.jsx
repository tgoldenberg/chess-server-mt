Profile = ReactMeteor.createClass({
  render: function() {
    var user = this.props.user;
    return (
    <div className="profile">
      <div className="profile-header">
        <span className="glyphicon glyphicon-user"></span>
        <p>{user.name}</p>
      </div>
      <div className="profile-content">
        <p>Rating: {user.rating}</p>
        <p>Games Played: {user.gamesPlayed}</p>
        <p>Country: {user.country} </p>
      </div>
    </div>
    )
  }
})
