/**
 * Created by cognizant on 08/11/16.
 */

var DBObject;
var DBConstants = require('./DBConstants.json');
var error = require('./error.json');
var dbType;
var queryHandler;


// public api
exports.create = saveData;
exports.query = getData;
exports.update = updateData;
exports.delete = deleteData;
exports.findOneAndRemove = findOneAndRemove;
exports.findOneAndUpdate = findOneAndUpdate;
exports.findOne = findOne;
exports.initializeDal = initializeDal;
exports.createCollection = createCollection;
exports.closeDb = closeDb;
exports.dropCollection = dropCollection;

/**
 * Initialize Dal layer Which will connect to the DB
 * according to the db type selected
 *
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */

function initializeDal(connectionObject, callback){
var config = require('./dbConfig.json');
    var cfenv = require('cfenv');
    var appEnv = cfenv.getAppEnv();
    // setting the db type from config
    connectionObject.dbType = config.dbType;

    //depending upon the platform getting the vcap info
    switch(config.platform){
        case DBConstants.cognizantfoundry:{
            if (appEnv.getService(config.mongodb_service_name)) {
                console.log('DB SERVICE AVAILABLE IN THIS PLATFORM');
                connectionObject.ip = appEnv.getService(config.mongodb_service_name).credentials.IP;
                connectionObject.port = appEnv.getService(config.mongodb_service_name).credentials.port;
                connectionObject.username = appEnv.getService(config.mongodb_service_name).credentials.username;
                connectionObject.password = appEnv.getService(config.mongodb_service_name).credentials.password;
                connectionObject.dbName = appEnv.getService(config.mongodb_service_name).credentials.DBName;;

            }
            else
            {
                connectionObject.ip = "127.0.0.1";
                connectionObject.port = "27017";
                connectionObject.username = "admin";
                connectionObject.password = "admin";
                delete connectionObject.isLocal;
                connectionObject.isLocal = true;
                console.log('error', 'No service name ' + config.db_service_name + ' bound to the application. Connecting locally');

            }
        }
        break;
        case DBConstants.bluemix:{
            if (appEnv.getService(config.pg_service_name)) {
                console.log('DB SERVICE AVAILABLE IN THIS PLATFORM');
                connectionObject.ip = appEnv.getService(config.pg_service_name).credentials.IP;
                connectionObject.port = appEnv.getService(config.pg_service_name).credentials.port;
                connectionObject.username = appEnv.getService(config.pg_service_name).credentials.username;
                connectionObject.password = appEnv.getService(config.pg_service_name).credentials.password;
                connectionObject.dbName = appEnv.getService(config.pg_service_name).credentials.DBName;

            }
            else
            {
                connectionObject.ip = "127.0.0.1";
                connectionObject.port = "5432";
                connectionObject.username = "admin";
                connectionObject.password = "admin";
                delete connectionObject.isLocal;
                connectionObject.isLocal = true;
                console.log('error', 'No service name ' + config.db_service_name + ' bound to the application. Connecting locally');

            }
        }
        break;

        default:{
            console.log(error.INVALID_PLATFORM.message);
            callback(error.INVALID_PLATFORM);
        }
        break;
    }


    // Setting the Database here
    dbType = connectionObject.dbType;

    switch (connectionObject.dbType){
        case  DBConstants.mongodb :{
            queryHandler = require('./mongodb/query.js');
            var connector = require('./mongodb/connector.js');
            connector.connectToDB(connectionObject,function(err,db){
                var queryObj = new queryHandler();
                queryObj.setDB(db,callback);
            });
        }
        break;
        case DBConstants.pg :{
            queryHandler = require('./pg/query.js');
            var connector = require('./pg/connector.js');
            connector.connectToDB(connectionObject,callback);
        }
            break;
        default:{
            console.log(error.INVALID_DBTYPE.message);
            callback(error.INVALID_DBTYPE);
        }
        break;
    };

};

/**
 * This will close the DB
 * according to the db type selected
 *
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */

function closeDb(connectionObject){

    // Setting the Database here
    dbType = connectionObject.dbType;

    switch (connectionObject.dbType){
        case  DBConstants.mongodb :{
            queryHandler = require('./mongodb/query.js');
            var connector = require('./mongodb/connector.js');
            connector.closeDB();
        }
            break;
        case DBConstants.pg :{
            queryHandler = require('./pg/query.js');
            var connector = require('./pg/connector.js');
            connector.closeDB(connectionObject);
        }
            break;
        default:{
            console.log(error.INVALID_DBTYPE.message);
            callback(error.INVALID_DBTYPE);
        }
    };

};


/**
 * This will close the DB
 * according to the db type selected
 *
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */

function createCollection(collectionName,schemaName,callback){
    var queryObj = new queryHandler();
    queryObj.createCollection(collectionName,schemaName,callback);
};


/**
 * This will close the DB
 * according to the db type selected
 *
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */

function dropCollection(collectionName,callback){
    var queryObj = new queryHandler();
    queryObj.dropCollection(collectionName,callback);
};

