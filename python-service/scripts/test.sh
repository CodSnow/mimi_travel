#!/bin/sh
set -eu

python3 -m compileall app migrations
