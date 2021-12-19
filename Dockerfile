FROM node:17.2.0-alpine
WORKDIR /opt/radar
RUN apk add hdf5
COPY package.json package.json
RUN npm i
EXPOSE 8080
COPY . .
CMD ["node", "server.js"]