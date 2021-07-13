FROM node:14
COPY . /app
WORKDIR /app
RUN npm i
RUN npm run build
CMD npm start
EXPOSE 3000