import React, { Component, PropTypes } from 'react';

export default class FilterButton extends Component {
    toggleClick = (event) => {
        const { handleToggleFilter } = this.props;
        handleToggleFilter(this.props.type,this.props.dur);
    }
    render() {
        return (
            <li className={this.props.class} onClick={this.toggleClick}>
                {this.props.name}
            </li>
        );
    }
}