"Upload to Raspberry pi Server…"
(Measure-Command {
    ubuntu run ("rsync -e ssh -au" + " rs:~/mee-local-network/data/ ./data/")
    ubuntu run ("rsync -e ssh -au --delete" + " rs:~/mee-local-network/static/images/uploads/ ./static/images/uploads/")
    ubuntu run ("rsync -e ssh -au --delete" + " ./dist/ rs:~/mee-local-network/dist/")
    ubuntu run ("rsync -e ssh -au --delete" + " ./data/ rs:~/mee-local-network/data/")
    ubuntu run ("rsync -e ssh -au --delete" + " ./static/ rs:~/mee-local-network/static/")
    ubuntu run ("rsync -e ssh --update --files-from=deploy_rsync_files.txt ./ rs:~/mee-local-network/")
}).TotalSeconds.ToString('0.0') + 's'
