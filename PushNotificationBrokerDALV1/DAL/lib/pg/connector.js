/**
 * Created by cognizant on 08/11/16.
 */
var dbConfig = require("../DBConstants.json");
var db;
var error = require('../error.json');
var connectionUrl ;
var dbName;
const pg = require('pg');
var config = require("../dbConfig");
var async = require("async");
var DALObj = require("../IDAL")

/**
 * Connects to the DB
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */
exports.connectToDB = function(connectionObject,callback) {

    //checks for the db type
    if(connectionObject.dbType === dbConfig.pg) {
        dbName = connectionObject.dbName;
        if(connectionObject.isLocal){

            connectionUrl = 'postgres://localhost:5432/pushnotification1'

        }
        else if(connectionObject.username && connectionObject.password && connectionObject.ip && connectionObject.port && connectionObject.dbName) {

            connectionUrl = "postgres://" + connectionObject.username + ":" + connectionObject.password + "@" + connectionObject.ip + ":" + connectionObject.port + "/" + connectionObject.dbName;

        }
        var createTable = function(table,callback){
            DALObj.createCollection(table,table,callback);
        };

        async.each(config.tables,createTable,callback);


    }
    else {
        //Not a valid DB type
        return callback(error.INVALID_DBTYPE,null);
    }
};


/**
 * getter method to get the DB instance
 * @api public
 */

exports.getDB = function(){
    return db;
};



/**
 * Switch to the givenDB
 * @param {String} dbName - Database Name
 * @param {Function} callback -  callback function
 * @api public
 */

exports.switchDB = function(dbName,callback){
    var switchDB = db.useDb(dbName);
    gfs = Grid(switchDB.db);
    var dbObj = {
        dbConnection :switchDB,
        gfs:gfs
    };
    return callback(null,dbObj);
};

/**
 * switch to the given DB and Drop the database
 * @param {String} dbName - Database Name
 * @param {Function} callback -  callback function
 * @api public
 */

exports.deleteDB = function(dbName,callback){
    var delDB = db.useDb(dbName);
    delDB.db.dropDatabase(callback);
};


/**
 * switch to the given DB and Drop the database
 * @param {String} dbName - Database Name
 * @param {Function} callback -  callback function
 * @api public
 */

exports.closeDB = function() {

    db.close();
    console.log("Db closed ")
    return;
};

/**
 * fetches the connection string for the DB connection
 * @api public
 */

exports.getConnectionString = function() {
    return connectionUrl;
};
/**
 * fetches the connection string for the DB connection
 * @api public
 */

exports.getdbName= function() {

    return dbName;
};