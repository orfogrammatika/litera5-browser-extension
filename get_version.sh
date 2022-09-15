#!/usr/bin/env bash

sed -rn 's/^.*"version": "(.*)".*$/\1/p' package.json