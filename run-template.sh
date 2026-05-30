#!/usr/bin/env bash
TEMPLATE=$1
cd templates/$TEMPLATE
python3 -m http.server 5500