/**
 * Saves the document to  db.
 * @param {object} collectionName - Name of the Collection
 * @param {object} objToSave - Data object to be stored in database
 * @param {Function} callback -  callback function
 * @api public
 */
function saveData(collectionName, schemaName,objToSave ,callback){
    var queryObj = new queryHandler();
    queryObj.create(collectionName,schemaName,objToSave,callback);
};


/**
 * fetch the info/recoreds from the DB
 *
 *
 * @param {object} collectionName - Name of the Collection
 * @param {object} queryObj - query object to fetch record(s) from the database
 * @param {object} [queryOptions] Optional parameter - Options to apply on return query results
 * @param {Function} callback -callback function
 * @api public
 */
function getData(collectionName,schemaName, queryObj, queryOptions,callback){
    //If queryOptions is not passed then check callback is there in place of queryOptions. If so assign queryOptions to callback and empty object to queryOptions
    if (typeof queryOptions === 'function') {
        callback = queryOptions;
        queryOptions = {};
    }

    var queryObject = new queryHandler();
    queryObject.getData(collectionName,schemaName,queryObj,queryOptions,callback);

};


/**
 * Update the document/record(s) in the database
 * @param {object} collectionName - Name of the Collection
 * @param {object} conditions - Conditions object to query
 * @param {object} updateObj - data object to be updated
 * @param {object} [options] - optional parameter - options object to apply on mongoDB query
 * @param {Function} callback - callback function
 * @api public
 */
function updateData(collectionName, schemaName,conditions, updateObj, options, callback){

    //If options is not passed then check callback is there in place of options. If so assign options to callback and empty object to options
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    var queryObject = new queryHandler();
    queryObject.updateData(collectionName, schemaName,conditions, updateObj, options, callback);
};

/**
 * delete the document/record(s) in the database
 *
 *
 * @param {object} collectionName - Name of the Collection
 * @param {object} queryObj - query object to delete record(s) from the database
 * @param {Function} callback - callback function
 * @api public
 */
function deleteData(collectionName, schemaName,queryObj, callback){
    var queryObject = new queryHandler();
    queryObject.deleteData(collectionName, schemaName,queryObj, callback);
};


/**
 * Find one and delete the document in the database
 *
 *
 * @param {object} collectionName - Name of the Collection
 * @param {object} queryObj - query object to delete record(s) from the database
 * @param {object} [options] - optional parameter - options object to apply on mongoDB query
 * @param {Function} callback - callback function
 * @api public
 */
function findOneAndRemove(collectionName, schemaName,queryObj, options,connectionString, callback){
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    getData(collectionName, schemaName,queryObj,connectionString,function(err,results) {
        if (err) {
            callback(err)
        }
        else if(results.length === 0 ) {
            callback({"message":"No record available to delete"});
        }
        else if(results.length > 1) {
            callback({"message":"More than one record available to delete"})
        }
        else if(results.length === 1) {
            deleteData(collectionName, queryObj ,callback);
        }
        else {
            callback({"message":"Error in finding the record"})
        }
    })
};


/**
 * Find one and updates that document in the database
 *
 *
 * @param {object} collectionName - Name of the Collection
 * @param {object} criteria - query object to check for the record to be updated
 * @param {object} doc - Data object to be updated in the database
 * @param {object} [options] - optional parameter - options object to apply on mongoDB query
 * @param {Function} callback - callback function
 * @api public
 */
function findOneAndUpdate(collectionName, schemaName, criteria, doc, options, connectionString,callback){
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    getData(collectionName,schemaName,criteria,connectionString,function(err,results) {
        if (err) {
            callback(err)
        }
        else if(results.length === 0 ) {
            callback({"message":"No record available to update"});
        }
        else if(results.length > 1) {
            callback({"message":"More than one record available to update"})
        }
        else if(results.length === 1) {
            updateData(collectionName,criteria,doc,callback);
        }
        else {
            callback({"message":"Error in finding the record to update"})
        }
    })
};



/**
 * Find one record
 *
 *
 * @param {String} collectionName - Name of the collection to which data to be stored
 * @param {object} criteria - query object to check for the record
 * @param {object} [projection] - optional parameter - options object to apply on mongoDB query for projection
 * @param {Function} callback - callback function
 * @api public
 */
function findOne(collectionName, schemaName,criteria, projection, connectionString,callback){
    //If options is not passed then check callback is there in place of options. If so assign options to callback and empty object to options
    if (typeof projection === 'function') {
        callback = projection;
        projection = {};
    }

    getData(collectionName,schemaName,criteria,connectionString,function(err,results) {
        if (err) {
            callback(err)
        }
        else if(results.length === 0 ) {
            callback({"message":"No record available"});
        }
        else if(results.length > 1) {
            callback({"message":"More than one record available"})
        }
        else if(results.length === 1) {
            callback(null,results[0]);
        }
        else {
            callback({"message":"Error in finding the record"})
        }
    })
};
