import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const HostInfo = (props) => {
    const hosts = props.event.getAttr(`hosts`);

    return (
        <>
            {hosts && (
                <>
                    - Hosted by {
                        hosts.split(`;`).filter((s) => s.trim() !== ``).map((host, idx) => {
                            return (<span key={`${idx}`}><FontAwesomeIcon icon={faUser} className="ml-1" /> <b className="mr-1">{host}</b></span>)
                        })
                    }
                </>
            )}
        </>
    )
}

export default HostInfo;