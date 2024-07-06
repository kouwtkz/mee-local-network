"Upload to Raspberry pi Server…"
(Measure-Command {
    ubuntu run ("rsync -au -e ssh" + " ./data/ rs:~/mee-local-network/data/")
    ubuntu run ("rsync -au -e ssh --delete" + " rs:~/mee-local-network/static/images/uploads/ ./static/images/uploads/")
    ubuntu run ("rsync -au -e ssh --delete" + " --exclude='node_modules/' --exclude='data/' --exclude='static/images/uploads/'}" + " ./ rs:~/mee-local-network/")
}).TotalSeconds.ToString('0.0') + 's'
