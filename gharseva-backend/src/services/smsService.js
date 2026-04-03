const axios = require('axios');

class SMSService {
    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.mode = process.env.SMS_MODE || 'MOCK';
    }

    async sendOtp(phoneNumber, otp) {
        if (this.mode === 'MOCK') {
            console.log(`\n-----------------------------------------`);
            console.log(`[SMS MOCK] To: ${phoneNumber}`);
            console.log(`[SMS MOCK] Message: Your OTP is ${otp}. Valid for 5 mins.`);
            console.log(`-----------------------------------------\n`);
            return true;
        }

        if (this.mode === 'FAST2SMS') {
            try {
                // Remove +91 if present
                const cleanNumber = phoneNumber.replace(/^\+?91/, '').trim();
                
                const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
                    params: {
                        authorization: this.apiKey,
                        route: 'otp',
                        variables_values: otp,
                        numbers: cleanNumber,
                    }
                });

                if (response.data.return) {
                    console.log(`[SMS] OTP sent successfully to ${cleanNumber}`);
                    return true;
                } else {
                    console.error('[SMS Error] Fast2SMS returned success false:', response.data.message);
                    return false;
                }
            } catch (error) {
                console.error('[SMS Error] Fast2SMS integration failed:', error.response?.data || error.message);
                return false;
            }
        }

        return false;
    }
}

module.exports = new SMSService();
