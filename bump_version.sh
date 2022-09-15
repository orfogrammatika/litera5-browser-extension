#!/bin/sh

function bump_json() {
  VER=$1
  FILE=$2

  mv ${FILE} ./temp.in.json
  sed -e "s/\"version\": \".*\"/\"version\": \"${VER}\"/" ./temp.in.json > ./temp.out.json
  mv ./temp.out.json ${FILE}
  rm ./temp.in.json
}

if [ $# -ne 1 ]
then
    echo "Please specify version number"
else
  bump_json $1 package.json
  bump_json $1 static/manifest.json
  bump_json $1 static/manifest.v2.json
fi


