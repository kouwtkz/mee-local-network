#!/bin/bash

echo "Upload to Raspberry pi Server…"
echo

SECONDS=0

rsync -v -e ssh -au rs:~/mee-local-network/data/ ./data/
rsync -v -e ssh -au --delete rs:~/mee-local-network/static/images/uploads/ ./static/images/uploads/
rsync -v -e ssh -au --delete ./dist/ rs:~/mee-local-network/dist/
# rsync -v -e ssh -au --delete ./data/ rs:~/mee-local-network/data/
rsync -v -e ssh -au --delete ./static/ rs:~/mee-local-network/static/
rsync -v -e ssh --update --files-from=deploy_rsync_files.txt ./ rs:~/mee-local-network/

time=$SECONDS

echo
echo "Total seconds: "$time"s"