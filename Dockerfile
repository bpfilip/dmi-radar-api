FROM node:17.2.0
WORKDIR /opt/radar
RUN apt update -y
RUN apt install -y hdf5-tools
COPY package.json package.json
RUN npm i
EXPOSE 8080
COPY . .
CMD ["node", "server.js"]