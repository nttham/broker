/**
 *
 * Push Notification Service Broker , complying to version 2.4 of the interface specification
 * http://docs.cloudfoundry.org/services/api.html
 * This will serve all the request for Push notification services which is coming from the cloud
 * controller
 */

'use strict';

var config = require('./config/push_service_broker');
var restify = require('restify');
var async = require('async');
var uuid = require('uuid');
var randomstring = require("randomstring");
var constants = require('./constants.json');
var DalObj = require('./DAL');
var uniqueID = (randomstring.generate(10)+"s").toLowerCase();

// making collection names as global such that all functions can use the same collection names
var instanceCollectionName = constants.instance_collection_name || 'Instances';
var templateCollectionName = constants.template_collection_name || 'Templates';
var deviceCollectionName = constants.device_collection_name || 'Devices';
var channelCollectionName = constants.channel_collection_name || 'Channels';
var settingsCollectionName = constants.settings_collection_name || 'Settings';


//configuring the server for the service broker
var server = restify.createServer({
    name: 'push_service_broker'
});

server.use(apiVersionChecker({
    'major': 2,
    'minor': 4
}));
server.use(restify.authorizationParser());
server.use(authenticate(config.credentials));
server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.pre(restify.pre.userAgentConnection());


// To check the consistency of configurations

function checkConsistency() {
    var i, id, p, msg, plans, catalog;

    catalog = config.catalog;
    plans = config.plans;

    for (i = 0; i < catalog.services.length; i += 1) {
        for (p = 0; p < catalog.services[i].plans.length; p += 1) {
            id = catalog.services[i].plans[p].id;
            if (!plans.hasOwnProperty(id)) {
                msg = "ERROR: plan '" + catalog.services[i].plans[p].name + "' of service '" + catalog.services[i].name + "' is missing a specification.";
                throw new Error(msg);
            }
        }
    }
}

// get catalog
server.get('/v2/catalog', function (request, response, next) {

    response.send(config.catalog);
    next();
});

