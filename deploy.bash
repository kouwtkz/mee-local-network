#!/bin/bash

rsync -e ssh -au rs:~/mee-local-network/data/ ./data/
rsync -e ssh -au --delete rs:~/mee-local-network/static/images/uploads/ ./static/images/uploads/
rsync -e ssh -au --delete ./dist/ rs:~/mee-local-network/dist/
rsync -e ssh -au --delete ./data/ rs:~/mee-local-network/data/
rsync -e ssh -au --delete ./static/ rs:~/mee-local-network/static/
rsync -e ssh --update --files-from=deploy_rsync_files.txt ./ rs:~/mee-local-network/
