#!/bin/sh
export NODE_OPTIONS="--max-old-space-size=8192"
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

alchemyKey="$(cat $DIR_PATH/src/dev-environments/alchemy-provider.conf)"
configuration="$(cat $DIR_PATH/src/dev-environments/environment.test-main.ts)"
deployedConfiguration=${configuration//ALCHEMY_KEY/$alchemyKey}
rm $DIR_PATH/src/environments/*
echo $deployedConfiguration >> $DIR_PATH/src/environments/environment.ts;
echo $deployedConfiguration >> $DIR_PATH/src/environments/environment.test-main.ts;

cd $DIR_PATH
ng serve --configuration=test-main --host=0.0.0.0 --port=4200
