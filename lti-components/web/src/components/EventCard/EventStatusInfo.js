import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faEyeSlash, faPlay } from '@fortawesome/free-solid-svg-icons';
import ScheduledEvent from '../../utils/ScheduledEvent';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

const EventStatusInfo = (props) => {
    let statusConfig = {};

    switch (props.event.status) {
        case ScheduledEvent.STATUS.CANCELLED: statusConfig = {
                text: `Cancelled`,
                style: `danger`,
                hint: `This event has been cancelled.`,
                icon: faBan
            }; break;
        case ScheduledEvent.STATUS.OPEN: statusConfig = {
                text: `Open`,
                hint: `This event is now open to join.`,
                icon: faPlay
            }; break;
        case ScheduledEvent.STATUS.CLOSED: statusConfig = {
                text: `Closed`,
                hint: `This event has been closed.`,
            }; break;
        case ScheduledEvent.STATUS.HIDDEN: statusConfig = {
                text: `Hidden`,
                hint: `This event is hidden from users.`,
                style: `warning`,
                icon: faEyeSlash
            }; break;
        case ScheduledEvent.STATUS.SCHEDULED:
        default: statusConfig = {
            text: ``,
            style: `secondary`
        }; break;
    };

    return statusConfig.text && (
        <>
            <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Meeting {statusConfig.text}</Tooltip>}>
                <span className="d-inline-block">
                    <Badge className="mr-2" variant={statusConfig.style}>
                        {statusConfig.icon && (<FontAwesomeIcon icon={statusConfig.icon} />)} {!props.iconOnly ? statusConfig.text : ``}
                    </Badge>
                </span>
            </OverlayTrigger> {props.iconOnly || props.event.getAttr(`meeting`).statusReason}
        </>
    )
}

export default EventStatusInfo;