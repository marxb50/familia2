#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "Franklândia disponível em http://localhost:8090/"
python3 -m http.server 8090
