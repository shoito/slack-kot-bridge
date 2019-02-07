'use strict';

const axios = require('axios');
const kot = require('./kot.js');

const KOT_RECORDER_GATEWAY_URL = process.env.KOT_RECORDER_GATEWAY_URL;
const KOT_USER_ID = process.env.KOT_USER_ID;
const KOT_USER_PASSWORD = process.env.KOT_USER_PASSWORD;
const KOT_CLOCK_IN_TEXT = process.env.KOT_CLOCK_IN_TEXT;
const KOT_CLOCK_OUT_TEXT = process.env.KOT_CLOCK_OUT_TEXT;
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_USER_ID = process.env.SLACK_USER_ID;
const SLACK_WATCHING_CHANNEL_ID = process.env.SLACK_WATCHING_CHANNEL_ID;

function verify(body, callback) {
    if (body.token === SLACK_VERIFICATION_TOKEN) {
        respond(200, body.challenge, callback);
    } else {
        respond(403, 'verification failed', callback);
    }
}

function handleEvent(event, callback) {
    if (event.bot_id) {
        respond(200, null, callback);
    }

    if (isClockInMessage(event)) {
        console.log('Clock in event is fired.');
        kot.clockIn(KOT_RECORDER_GATEWAY_URL, KOT_USER_ID, KOT_USER_PASSWORD, (result) => {
            console.log(result);
        });
    } else if (isClockOutMessage(event)) {
        console.log('Clock out event is fired.');
        kot.clockOut(KOT_RECORDER_GATEWAY_URL, KOT_USER_ID, KOT_USER_PASSWORD, (result) => {
            console.log(result);
        });
    }

    respond(200, null, callback);
}

function isClockInMessage(event) {
    return (event.type === 'message'
        && event.user === SLACK_USER_ID
        && event.channel === SLACK_WATCHING_CHANNEL_ID
        && event.text.search(KOT_CLOCK_IN_TEXT) !== -1);
}

function isClockOutMessage(event) {
    return (event.type === 'message'
        && event.user === SLACK_USER_ID
        && event.channel === SLACK_WATCHING_CHANNEL_ID
        && event.text.search(KOT_CLOCK_OUT_TEXT) !== -1);
}

function respond(code, body, callback) {
    const response = {
        statusCode: code,
        body: JSON.stringify(body)
    };

    callback(null, response);
}

exports.handler = (data, context, callback) => {
    const headers = data.headers;
    if (headers['X-Slack-Retry-Num'] && headers['X-Slack-Retry-Num'] > 0) {
        respond(200, '', callback);
    }

    const body = JSON.parse(data.body);
    switch (body.type) {
        case 'url_verification':
            verify(body, callback);
            break;
        case 'event_callback':
            handleEvent(body.event, callback);
            break;
        default:
            respond(200, '', callback);
    }
};