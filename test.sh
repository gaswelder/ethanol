#!/bin/sh

geth --datadir ./data --dev --dev.period 1 --rpc --verbosity 2 &
pid=$!

yarn run tap tests

kill $!
wait $!
