rsync -v -e ssh -a rs:~/mee-local-network/data/ ./data/
rsync -v -e ssh -a --delete rs:~/mee-local-network/static/images/uploads/ ./static/images/uploads/
