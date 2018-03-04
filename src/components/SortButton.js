import React, { Component, PropTypes } from 'react';

export default class SortButton extends Component {
    toggleSort = (event) => {
        const { handleToggleSort } = this.props;
        handleToggleSort(this.props.value);
    }
    render() {
        return (
            <li className={this.props.class} onClick={this.toggleSort}>
                {this.props.name}
            </li>
        );
    }
}