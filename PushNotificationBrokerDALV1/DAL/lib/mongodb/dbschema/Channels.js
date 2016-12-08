/**
 * Created by Srividya on 21/07/16.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//Channels schema
var channelSchema = mongoose.Schema({
    channelname		    : String,
    deviceid		    : String,
    channeldescription	: String
});

//Mongo db connection
//TODO :: Connection to be done during every API call based on instanceId as dbname
//mongoose.connect('mongodb://localhost/pushNotificationdatabase');
//mongoose.connect('mongodb://admin:1e2Pjjd@54.169.162.137:10053/week2PushNotification',{auth:{authdb:'admin'}});

module.exports = channelSchema;//mongoose.model('channels', channelSchema);
