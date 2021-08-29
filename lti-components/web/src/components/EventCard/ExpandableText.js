import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

class ExpandableText extends Component {
    constructor(props) {
        super(props);

        this.state = {
            expandable: (props.text||``).length >= props.chars + 50,
            expanded: props.expanded || false
        }
        this.toggleExpansion = this.toggleExpansion.bind(this);
    }

    toggleExpansion() {
        this.setState((state) => ({ 
            ...state, 
            expanded: !state.expanded
        }));
    }

    render() {
        const text = this.state.expanded ? this.props.text : (this.props.text||``).substring(0, this.props.chars||100);

        return (
            <span>
                {text}{!this.state.expanded&&this.state.expandable&&(`... `)}
                {this.state.expandable&&(
                    <Button variant="link" onClick={this.toggleExpansion}>{this.state.expanded?`less`:`read more`}</Button>
                )}
            </span>
        )
    }
}

export default ExpandableText;