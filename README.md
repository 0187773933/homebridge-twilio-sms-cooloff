# Modified from https://github.com/qata/homebridge-twilio-sms#readme

# homebridge-twilio-sms-coolof

Homebridge plugin to send SMSes with static text.
This plugin uses Twilio api, which is a paid service at a fair price - [www.Twilio.com](https://www.twilio.com).

Very good use for homekit alarms and sensor, you can set an automation to SMS your phone if your alarm is triggered, there is a water leak or smoke detected.

# Twilio configuraions
To use this plugin, you need to signup to their website and get a phone number from their service it will use you in the config as **twilioNumber**.

the **accountSid** and **authToken** can be retrieved from [https://www.twilio.com/console/account/settings](https://www.twilio.com/console/account/settings)

After you set all of those, you can move forward to installing the plugin on homebridge.

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-twilio-sms
3. Update your configuration file. See sample-config.json in this repository for a sample.

# Configuration

#### Please read carefully Twilio configurations first

Config.json sample:

 ```
"accessories": [
        {
            "accessory": "Twilio",
            "name": "SMS Lottie",
            "accountSid": "4352435f45f423456d652643dxre",
            "authToken": "RVGH54CG45G5TG354GRT45T45G4G",
            "messageBody": "The dehumidifier is full",
            "toNumbers": ["+445287563029", "+445287563483"],
            "twilioNumber": "+445287562349",
            "automaticallySwitchOff": true ,
            "cooloff_milliseconds": 10000
        }
    ]

```
