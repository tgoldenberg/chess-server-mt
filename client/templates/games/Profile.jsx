Profile = ReactMeteor.createClass({
  render: function() {
    return (
    <div className="profile">
      <div className="profile-header">
        <span className="glyphicon glyphicon-user"></span>
        <p>{this.props.name}</p>
      </div>
      <div className="profile-content">
        <p>Rating: {this.props.rating}</p>
        <p>Games Played: {this.props.gamesPlayed}</p>
        <p>Country: {this.props.country}</p>
      </div>
    </div>
    )
  }
})
