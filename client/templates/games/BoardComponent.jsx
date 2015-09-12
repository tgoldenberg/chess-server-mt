BoardComponent = ReactMeteor.createClass({
  render: function() {
    return (
      <div className="board-holder">
        <div id="board"></div>
        <div className="button-holder">
          <div className="button">
            <button>Draw</button>
          </div>
          <div className="button">
            <button>Resign</button>
          </div>
          <div className="button">
            <button>Undo Move</button>
          </div>
        </div>
      </div>
    )
  }
})
