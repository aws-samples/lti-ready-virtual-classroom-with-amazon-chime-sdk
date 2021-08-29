import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { Badge } from 'react-bootstrap';

const EventDateInfo = (props) => {
    const date = props.event.moment;
    
    const badgeContent = {
        text: ``,
        style: `secondary`
    }

    if (moment().isSame(date, `day`)) {
        badgeContent.text = date.format(`[TODAY], MMM Do`).toUpperCase();
        badgeContent.style = `primary`;
    } else if (moment().add(1, `day`).isSame(date, `day`)) {
        badgeContent.text = date.format(`[TOMORROW], MMM Do`).toUpperCase();
    } else if (moment().subtract(1, `day`).isSame(date, `day`)) {
        badgeContent.text = date.format(`[YESTERDAY], MMM Do`).toUpperCase();
    } else {
        badgeContent.text = date.format(`dddd, MMM Do`).toUpperCase();
    }

    return (
        <Badge variant={badgeContent.style}>
            <FontAwesomeIcon icon={faCalendarAlt} /> {badgeContent.text}
        </Badge>
    )
}

export default EventDateInfo;