import React, { Component, PropTypes } from 'react';
import Video from '../components/Video';

export default class VideoList extends Component {
    render() {
        return (
            <div className={this.props.class}>
              {
                this.props.object.map((label, i ,arr) => (
                  <Video
                    key={i}
                    class={
                      arr.length%4==0?'col-md-3 col-xs-12 video-container' 
                      : arr.length - arr.length%4 <= i ? 
                       arr.length - arr.length%4 == i ? 'col-md-3 col-xs-12 video-container'+ ' first last' + arr.length%4
                        :'col-md-3 col-xs-12 video-container'+ ' last' + arr.length%4
                          :'col-md-3 col-xs-12 video-container'
                    }
                    classInside={'video-item'}
                    title={label.title}
                    id={label.id}
                    thumbnail={label.thumbnail}
                    duration={label.duration}
                    views={label.views}
                    captions={label.captions}
                    level={label.level}
                    captions={label.captions}
                  />
                ))
              }
            </div>
        );
    }
}
