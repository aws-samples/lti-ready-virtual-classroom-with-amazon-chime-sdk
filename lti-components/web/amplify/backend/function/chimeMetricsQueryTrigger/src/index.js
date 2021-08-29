const AWS = require(`aws-sdk`);
const Athena = new AWS.Athena();
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });

exports.handler = async (event) => {
    console.log(JSON.stringify(event, null, 2));
    const sqsTargetUrl = process.env.QUERY_JOBS_QUEUE_URL;
    const sqsSourceUrl = process.env.TRIGGER_QUEUE_URL

    // get Athena query 
    return Athena.getNamedQuery({ NamedQueryId: process.env.QUERY_AGGREGATE_EVENTS }).promise().then((getNamedQueryResponse) => {
        const externalEventIds = (event.Records || []).map((record) => JSON.parse(record.body));
        console.info(`Received Athena query to be triggered using event filter values: ${externalEventIds.join(`, `)}`);

        const whereInFilter = externalEventIds.map((externalEventId) => `'${externalEventId}'`).join(`,`);
        const whereClause = whereInFilter ? ` WHERE externalmeetingid IN (${whereInFilter})` : ``;
        const queryString = `${getNamedQueryResponse.NamedQuery.QueryString}${whereClause}`;
        console.info(`Query: ${queryString}`);

        const startQueryRequestParams = {
            QueryString: queryString,
            QueryExecutionContext: {
                Database: getNamedQueryResponse.NamedQuery.Database
            },
            WorkGroup: getNamedQueryResponse.NamedQuery.WorkGroup
        };
        return Athena.startQueryExecution(startQueryRequestParams).promise().then((startQueryResponse) => {
            console.info(`Query execution started ...`);

            const sendMessageRequestParams = {
                MessageBody: JSON.stringify({ id: startQueryResponse.QueryExecutionId }),
                QueueUrl: sqsTargetUrl
            };

            return SQS.sendMessage(sendMessageRequestParams).promise().then(() => {
                console.info(`Query result processing delegated by writing trigger message to SQS.`);
            });
        });
    }).then(() => {
        // delete all SQS messages in batches of 10
        return Promise.all(arraySlice(event.Records, 10).map((recordChunk, chunkIndex) => {
            // delete SQS message once job of writing Athena query results to DynamoDB is done

            const deleteMessageBatchRequest = {
                QueueUrl: sqsSourceUrl,
                Entries: recordChunk.map((record, recordIndex) => {
                    return {
                        Id: `${chunkIndex}-${recordIndex}`,
                        ReceiptHandle: record.receiptHandle 
                    }
                })
            };
            return SQS.deleteMessageBatch(deleteMessageBatchRequest).promise().then(() => {
                console.info(`SQS message batch ${chunkIndex} deleted (${deleteMessageBatchRequest.Entries.length} entries)`);
            });
        }));
    });
};

const arraySlice = (array = [], chunkSize) => {
    var temporal = [];
    
    for (var i = 0; i < array.length; i+= chunkSize){
        temporal.push(array.slice(i,i+chunkSize));
    }

    return temporal;
};
