FROM node:12.22-slim
ENV NODE_ENV=production

WORKDIR /usr/app

COPY ["package.json", "package-lock.json*", "socket-func.js", "./"]

RUN npm install

CMD ["node", "socket-func.js"]
