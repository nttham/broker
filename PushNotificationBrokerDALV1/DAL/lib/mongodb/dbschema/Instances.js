var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Schema for instance details. For checking apiKey security and fetching the db instance details
var InstanceSchema = new Schema({
    instanceid		: String,
    dbname			: String,
    apikey		    : String,
    bindedto		: String,
    correlationid   : String,
    analytics_url   : String
});

module.exports = InstanceSchema;
