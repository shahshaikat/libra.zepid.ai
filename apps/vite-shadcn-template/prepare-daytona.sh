#!/bin/bash

function ping_server() {
	counter=0
	response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173")
	while [[ ${response} -ne 200 ]]; do
	  let counter++
	  if  (( counter % 20 == 0 )); then
        echo "Waiting for Daytona server to start..."
        sleep 0.1
      fi

	  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173")
	done
	echo "Daytona server is ready!"
}

cd /home/user/vite-shadcn-template-zepid

ping_server &

bun dev --host 0.0.0.0