//router for provisioning a service when a cf create-service is called
server.put('/v2/service_instances/:id', function (request, response, next) {
    console.log("create-service params : " + JSON.stringify(request.params));

    var instanceObj = {};
    instanceObj.instanceid = request.params.id;
    //"s" is added at the end to avoid appending of s by mongoose
    instanceObj.dbname = (request.params.id+uniqueID);
    instanceObj.apikey = uuid.v1()+randomstring.generate(10)+(request.params.id).substr(3,9);
    instanceObj.bindedto = null;
    instanceObj.correlationid = request.params.parameters.correlationID || request.params.id;
    if (request && request.params && request.params.parameters && request.params.parameters.analytics_url) {
        instanceObj.analytics_url = request.params.parameters.analytics_url;
    }

    //Save instance details to pushCoreDB
    var saveInstanceDetails = function(callback){
        //var pushCoreDBConnection = dbConnector.getDB();

        // Query object to search the instance if already registered or not
        var queryObj = {instanceid : request.params.id};

        DalObj.query(instanceCollectionName,instanceCollectionName,queryObj,function(err,instances) {

            var totalInstances;
            if(instances instanceof Array ){
                totalInstances = instances.length;
            }else {
                totalInstances = 0;

            }

            //If there is no instance registered already then save details to database else throw error that instance already registered
            if (totalInstances || totalInstances == 0) {

                DalObj.create(instanceCollectionName,instanceCollectionName,instanceObj,function(err,results){
                    if (!err) {
                        callback(null,results);
                    } else {
                        callback(err);
                    }
                });
            }
            else {
                callback({error:"Instance already registered with the given id. Please try again."})
            }
        });
    };

    var saveTemplatesAndGroups = function (results, callback) {
        /*
        var switchToDB = function (onCallback) {

            dbConnector.switchDB(instanceObj.dbName, function (err, dbInstance) {
                if (!err && dbInstance) {
                    onCallback(null, dbInstance["dbConnection"]);
                }
                else if (err) {
                    onCallback(err);
                }
                else {
                    onCallback({ "error": "Something went wrong while creating an instance" });
                }
            });
        };
        */

        var saveTemplateData = function ( onCallback) {
            if (request && request.params && request.params.parameters && request.params.parameters.templates) {
                console.log("Templates JSON received in parameters : " + JSON.stringify(request.params.parameters.templates));

                var templates = request.params.parameters.templates;
                async.each(templates,
                    function (template, asyncCallback) {

                        var templateObjToSave = {};
                        if (template && template.templateId) {
                            templateObjToSave.templateid = template.templateId;
                            if (template.gcm) {
                                templateObjToSave.gcm = JSON.stringify(template.gcm);
                            }
                            if (template.apn) {
                                templateObjToSave.apns = JSON.stringify(template.apn);
                            }
                            if (template.wns) {
                                templateObjToSave.wns = JSON.stringify(template.wns);
                            }
                            if (template.rules) {
                                templateObjToSave.rules = JSON.stringify(template.rules);
                            }
                            if (template.twilio) {
                                templateObjToSave.sms = JSON.stringify(template.twilio);
                            }
                            if (template.sendgrid) {
                                templateObjToSave.email = JSON.stringify(template.sendgrid);
                            }
                        }


                        var templateCollection = (templateCollectionName+instanceObj.dbname).toLowerCase();
                        DalObj.create( templateCollection, templateCollectionName, templateObjToSave, function (err, results) {
                            if (!err) {
                                asyncCallback();
                            } else {
                                asyncCallback(err);
                            }
                        });
                    },
                    function (err) {
                        if (err) {
                            onCallback(err);
                        }
                        else {
                            onCallback(null, true);
                        }
                    }
                );
            }
            else {
                return onCallback(null, true)
            }
        };
        var saveChannelData = function (result, onCallback) {

            if (request && request.params && request.params.parameters && request.params.parameters.groups) {
                console.log("Channel JSON received in parameters : " + JSON.stringify(request.params.parameters.groups));

                var groups = request.params.parameters.groups;
                async.each(groups,
                    function (group, asyncCallback) {

                        var channelDetailsToSave = {
                            channelname: group.channelName || "",
                            channeldescription: group.channelDescription || ""
                        };


                        var channelCollection = (channelCollectionName+instanceObj.dbname).toLowerCase();
                        DalObj.create( channelCollection, channelCollectionName, channelDetailsToSave, function (err, results) {
                            if (!err) {
                                asyncCallback();
                            } else {
                                asyncCallback(err);
                            }
                        });
                    },
                    function (err) {
                        if (err) {
                            onCallback(err);
                        }
                        else {
                            onCallback(null, true);
                        }
                    }
                );
            }
            else {
                return onCallback(null, dbConnector)
            }
        };

        var onFinalCallback = function (err, result) {
            if (err) {
                return callback(err);

            }
            else {
                return callback(null, true);
            }
        };

        async.waterfall([ saveTemplateData, saveChannelData], onFinalCallback);
    };

    var finalCallback = function (err) {
        if (err) {
            response.send(400, {

                'description': err
            });
        }
        else {
            response.send(200, {
                'description': 'created an instance of push notification.'
            });

            next();
        }
    };

    if (request && request.params && request.params.parameters && request.params.parameters.templates) {
        console.log("Templates JSON received in parameters : " + JSON.stringify(request.params.parameters.templates));
        async.waterfall([saveInstanceDetails, saveTemplatesAndGroups], finalCallback);
    }
    else {
        saveInstanceDetails(finalCallback);
    }
    next();
});



