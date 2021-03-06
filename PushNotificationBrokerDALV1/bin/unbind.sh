#!/bin/bash
USAGE="Usage: unbind.sh [-h service-broker-url]  -i instance-id -b binding-id"

HOST=127.0.0.1:5001

while getopts ":h:i:b:u:c:" opt; do
  case $opt in
    h)
	HOST=$OPTARG
	;;
    i)
	INSTANCE_ID=$OPTARG
      ;;
    b)
	BINDING_ID=$OPTARG
	;;
    u)
	SERVICE_BROKER_USERNAME=$OPTARG
	;;
    c)
	SERVICE_BROKER_PASSWORD=$OPTARG
	;;
    \?) 
      echo $USAGE >&2 
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

if [ -z "$INSTANCE_ID" ] ; then
	echo $USAGE >&2
	echo ERROR: missing service id >&2
	exit 1;
fi

if [ -z "$BINDING_ID" ] ; then
	echo $USAGE >&2
	echo ERROR: missing binding id >&2
	exit 1;
fi

if [ -z "$SERVICE_BROKER_USERNAME" -o -z "$SERVICE_BROKER_PASSWORD" ] ; then
	echo $USAGE >&2
	echo ERROR: missing SERVICE_BROKER_USERNAME or SERVICE_BROKER_PASSWORD >&2
	exit 1;
fi

curl -s -H 'x-broker-api-version: 2.4' http://$SERVICE_BROKER_USERNAME:$SERVICE_BROKER_PASSWORD@$HOST/v2/service_instances/$INSTANCE_ID/service_bindings/$BINDING_ID \
	 -H "Content-Type: application/json" \
	-X DELETE \
	--data '{
  "service_id":        "i do not care",
  "plan_id":           "i do not care",
  "app_guid": "app-guid-here"
}'
