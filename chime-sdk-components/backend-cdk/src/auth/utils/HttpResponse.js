`use strict`;

module.exports = class {
    __code;
    __headers = {
        "Access-Control-Allow-Origin": `*`,
        "Access-Control-Allow-Headers": `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`,
        "Content-Type": `application/json`
    };
    
    constructor(code = 200) {
        this.__code = code;
    }

    send = (body={},headers={}) => {
        const bodyString = JSON.stringify(body);
    
        if (this.__code != 200) {
            console.log(`response payload (${this.__code}): ${bodyString}`);
        }
        return Object.freeze({ 
            statusCode: this.__code,
            headers: Object.assign(this.__headers, headers), 
            body: bodyString
        })
    };
};
