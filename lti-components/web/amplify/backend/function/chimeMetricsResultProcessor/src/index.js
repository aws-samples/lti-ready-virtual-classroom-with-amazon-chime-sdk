const AWS = require(`aws-sdk`);
const Athena = new AWS.Athena();
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
const DDB = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

exports.handler = async (event) => {
    const metricsTableName = process.env.METRICS_TABLE;
    const jobQueueUrl = process.env.QUERY_JOBS_QUEUE_URL;

    return Promise.all(event.Records.map((record, recordIndex) => {
        console.info(`Job (${recordIndex}) started.`);

        const resultSets = {
            /* externalMeetingId: { 
                eventId: ``, 
                eventGroupId: ``, 
                events: { 
                    event: [ 
                        { properties } 
                    ] 
                } 
            } */
        };

        return Athena.getQueryResults({ QueryExecutionId: JSON.parse(record.body).id }).promise().then((getQueryResultResponse) => {

            console.info(`Query result (${recordIndex}) received: ${getQueryResultResponse.ResultSet.Rows.length - 1} rows to process`);

            const columns = {};
            // create map of column names to indicies from header row
            getQueryResultResponse.ResultSet.Rows[0].Data.forEach((dataSet, index) => columns[dataSet.VarCharValue] = index);

            const getColumnValue = (dataSet, columnName) => {
                return (dataSet.Data[columns[columnName]] || {}).VarCharValue || ``;
            }

            const getColumnValues = (dataSet, ...columnNames) => {
                return columnNames.map((columnName) => getColumnValue(dataSet, columnName));
            }

            // go through the result table body by excluding the first header row
            getQueryResultResponse.ResultSet.Rows.slice(1).forEach((dataSet) => {
                const [externalMeetingId, event, eventId, eventGroupId] = getColumnValues(dataSet, `externalmeetingid`, `event`, `eventid`, `eventgroupid`);

                // group by external meeting id
                if (!resultSets[externalMeetingId]) {
                    const [
                        detail,
                        eventGroupExternalId,
                        hostinfo,
                        hostUserId,
                        hostUserName,
                        title,
                        scheduledAt,
                        scheduledDuration
                    ] = getColumnValues(dataSet, `detail`, `eventgroupexternalid`, `hostinfo`, `hostuserid`, `hostusername`, `title`, `scheduledat`, `scheduledduration`);
                    // set properties
                    resultSets[externalMeetingId] = {
                        eventId,
                        eventGroupId,
                        detail,
                        eventGroupExternalId,
                        hostinfo,
                        hostUserId,
                        hostUserName,
                        title,
                        scheduledAt,
                        scheduledDuration,
                        events: {}
                    };
                }
                // then group by event type
                if (!resultSets[externalMeetingId].events[event]) resultSets[externalMeetingId].events[event] = [];

                // select columns to include in event result body
                const [
                    maxDuration,
                    minDuration,
                    totalCount,
                    totalDuration,
                    totalUsers,
                    firstStart
                ] = getColumnValues(dataSet, `maxDuration`, `minDuration`, `totalCount`, `totalDuration`, `totalUsers`, `firstStart`);

                // include in result body
                resultSets[externalMeetingId].events[event].push({
                    maxDuration,
                    minDuration,
                    totalCount,
                    totalDuration,
                    totalUsers,
                    firstStart
                });
            });
        }).then(() => {
            console.info(`Query result (${recordIndex}) processed: aggegrated down to ${Object.keys(resultSets).length} rows to store in DynamoDB`);

            return Promise.all(Object.values(resultSets).map((resultSet) => {
                const putItemMessage = {
                    TableName: metricsTableName,
                    Item: AWS.DynamoDB.Converter.marshall(resultSet)
                };

                return DDB.putItem(putItemMessage).promise().catch((err) => {
                    console.warn(`Could not write metrics to Dynamo: ${JSON.stringify(resultSet)}. (Reason: ${err.message})`);
                });
            })).then(() => {
                console.info(`Query result (${recordIndex}) stored in DynamoDB.`);
            }).then(() => {
                // delete SQS message once job of writing Athena query results to DynamoDB is done
                const deleteMessageRequest = {
                    QueueUrl: jobQueueUrl,
                    ReceiptHandle: record.receiptHandle
                };
                return SQS.deleteMessage(deleteMessageRequest).promise().then(() => {
                    console.info(`Job (${recordIndex}) finished.`);
                });
            });
        });
    }));
};
