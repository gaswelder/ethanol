#!/bin/sh

geth --datadir ./data --dev --dev.period 1 --rpc --verbosity 2 &
pid=$!

while [ `ls data | grep geth.ipc | wc -l` -eq '0' ]; do
    echo 'waiting for geth to start'
    sleep 1
done

yarn mocha tests -t 10000 --exit

kill $pid
wait $pid
