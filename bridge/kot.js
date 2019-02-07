'use strict';

const axios = require('axios');
const querystring = require('querystring');

const KOT_VERSION = '1.2.7';
const KOT_CREDENTIAL_CODE = 40; // CLICK: 40
const KOT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest'
};

const invokeClockIn = async (endpoint, userId, password, callback) => {
    try {
        const signInResponse = await axios.post(endpoint, querystring.stringify(generateSignInParams(userId, password)), { headers: KOT_HEADERS });
        if (signInResponse.data.result !== 'OK') {
            callback('KoT logged in failed.\n' + JSON.stringify(signInResponse.data));
        }

        const user_data = signInResponse.data.user_data;
        const clockInResponse = await axios.post(
            endpoint,
            querystring.stringify(
                generateClockInParams(
                    user_data.timerecorder.record_button.filter(b => b.mark === "1")[0].id,
                    user_data.user.user_token,
                    user_data.token.token_b
                )
            ),
            { headers: KOT_HEADERS }
        );
        if (clockInResponse.data.result !== 'OK') {
            callback('KoT clocked in failed.\n' + JSON.stringify(clockInResponse.data))
        }

        callback('Successfully KoT clocked in.');
    } catch (error) {
        callback(error);
    }
}

const invokeClockOut = async (endpoint, userId, password, callback) => {
    try {
        const signInResponse = await axios.post(endpoint, querystring.stringify(generateSignInParams(userId, password)), { headers: KOT_HEADERS });
        if (signInResponse.data.result !== 'OK') {
            callback('KoT logged in failed.\n' + JSON.stringify(signInResponse.data));
        }

        const user_data = signInResponse.data.user_data;
        const clockInResponse = await axios.post(
            endpoint,
            querystring.stringify(
                generateClockInParams(
                    user_data.timerecorder.record_button.filter(b => b.mark === "2")[0].id,
                    user_data.user.user_token,
                    user_data.token.token_b
                )
            ),
            { headers: KOT_HEADERS }
        );
        if (clockInResponse.data.result !== 'OK') {
            callback('KoT clocked out failed.\n' + JSON.stringify(clockInResponse.data))
        }

        callback('Successfully KoT clocked out.');
    } catch (error) {
        callback(error);
    }
}

const generateSignInParams = (userId, password) => {
    return {
        page_id: 'account_verify',
        account: userId,
        password: password,
        version: KOT_VERSION,
        d_param: new Date().getTime(),
    };
}

const generateClockInParams = (button_id, user_token, token_b) => {
    return {
        id: button_id,
        highAccuracyFlg: false,
        credential_code: KOT_CREDENTIAL_CODE,
        user_token: user_token,
        unique_timestamp: generateUniqueTimestamp(),
        version: KOT_VERSION,
        token: token_b,
        d_param: new Date().getTime(),
    };
}

const generateUniqueTimestamp = () => {
    const now = new Date();
    return [
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
        ]
        .map(d => d.toString().padStart(2, '0'))
        .join('');
 };

exports.clockIn = invokeClockIn;
exports.clockOut = invokeClockOut;