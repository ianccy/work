import React, { Component } from 'react'
import SortButton from './SortButton';
import FilterButton from './FilterButton';

export default class Controllbar extends Component {
  handleToggleSort = (value) => {
    const { handleToggleSort } = this.props;
    handleToggleSort(value);
  }
  handleToggleFilter = (type, dur) => {
    const { handleToggleFilter } = this.props;
    handleToggleFilter(type, dur);
  }
  render() {
    return (
      <div className={this.props.class}>
        <ul className="list-inline">
          <span className="hint">排序</span>
{
            this.props.sortList.map((label, i) => (
              <SortButton
                key={i}
                class={
                  this.props.sortActive == label.type ? 'tag active':'tag'
                }
                
                name={label.name}
                value={label.type}
                handleToggleSort={this.handleToggleSort}
              />
            ))
          }
        </ul>
        <ul className="list-inline">
          <span className="hint">長度</span>
{
            this.props.filterList.map((label, i) => (
              <FilterButton
                key={i}
                class={
                  this.props.filterActive == label.type ? 'tag active':'tag'
                }
                name={label.name}
                type={label.type}
                dur={label.dur}
                handleToggleFilter={this.handleToggleFilter}
              />
            ))
          }
        </ul>
      </div>
    )
  }
}