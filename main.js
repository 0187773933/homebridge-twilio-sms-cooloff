const fs = require( "fs" );
const path = require( "path" );
const process = require( "process" );
var Service, Characteristic;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-twilio-sms-cooloff", "Twilio-Cooloff", TwilioSwitch);
}

const MonthNames = [ "JAN" , "FEB" , "MAR" , "APR" , "MAY" , "JUN" , "JUL" , "AUG" , "SEP" , "OCT" , "NOV" , "DEC" ];
function GET_NOW_TIME() {
	const today = new Date();
	let day = today.getDate();
	if ( parseInt( day ) < 10 ) { day = "0" + day; }
	const month = MonthNames[ today.getMonth() ];
	const year = today.getFullYear();
	let hours = today.getHours();
	if ( parseInt( hours ) < 10 ) { hours = "0" + hours; }
	let minutes = today.getMinutes();
	if ( parseInt( minutes ) < 10 ) { minutes = "0" + minutes; }
	let seconds = today.getSeconds();
	if ( parseInt( seconds ) < 10 ) { seconds = "0" + seconds; }
	let milliseconds = today.getMilliseconds();
	const mi = parseInt( milliseconds );
	if ( mi < 10 ) { milliseconds = "00" + milliseconds; }
	else if ( mi < 100 ) { milliseconds = "0" + milliseconds; }
	return day + month + year + " @ " + hours + ":" + minutes + ":" + seconds + "." + milliseconds
	// return day + month + year + " @ " + hours + ":" + minutes + ":" + seconds;
}

function TwilioSwitch(log, config) {
	this.log = log;

	// account info
	this.accountSid = config["accountSid"];
	this.authToken = config["authToken"];
	this.messageBody = config["messageBody"];
	this.toNumbers = config["toNumbers"];
	this.twilioNumber = config["twilioNumber"];
	this.name = config["name"];
	this.automaticallySwitchOff = config["automaticallySwitchOff"];
	this.client = require('twilio')(this.accountSid, this.authToken);
	// this.global_cooloff_seconds = config["global_cooloff_seconds"];
	// this.accessory_cooloff_seconds = config["accessory_cooloff_seconds"];
	this.cooloff_milliseconds = config["cooloff_milliseconds"];
}

TwilioSwitch.prototype = {
	getServices: function () {
		var informationService = new Service.AccessoryInformation();

		informationService
				.setCharacteristic(Characteristic.Manufacturer, "Twilio-Cooloff")
				.setCharacteristic(Characteristic.Model, "Send an SMS")
				.setCharacteristic(Characteristic.SerialNumber, "api");

		this.switchService = new Service.Switch(this.name);
		this.switchService
				.getCharacteristic(Characteristic.On)
				.on('get', this.getPowerState.bind(this))
				.on('set', this.setPowerState.bind(this));


		return [this.switchService, informationService];
	},

	getPowerState: function (callback) {
		callback(null, false);
	},
	readSaveFile: function() {
		try {
			// let save_file = fs.readFileSync( "/homebridge/node_modules/homebridge-twilio-sms/save_file.json" );
			let save_file = fs.readFileSync( path.join( process.cwd() , "save_file.json" ) );
			return JSON.parse( save_file );
		} catch( e ) {
			console.log( "save file doesn't exist , creating" );
			fs.writeFileSync( path.join( process.cwd() , "save_file.json" ) , JSON.stringify({
				"sensors": {}
			}));
			return { "sensors": {} };
		}
	},
	writeSaveFile( js_object ) {
		// fs.writeFileSync( "/homebridge/node_modules/homebridge-twilio-sms/save_file.json" , JSON.stringify( js_object ) );
		fs.writeFileSync( path.join( process.cwd() , "save_file.json" ) , JSON.stringify( js_object ) );
	},
	setPowerState: function(powerOn, callback) {
		var self = this;
		try {
			if (powerOn) {
				let save_file = self.readSaveFile();
				let now = new Date();
				if ( !save_file[ "sensors" ] ) { save_file[ "sensors" ] = {}; }
				if ( !save_file[ "sensors" ][ this.name ] ) { save_file[ "sensors" ][ this.name ] = { "last_power_on_time": false }; }
				if ( save_file[ "sensors" ][ this.name ][ "last_power_on_time" ] === false ) {
					self.log( "resetting last_power_on_time to now" );
					save_file[ "sensors" ][ this.name ][ "last_power_on_time" ] = now;
					self.writeSaveFile( save_file );
				}
				let difference = ( now - new Date( save_file[ "sensors" ][ this.name ][ "last_power_on_time" ] ) );
				this.log( "Difference = " + difference.toString() );
				if ( difference > 0 && difference < this.cooloff_milliseconds ) {
					let remaining = ( this.cooloff_milliseconds - difference );
					self.log( "still inside cooldown , " + remaining.toString() + " milliseconds remaining" );
					if (self.automaticallySwitchOff === true) {
						self.switchService.setCharacteristic(Characteristic.On, false);
					}
					self.writeSaveFile( save_file );
					if (self.automaticallySwitchOff === true) {
						self.switchService.setCharacteristic(Characteristic.On, false);
					}
				} else {
					self.log( "not inside cooldown" );
					save_file[ "sensors" ][ this.name ][ "last_power_on_time" ] = now;
					self.writeSaveFile( save_file );
					for (var i = 0; i < self.toNumbers.length; ++i) {
						self.client.messages.create({
							to: self.toNumbers[i],
							from: self.twilioNumber,
							body: `${self.messageBody} === ${GET_NOW_TIME()}`,
						}, function(err, message) {
							if (err) {
								self.log("Could not make the SMS! - with Error:")
								self.log(err);
							} else {
								console.log("SMS succeeded!");
							}
							if (self.automaticallySwitchOff === true) {
								self.switchService.setCharacteristic(Characteristic.On, false);
							}
						});
					}
				}
			}
		} catch( e ) { self.log( e ); }
		callback();
	},

	identify: function (callback) {
		this.log("Identify requested!");
		callback(); // success
	}
};
