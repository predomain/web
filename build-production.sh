#!/bin/sh
export NODE_OPTIONS="--max-old-space-size=8192"
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

alchemyKey="$(cat $DIR_PATH/src/dev-environments/alchemy-provider.conf)"
configuration="$(cat $DIR_PATH/src/dev-environments/environment.prod.ts)"
deployedConfiguration=${configuration//ALCHEMY_KEY/$alchemyKey}
rm $DIR_PATH/src/environments/*
echo $deployedConfiguration >> $DIR_PATH/src/environments/environment.ts;
echo $deployedConfiguration >> $DIR_PATH/src/environments/environment.prod.ts;

ng build --configuration=production --output-path=dist/web



