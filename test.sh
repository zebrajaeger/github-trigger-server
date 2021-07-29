#!/bin/sh

curl -X POST -d 'repo=/foo/bar' -d 'sha=1234567890abc' -d 'key=1234' -d 'ref=/refs/master' 127.0.0.1:4444