// router for un provision the service when a cf delete-service is called
server.del('/v2/service_instances/:id', function (req, response, next) {
    console.log('********Inside cf delete-service**********');


    var getInstanceDetails = function (callback) {

        var onCallback = function(err,result){
            if(err){
                return callback(err);

            }
            else {
                if(result.length ) {

                    return callback(null, result[0]);
                }
                else{
                    return callback({error:"No instance found"});
                }
            }
        };

        var queryOBj = {
            instanceid :req.params.id
        };


        DalObj.query(instanceCollectionName,instanceCollectionName,queryOBj, onCallback);
    };

    //deletes the entry from the Instance Collection for given instanceID
    var deleteRecord = function(instanceObj,callback){

        if(instanceObj.instanceid){
            instanceObj.instanceid = instanceObj.instanceid
        };
        var queryOBj = {
            instanceid :instanceObj.instanceid
        };

        var onCallback = function(err,result){
          if(err){
              return callback(err);
          }
            else{
              return callback(null,instanceObj);
          }
        };

        DalObj.delete(instanceCollectionName,instanceCollectionName,queryOBj,onCallback);
    };
    //deletes the DB which is allocated for the app
    var deleteDB = function(instanceObj,callback){
        //***************************** Single DB *****************
        //For using single DB. Comment the code of single DB usgae and uncomment the code below which works for mutiple DB
        var dbName = (req.params.id+uniqueID);

        //var dbInstnace = dbConnector.getDB();
        async.parallel({
            devices: function(callback) {
                var devicesCollection = (deviceCollectionName+dbName).toLowerCase();

                DalObj.dropCollection(devicesCollection,function(err,result){
                    if(err) {
                        callback(null,false);
                    }
                    else {
                        callback(null,result);
                    }

                });
            },
            settings: function(callback) {
                var settingsCollection = (settingsCollectionName+dbName).toLowerCase();
                DalObj.dropCollection(settingsCollection,function(err,result){
                    if(err) {
                        callback(null,false);
                    }
                    else {
                        callback(null,result);
                    }

                });
            },
            channels: function(callback) {

                var channelsCollection = (channelCollectionName+dbName).toLowerCase();
                DalObj.dropCollection(channelsCollection,function(err,result){
                    if(err) {
                        callback(null,false);
                    }
                    else {
                        callback(null,result);
                    }

                });
            },
            templates: function(callback) {
                var templatesCollection = (templateCollectionName+dbName).toLowerCase();
                DalObj.dropCollection(templatesCollection,function(err,result){
                    if(err) {
                        callback(null,false);
                    }
                    else {
                        callback(null,result);
                    }

                });
            }
        }, function(err, results) {
            // eg of results is now equals to: {devices: true, settings: true, channels: false, templates: true}
            return callback(null,true);
        });
        //***************************** End of Single DB ************

        //***************************** Multiple DB ************
        /* Usage of multiple DB
        var dbName = instanceObj.dbName;

        dbConnector.deleteDB(dbName, function (err) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, true);
            }
        });
        End of usgae of multiple DB */
        //***************************** End of Multiple DB ************
    };


    var finalCallback = function (err) {
        if (err) {
            response.send(400, {
                'description': err
            });
        }
        else {
            response.send(200, {
                'description': 'de-provision done '
            });

            next();
        }
    }
    async.waterfall([getInstanceDetails,deleteRecord,deleteDB], finalCallback);

    next();
});


// router for binding the service to an app when a cf bind-service is called
server.put('/v2/service_instances/:instance_id/service_bindings/:id', function (req, response, next) {


        //fetch the instanceDetails for the given instanceID
        var getInstanceDetails = function (callback) {

            var onCallback = function(err,result){
                if(err){
                    return callback(err);

                }
                else {
                    if(result.length){
                    if (result[0].bindedto) {
                        return callback({"error": "Instance is already bounded to another app"});
                    }
                        else {
                        return callback(null, result);
                    }
                }
                else{
                        return callback({"error": "Instance not found"});
                    }
                }
            };

            var queryOBj = {
                instanceid :req.params.instance_id
            };

            //var dbInstnace = dbConnector.getDB();
            DalObj.query(instanceCollectionName,instanceCollectionName,queryOBj, onCallback);
        };

        //setting environment variables for the template app
        var setEnvironmentVariables = function (instanceObj, callback) {
            try {
                var respData = {
                    "credentials": {
                        "apikey": instanceObj[0].apikey,
                        "correlationid" : instanceObj[0].correlationid,
                        "microservice_url": config["microservice_url"]
                    }
                };


                return callback(null, respData);
            }
            catch (err) {
                return callback(err);
            }
        };

        //checks whether the instance is already bounded
        // updates the bounded app guid for the given instance
        var updateBoundedApp = function(respData,callback){

            var onUpdate = function(err,result){
                if(err){
                    return callback(err);
                }
                else{
                    return callback(null,respData);
                }
            };

            var conditions = {
                    instanceid :req.params.instance_id
                };
            var update = {
                    bindedto : req.params.id
                };


            //var dbInstnace = dbConnector.getDB();
            DalObj.update(instanceCollectionName,instanceCollectionName,conditions,update,onUpdate);
        };

        var finalCallback = function (err, result) {
            if (err) {
                response.send(400, {
                    'description': err
                });
            }
            else {
                response.status(201);

                response.end(JSON.stringify(result));
                next();
            }
        };
       async.waterfall([getInstanceDetails, setEnvironmentVariables,updateBoundedApp], finalCallback);

    }
);

