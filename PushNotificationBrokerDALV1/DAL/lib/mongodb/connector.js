/**
 * Created by cognizant on 08/11/16.
 */
var dbConfig = require("../DBConstants.json");
var mongoose = require("mongoose");
var Grid = require('gridfs-stream');
var db;
var gfs;
var error = require('../error.json');
var connectionUrl ;
var dbName;


/**
 * Connects to the DB
 * @param {object} connectionObject - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */
exports.connectToDB = function(connectionObject,callback) {

    //checks for the db type
    if(connectionObject.dbType === dbConfig.mongodb) {
        dbName = connectionObject.dbName;
        if(connectionObject.isLocal){
            connectionUrl = 'mongodb://127.0.0.1/pushnotification1'
            //connectionUrl = "mongodb://" + "NWFhZjg0YjAtYWVjNC00MDc5LWExNzMtYmFmZDI5OWQ5ZjAx" + ":" + "zerzgoe9fg" + "@" + "10.0.20.235" + ":" + "27017" + "/" + "Test";

            db = mongoose.createConnection(connectionUrl, {auth: {authdb: 'admin'},server: {poolSize: 20}});


        }
        else if(connectionObject.username && connectionObject.password && connectionObject.ip && connectionObject.port && connectionObject.dbName) {
            connectionUrl = "mongodb://" + connectionObject.username + ":" + connectionObject.password + "@" + connectionObject.ip + ":" + connectionObject.port + "/" + connectionObject.dbName;

            db = mongoose.createConnection(connectionUrl, {auth: {authdb: 'admin'}, server: {poolSize: 5}});

        }
            Grid.mongo = mongoose.mongo;
            db.once('open', function () {
                console.log("DB Connection opened Successfully !!!!!!")
                return callback(null,db);
            });

            db.on('error', function (err) {
                console.log('Error! Database connection failed : ',err);
                return callback(err,db);
            });


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
console.log(connectionUrl)
      return connectionUrl;
};
/**
 * fetches the connection string for the DB connection
 * @api public
 */

exports.getdbName= function() {

    return dbName;
};