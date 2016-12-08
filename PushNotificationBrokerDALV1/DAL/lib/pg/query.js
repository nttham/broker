/**
 * Created by cognizant on 08/11/16.
 */

var db;
const pg = require('pg');
var jsonSql = require('json-sql')({
    dialect: 'postgresql',
    namedValues: false
});
var connector = require('./connector.js');
var async = require('async');

var query = function(){

};

// PROTOTYPES
query.prototype.setDB = setDB;
query.prototype.create = create;
query.prototype.getData = getData;
query.prototype.updateData = updateData;
query.prototype.deleteData = deleteData;
query.prototype.createCollection = createTable;
query.prototype.dropCollection = dropTable;


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
function create(tableName, schemaName,objToSave,callback) {

    var checkAndCreateTable = function(callback){
        var config = require("../dbConfig");
        if(!config.tables[tableName]){
            createTable(tableName,schemaName,callback);
        }
        else{
            callback(null,true);
        }
    };

    var insertRecord = function(result,callback){
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);
        var insert = function(insertData,callback) {

            client.connect();
            //building query

            var insertString = jsonSql.build({
                type: 'insert',
                table: tableName.toLowerCase(),
                values: JSON.parse(JSON.stringify(insertData).toLowerCase())
            });
            const insertquery = client.query(insertString.query, insertString.values);
            insertquery.on('end', function () {
                client.end();
                callback(null, "Data Inserted  Successfully");
            });
        };
        if(objToSave instanceof Array){
            async.each(objToSave,insert,callback);
        }
        else{
            insert(objToSave,callback);
        }

};


   async.waterfall([checkAndCreateTable,insertRecord],callback);


};



/**
 * fetch the info/recoreds from the DB
 * @param {String} tableName - Name of the Collection
 * @param {object} queryObj - query object to fetch record(s) from the database
 * @param {object} [queryOptions] Optional parameter - Options to apply on return query results
 * @param {Function} callback -  callback function
 * @api public
 */
