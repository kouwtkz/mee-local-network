FROM node:20.9-alpine

# アプリケーションディレクトリを作成する
WORKDIR /app

# アプリケーションの依存関係をインストール(lockも含む)
COPY package*.json ./

RUN npm install --production

# アプリケーションのソースをバンドルする（一部はコピーしない）
# COPY . .

# 開放するポート番号
EXPOSE 80
CMD [ "npm", "start" ]
