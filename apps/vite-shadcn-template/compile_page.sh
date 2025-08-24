#!/bin/bash
#
# SPDX-License-Identifier: AGPL-3.0-only
# compile_page.sh
# Copyright (C) 2025 Nextify Limited
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
#
#


# This script runs during building the sandbox template
# and makes sure the Vite app is (1) running and (2) the `/` page is compiled
function ping_server() {
	counter=0
	response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173")
	while [[ ${response} -ne 200 ]]; do
	  let counter++
	  if  (( counter % 20 == 0 )); then
        echo "Waiting for server to start..."
        sleep 0.1
      fi

	  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173")
	done
}

ping_server &
cd /home/user/vite-shadcn-template-zepid && bun dev
