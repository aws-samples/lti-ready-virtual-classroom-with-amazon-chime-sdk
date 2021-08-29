import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Badge } from 'react-bootstrap';
import ScheduledEvent from '../../utils/ScheduledEvent';

const TimeInfo = (props) => {
    const timeFormat = `${props.format24h}` === `true` ? `HH:mm` : `h:mm a`;

    const startTime = props.event.moment.format(timeFormat);
    const endTime = props.event.momentEnd.format(timeFormat);
    const durationTotalMinutes = props.event.momentEnd.diff(props.event.moment, `minutes`);
    const durationHours = props.event.momentEnd.diff(props.event.moment, `hours`);
    const durationMinutes = durationTotalMinutes - (durationHours*60);
    const durationHourString = durationHours > 1 ? `${durationHours} hours` : (durationHours > 0 ? `${durationHours} hour` : ``);
    const durationMinuteString = durationMinutes > 1 ? `${durationMinutes} mins` : (durationMinutes > 0 ? `${durationMinutes} min` : ``);
    const durationString = `( ${[ durationHourString, durationMinuteString ].filter(Boolean).join(`, `)} )`;

    return (
        <>
            {
                props.event.status === ScheduledEvent.STATUS.SCHEDULED && (
                    <>- Scheduled <FontAwesomeIcon icon={faClock} /> <b>{startTime}</b> to <FontAwesomeIcon icon={faClock} /> <b>{endTime}</b> {durationString}</>
                )
            }
            {
                props.event.status === ScheduledEvent.STATUS.CANCELLED && (
                    <>- Scheduled <FontAwesomeIcon icon={faClock} /> <b>{startTime}</b> to <FontAwesomeIcon icon={faClock} /> <b>{endTime}</b> <Badge className="ml-2" variant="danger"><FontAwesomeIcon icon={faTimes} /> Cancelled</Badge></>
                )
            }
            {
                props.event.status === ScheduledEvent.STATUS.OPEN && (
                    <>- Runs from <FontAwesomeIcon icon={faClock} /> <b>{startTime}</b> to <FontAwesomeIcon icon={faClock} /> <b>{endTime}</b> {durationString}</>
                )
            }
            {
                props.event.status === ScheduledEvent.STATUS.CLOSED && (
                    <>- Ran from <FontAwesomeIcon icon={faClock} /> <b>{startTime}</b> to <FontAwesomeIcon icon={faClock} /> <b>{endTime}</b> {durationString}</>
                )
            }
            {
                props.event.status === ScheduledEvent.STATUS.HIDDEN && (
                    <>- Scheduled <FontAwesomeIcon icon={faClock} /> <b>{startTime}</b> to <FontAwesomeIcon icon={faClock} /> <b>{endTime}</b> {durationString}</>
                )
            }
        </>
    )
}

export default TimeInfo;