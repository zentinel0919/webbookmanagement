const Twilio = require('twilio');

const accountSid = 'AC619109b904cecd222543344386a6613c';
const authToken = 'e7806cb171c97dbadb1e19be3c3c6f50';
const client = new Twilio(accountSid, authToken);

function sendSMS(to, message) {
    client.messages.create({
        body: message,
        from: 'YOUR_TWILIO_PHONE_NUMBER',
        to: to
    })
    .then(message => console.log(`Message sent with SID: ${message.sid}`));
}

module.exports = {
    sendSMS
};
