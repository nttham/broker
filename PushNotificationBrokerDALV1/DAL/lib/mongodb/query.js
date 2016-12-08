/**
 * Created by cognizant on 08/11/16.
 */

var db;
var mongoose = require('mongoose');


var query = function(){

};

// PROTOTYPES
query.prototype.setDB = setDB;
query.prototype.create = create;
query.prototype.getData = getData;
query.prototype.updateData = updateData;
query.prototype.deleteData = deleteData;
query.prototype.createCollection = createCollection;
query.prototype.dropCollection = dropCollection;


/**
 * Sets the DB instance
 * @param {object} dbInstance - Instance of dbConnection
 * @param {Function} callback -  callback function
 * @api public
 */
function setDB(dbInstance,callback){
    db = dbInstance;
    callback(null,true);
};


/**
 * Saves the document to mongo db.
 * @param {String} collectionName - Name of the Collection
 * @param {object} objToSave -  Data object to be stored in database
 * @param {Function} callback -  callback function
 * @api public
 */
function create(collectionName, schemaName,objToSave,callback){

    var modelObj = require('./dbschema/'+schemaName);
    var dbModel = db.model(collectionName, modelObj);
    var newSaveObj = new dbModel(objToSave);

    newSaveObj.save(function(err,result){
        if(err){

            return callback(err);
        }
        else{

            return callback(null,result);
        }
    });

};



/**
 * fetch the info/recoreds from the DB
 * @param {String} collectionName - Name of the Collection
 * @param {object} queryObj - query object to fetch record(s) from the database
 * @param {object} [queryOptions] Optional parameter - Options to apply on return query results
 * @param {Function} callback -  callback function
 * @api public
 */
function getData(collectionName,schemaName,queryObj,queryOptions,callback){
    var modelObj = require('./dbschema/'+schemaName);
    var dbModel = db.model(collectionName, modelObj);

    dbModel.find(queryObj,queryOptions,callback);

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
function updateData(collectionName,schemaName, conditions, updateObj, options, callback){
    var modelObj = require('./dbschema/'+schemaName);
    var dbModel = db.model(collectionName, modelObj);
    dbModel.update(conditions, updateObj, options, callback);

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
function deleteData(collectionName,schemaName, queryObj, callback){
    var modelObj = require('./dbschema/'+schemaName);
    var dbModel = db.model(collectionName, modelObj);
    dbModel.remove(queryObj, function(err,resp){
        if(err){
            return callback(err);
        }
        else{
            var response ={
                "message" : "Data removed successfully"
            };
            return callback(null,response);
        }
    });
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
function deleteData(collectionName,schemaName, queryObj, callback){
    var modelObj = require('./dbschema/'+schemaName);
    var dbModel = db.model(collectionName, modelObj);
    dbModel.remove(queryObj, function(err,resp){
        if(err){
            return callback(err);
        }
        else{
            var response ={
                "message" : "Data removed successfully"
            };
            return callback(null,response);
        }
    });
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
function createCollection(collectionName,schemaName,callback){
    var MongoClient = require('mongodb').MongoClient;
    var connector = require('./connector.js');
    var connectionUrl = connector.getConnectionString();
    MongoClient.connect(connectionUrl, {auth:{authdb:'admin'}}, function(err, db) {
        //On connecting the DB if any error occurs, it will return the err.
        if(err) {
            return callback(err);
        }
        else {
            //create a collection based on the given channel name.
            //collection name is equivalent to channel name.
            db.createCollection(collectionName, {strict: true}, function (err, collection) {
                //On creating the collection if any error occurs, it will return the err and close the db
                if (err) {
                    //Closing the DB connection is error occurs.
                    db.close();
                    return callback({"message": err.message});
                }
                //Closing the DB connection on success.
                db.close();
                //Once collection is created will return the success message as callback
                return callback(null, collection);
            });
        }

    });
};


/**
 * delete  the collection in the database
 * @param {object} collectionName - Name of the Collection
 * @param {Function} callback - callback function
 * @api public
 */
function dropCollection(collectionName, callback){
    db.db.dropCollection(collectionName, callback);

};

module.exports = query;