var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Schema for instance details. For checking apiKey security and fetching the db instance details
var TemplateSchema = new Schema({
    templateid		: String,
    gcm			    : String,
    apns		    : String,
    wns		        : String,
    rules           : String,
    email           : String,
    sms             : String
});

module.exports = TemplateSchema;