FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

COPY wrapper_script.sh wrapper_script.sh

RUN apk add --no-cache bash dos2unix
RUN dos2unix wrapper_script.sh
RUN chmod +x wrapper_script.sh

CMD ["./wrapper_script.sh"]