# PushNotification Service Broker
A  Cloud Foundry Service Broker, complying to version 2.4 of the interface specification. This will serve all the request 
for PushNotification services which is coming from the cloud controller. This service broker  is responsible for:
- Implementing a REST server to interface with the Cloud Controller
- Authenticating requests using HTTP basic auth
- Providing an interface to the data service itself for all provision/unprovision & bind/unbind events
- Maintaining a catalog of all available services and associated service plans

## Config
The catalog of services and plans is defined in the file config/auth-service-broker.json.
Hopefully, the configurations are fairly self explanatory. Most importantly, don't forget to change "authUser" and "authPassword" .
If you don't provide the authUser and authPassword , there will not be any security for the broker; and it would be accesible to anyone.

##  Creating PushNotification Broker App:

  1.	Clone the PushNotification Service broker 
  
  ```
    cd  Microservices/ServiceBrokers/PushNotificationBroker/
  ```
  
  ```  
    cf push PushNotificationBroker
  ```    
  An App “PushNotificationBroker” will be started based on the package.json  file. You can view the app using following command “cf apps”.
	   
  
  
##  Register the PushNotificationBroker app as service broker in cloud foundry

  1.	To create service broker in CF
  
  ```
    cf create-service-broker “<brokername>” <username> <pwd> <brokerapp url>	
  ```
  This username and password is the same as that which you have given in the config.json 
  
  2.	Get the service name from below command
  
  ```
    cf service-access
  ```
  3.	To get the service in marketplace
  
  ```
 	  cf enable-service-access “<servicename>”
 	  cf marketplace
 ```
 
##	Now to create PushNotification service instance

  To create single instance,

  ```
    cf create-service PushNotificationService free PushNotificationServiceInstance 
  ```

  
##	To bind the service to users app

  ```
    cf bind-service PushTemplateApp PushNotificationServiceInstance 
  ```
  
##    To un-bind the service from users app

 ```
    cf unbind-service PushTemplateApp PushNotificationServiceInstance 
 ```
 
  
## To delete the service instance

  ```
    cf delete-service PushNotificationServiceInstance
  ```


