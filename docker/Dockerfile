FROM node:22.5.1-alpine

# アプリケーションディレクトリを作成する
WORKDIR /app

# アプリケーションの依存関係をインストール(lockも含む)
COPY package*.json ./

RUN npm install --omit=dev

# アプリケーションのソースをバンドルする（一部はコピーしない）
# COPY . .

# 開放するポート番号
EXPOSE 3000
CMD [ "npm", "start" ]
