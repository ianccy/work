import React, { Component, PropTypes } from 'react';

export default class Video extends Component {
  // toggleClick = (event) => {
  //     const { handleToggleClick } = this.props;
  //     handleToggleClick(event.target.value);
  // }
  convert = (value) => {
    const hours = Math.floor(value / 3600);
    const mins = Math.floor((value - (hours * 3600)) / 60);
    const secs = value - (hours * 3600) - (mins * 60);
    const newHours = hours > 0 ? hours > 10 ? hours + ':' : '0' + hours + ':' : '';
    const newMins = mins > 0 ? mins > 10 ? mins + ':' : '0' + mins + ':' : '';
    const newSecs = secs > 0 ? secs > 10 ? secs : '0' + secs : '';
    return newHours + newMins + newSecs;
  }
  convertLang = (label) => {
    switch (label) {
      case 'cht':
        var chinese = '中文';
        break;
      case 'ja':
        var chinese = '日文';
        break;
      case 'vi':
        var chinese = '越南文';
        break;
      case 'en':
        var chinese = '英文';
        break;
      default:
        var chinese = '';
        break;
    }
    return chinese
  }
  convertLev = (label) => {
    switch (label) {
      case 1:
        var chinese = '初級';
        break;
      case 2:
        var chinese = '中級';
        break;
      case 3:
        var chinese = '中高級';
        break;
      case 4:
        var chinese = '高級';
        break;
      default:
        var chinese = '';
        break;
    }
    return chinese
  }
  render() {
    return (
      <div className={this.props.class}>
        <div className={this.props.classInside}>
          <div className="img-container">
            <img className="img-responsive" src={this.props.thumbnail} />
            <span className="video-timer">{this.convert(this.props.duration)}</span>
          </div>
          <div className="info-container">
            <div className="title">
              {this.props.title}
            </div>
            <span className="views-tag">
              <i className="material-icons">headset</i>
              {this.props.views}
            </span>
            <div className="video-tag">
              <ul className="lang-tag">
                {this.props.captions.map((label, i) =>
                  <li key={i}>
                    {this.convertLang(label)}
                  </li>
                )}
              </ul>
              <span className="level-tag">
                {this.convertLev(this.props.level)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}