function getData(tableName,schemaName,queryObj,queryOptions,callback){

    var results =[] ;
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);


    pg.connect(connectionUrl, function(err, client, done){
        // handle err here
        var async = require('async');
        function getSelectors(callback) {
            var selectFields = '';
            if(queryOptions) {
                var selectFieldArray = Object.keys(queryOptions);
                var count = selectFieldArray.length;
            }


            var index = 0;
            var getFields = function (key, callback) {
                index = index + 1;
                if (index < (count )) {

                    selectFields = selectFields + key + ' , ';
                }
                else {
                    selectFields = selectFields + key;
                }

                return callback(null, selectFields)
            }

            var finalCallback = function (err, result) {

                return callback(null,selectFields);
            }
            if(queryOptions && Object.keys(queryOptions).length) {
                async.each(selectFieldArray, getFields, finalCallback);
            }else{
                return callback(null,"*")
            }


        };


        function getSelectQuery(result,callback){

            var query = "SELECT selector FROM ";
            var selectQuery =  query.replace("selector",result);
            selectQuery = selectQuery + tableName.toLowerCase();
            return callback(null,selectQuery);

        };
        function getCondition(result,callback){
            var whereObj = 'WHERE';
            if(queryObj && Object.keys(queryObj).length){
                var conditionalObj = Object.keys(queryObj);
                var count = conditionalObj.length;
                var index = 0;

                var getWhereclause = function(key,callback){
                    index = index + 1;
                    if (index < (count )) {

                        whereObj = whereObj +' '+ key +" = '"+ queryObj[key] + "' and"
                    }
                    else {
                        whereObj =  whereObj + ' ' + key +" = '"+ queryObj[key] +"';";
                    }
                    return callback(null);
                }
                var finalCB = function(err){
                    if(err){
                        return callback(err,null);
                    }
                    else{
                        result = result + ' '+whereObj;
                        return callback(null,result);
                    }
                }

                async.each(conditionalObj,getWhereclause,finalCB);
            }
            else{
                result = result + ';'
                return callback(null,result);
            }
        }


        async.waterfall([getSelectors,getSelectQuery,getCondition],function(err,qry){
            if(err){
                return callback(err);
            }
            else{

                client.query(qry, function(err, result) {
                    // handle err here
                    done(); // don't forget this to have the client returned to the pool
                    var resultDTo = {};
                    if(result) {
                        resultDTo = result.rows;

                    }
                    var finalResult = JSON.stringify(resultDTo);
                    var retObj = JSON.parse(finalResult)
                    callback(null,retObj);
                });
            }
        })


    });


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
function updateData(tableName,schemaName, conditions, updateObj, options, callback){
    var results =[] ;
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);

    pg.connect(connectionUrl, function(err, client, done){
        // handle err here
        var async = require('async');
        function getSetters(callback) {
         var setQuery = "UPDATE "+ tableName.toLowerCase();
            if(updateObj && Object.keys(updateObj).length){
                setQuery = setQuery + ' SET';
                var count = Object.keys(updateObj).length;
                var index = 0;
                var getSetElements = function(key,callback){
                    index = index + 1;
                    var value = null;
                    if(updateObj[key]){
                        value =  updateObj[key].toLowerCase();
                    }
                    if (index < (count  )) {

                        setQuery = setQuery +' '+ key +" = '"+ value + "',"
                    }
                    else {

                        setQuery =  setQuery + ' ' + key +" = '"+ value +"'";
                    }
                    return callback(null);
                }

                var finalCB = function(err){
                    if(err){
                        return callback(err,null);
                    }
                    else{

                        return callback(null,setQuery);
                    }
                }
                async.each(Object.keys(updateObj),getSetElements,finalCB);

            }

        };


        function getCondition(result,callback){
            var whereObj = 'WHERE';
            if(conditions && Object.keys(conditions).length){
                var conditionalObj = Object.keys(conditions);
                var count = conditionalObj.length;
                var index = 0;

                var getWhereclause = function(key,callback){
                    index = index + 1;
                    if (index < (count )) {

                        whereObj = whereObj +' '+ key +" = '"+ conditions[key] + "' and"
                    }
                    else {
                        whereObj =  whereObj + ' ' + key +" = '"+ conditions[key] +"';";
                    }

                    return callback(null);
                }
                var finalCB = function(err){
                    if(err){
                        return callback(err,null);
                    }
                    else{
                        result = result + ' '+whereObj;
                        return callback(null,result);
                    }
                }

                async.each(conditionalObj,getWhereclause,finalCB);
            }
            else{
                result = result + ';'
                return callback(null,result);
            }
        }


        async.waterfall([getSetters,getCondition],function(err,qry){
            if(err){
                return callback(err);
            }
            else{

                client.query(qry, function(err, result) {
                    // handle err here
                    done(); // don't forget this to have the client returned to the pool
                    callback(null,result);
                });
            }
        })


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
function deleteData(tableName,schemaName, queryObj, callback){
    var results =[] ;
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);


    pg.connect(connectionUrl, function(err, client, done){
        // handle err here
        var async = require('async');
        function getDel(callback) {
            var delQuery = "DELETE FROM  "+ tableName.toLowerCase();
            return callback(null,delQuery);

        };


        function getCondition(result,callback){
            var whereObj = 'WHERE';
            if(queryObj && Object.keys(queryObj).length){
                var conditionalObj = Object.keys(queryObj);
                var count = queryObj.length;
                var index = 0;

                var getWhereclause = function(key,callback){
                    index = index + 1;
                    if (index < (count )) {

                        whereObj = whereObj +' '+ key +" = '"+ queryObj[key] + "' and"
                    }
                    else {
                        whereObj =  whereObj + ' ' + key +" = '"+ queryObj[key] +"';";
                    }
                    return callback(null);
                }
                var finalCB = function(err){
                    if(err){
                        return callback(err,null);
                    }
                    else{
                        result = result + ' '+whereObj;
                        return callback(null,result);
                    }
                }

                async.each(conditionalObj,getWhereclause,finalCB);
            }
            else{
                result = result + ';'
                return callback(null,result);
            }
        }


        async.waterfall([getDel,getCondition],function(err,qry){
            if(err){
                return callback(err);
            }
            else{

                client.query(qry, function(err, result) {
                    // handle err here
                    done(); // don't forget this to have the client returned to the pool
                    callback(null,result.rows);
                });
            }
        })


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
function createTable(tableName,schemaName,callback){
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);
    client.connect();
    //building query
    var schemaJson = require('./dbschema/'+schemaName);

    var queryString = schemaJson.createstmt + ' '+ tableName + ' '+ schemaJson.columnNames;

    const query = client.query(queryString);
    query.on('end',function(){
        client.end();
        callback(null,"Table Created Successfully");
    });
};

/**
 * delete  the table in the database
 * @param {object} collectionName - Name of the Collection
 * @param {Function} callback - callback function
 * @api public
 */
function dropTable(tableName, callback){
    var connectionUrl = connector.getConnectionString();
    const client = new pg.Client(connectionUrl);
    client.connect();
    var queryString = "drop table IF EXISTS "+tableName +";";

    const query = client.query(queryString);
    query.on('end',function(){
        client.end();
        callback(null,"Table Deleted  Successfully");
    });

};

module.exports = query;