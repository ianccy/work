import React, { Component } from 'react';
import VideoList from '../components/VideoList';
import Controllbar from '../components/Controllbar';
//import axios from 'axios';
//if run on dev server use this data
import json from '../data';
import "babel-polyfill";


class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelect: [],
      object: [],
      initialObject: [],
      sortList: [...this.props.sort],
      sortActive: [],
      filterList: [...this.props.filter],
      filterActive: [],
    };
  }
  componentWillMount = () => {

  }
  componentDidMount = () => {
    this.getObjectList(this.props.url);
  }
  componentWillUnmount() {
  }

  getObjectList = (url) => {
    // 撈自己建立的json data
    const data = json.data.sort((a,b)=>{
      return b.publish - a.publish
    });
    this.setState({
      object: [...data],
      initialObject: [...json.data],
    });

    // axios.get(url,{
    //   crossdomain: true 
    // })
    //   .then((response) => {
    //     if(response.status){
    //       const data = response.data.sort((a,b)=>{
    //         return b.publish - a.publish
    //       });
    //       this.setState({
    //         object: [...data],
    //         initialObject: [...json.data],
    //       });
    //     }
    //   })
    //   .catch(function (error) {
    //     console.log(error)
    //   });
  }
  handleSort = (value) => {
    this.setState({
      sortActive: value
    });
    switch (value) {
      case 'publish':
        var sortArr = this.state.object.sort((a,b)=>{
          return b.publish - a.publish
        });
        this.setState({
          object:sortArr
        });
        break;
      case 'views':
        var sortArr = this.state.object.sort((a,b)=>{
          return b.views - a.views
        });
        this.setState({
          object:sortArr
        }); 
        break;
      case 'collectCount':
        var sortArr = this.state.object.sort((a,b)=>{
          return b.collectCount - a.collectCount
        });
        this.setState({
          object:sortArr
        }); 
        break;
      default:
        break;
    }
  }
  handleFilter = (type, dur) => {
    this.setState({
      filterActive: type
    });

    switch (type) {
      case 'range':
        var durRange = dur.split('-');
        var filtArr = this.state.initialObject.filter(label=>{
          return label.duration >= durRange[0] && label.duration <= durRange[1]  
        });
        this.setState({
          object:filtArr
        });
        break;
      case 'up':
        var filtArr = this.state.initialObject.filter(label=>{
          return label.duration >= dur  
        });
        this.setState({
          object:filtArr
        }); 
        break;
      case 'down':
        var filtArr = this.state.initialObject.filter(label=>{
          return label.duration <= dur  
        });
        this.setState({
          object:filtArr
        }); 
        break;
      default:
        //rest check sort first
        switch (this.state.sortActive) {
          case 'publish':
            var sortArr = this.state.initialObject.sort((a,b)=>{
              return b.publish - a.publish
            });
            break;
          case 'views':
            var sortArr = this.state.initialObject.sort((a,b)=>{
              return b.views - a.views
            });
            break;
          case 'collectCount':
            var sortArr = this.state.initialObject.sort((a,b)=>{
              return b.collectCount - a.collectCount
            });
            break;
          default:
            var sortArr = this.state.initialObject.sort((a,b)=>{
              return b.publish - a.publish
            });
            break;
        }
        this.setState({
          object:sortArr
        });
        break;
    }

    console.log(type);
    console.log(dur);
  }
  render() {
    return (
      <div>
        <div className="container">
          <h1>VoiceTube</h1>
          <Controllbar
            class={"control-container row"}
            handleToggleSort={this.handleSort}
            sortList={this.state.sortList}
            sortActive={this.state.sortActive == '' ? "publish" : this.state.sortActive}
            handleToggleFilter={this.handleFilter}
            filterList={this.state.filterList}
            filterActive={this.state.filterActive == '' ? "" : this.state.filterActive}
          />
          <VideoList
            class={"object-container row"}
            object={this.state.object}
          />
        </div>
      </div>
    );
  }
}

export default Application;