// router for unbinding the service from an app when a cf unbind-service is called
server.del('/v2/service_instances/:instance_id/service_bindings/:id', function (req, response, next) {



        // get instance details for the given instanceID
        var getInstanceDetails = function (callback) {
            var onCallback = function(err,result){
                if(err){
                    return callback(err);

                }
                else {
                    console.log("result    " + JSON.stringify(result));

                    if (result.length) {
                        if (!result[0].bindedto) {
                            return callback({"error": "app already unbounded"});
                        }
                        else{
                            return callback(null, result);
                        }

                    }
                    else{
                        return callback({"error": "Instance not found"});

                    }
                }

            };
               var queryOBj = {
                instanceid :req.params.instance_id
            };

            //var dbInstnace = dbConnector.getDB();
            DalObj.query(instanceCollectionName,instanceCollectionName,queryOBj, onCallback);
        };

        //updates bindedTo as null for the given instance ID
        var updateDB =function(instanceObj,callback){
          var updateInstance =   instanceObj[0];
             delete updateInstance.bindedto;
            updateInstance.bindedTo = null;
            var queryOBj = {
                instanceid :req.params.instance_id
            };
            var onCallback = function(err,result){
                if(err){

                    return callback(err);
                }
                else{

                    return callback(null,result);
                }
            }
            //var dbInstnace = dbConnector.getDB();
            DalObj.update(instanceCollectionName,instanceCollectionName,queryOBj,updateInstance,onCallback);
        };
        var finalCallback = function(err,result){
          if(err){
              response.send(400, {
                  'description': err
              });
          }
            else{

              response.send(200, {
                  'description': 'service un bind successfull'
              });

          }
        };
        //flow control is done here
        async.waterfall([getInstanceDetails,updateDB],finalCallback);

        next();
    }
);


// list services (Not in spec :-)
server.get('/v2/service_instances', function (request, response, next) {

    response.send(501, {
        'description': JSON.stringify(response)
    });
    next();
});

function apiVersionChecker(version) {
    var header = 'x-broker-api-version';
    return function (request, response, next) {
        if (request.headers[header]) {
            var pattern = new RegExp('^' + version.major + '\\.\\d+$');
            if (!request.headers[header].match(pattern)) {
                console.log('Incompatible services API version: ' + request.headers[header]);
                response.status(412);
                next(new restify.PreconditionFailedError('Incompatible services API version'));
            }
        } else {
            console.log(header + ' is missing from the request');
        }
        next();
    };
}

function authenticate(credentials) {
    return function (request, response, next) {
        if (credentials.authUser || credentials.authPassword) {
            if (!(request.authorization && request.authorization.basic && request.authorization.basic.username === credentials.authUser && request.authorization.basic.password === credentials.authPassword)) {
                response.status(401);
                response.setHeader('WWW-Authenticate', 'Basic "realm"="auth-service-broker"');
                next(new restify.InvalidCredentialsError('Invalid username or password'));
            } else {
                // authenticated!
            }
        } else {
            // no authentication required.
            next();
        }
        next();
    };
}


/** According to the spec, the JSON return message should include a description field. */
server.on('uncaughtException', function (req, res, route, err) {
    console.log(err, err.stack);
    //res.send(500, { 'code' : 500, 'description' : err.message});
});

checkConsistency();
var port = Number(process.env.VCAP_APP_PORT || 3000);

//connecting to DB with the DB configured
DalObj.initializeDal({},function(err) {
    if (err) {
        console.log('Error! Database connection failed : ', err);
    }
    else {
        server.listen(port, function () {
            console.log("Push Notification microservice is listening at port : " + port);
        });
    }
});



module.exports = server;

