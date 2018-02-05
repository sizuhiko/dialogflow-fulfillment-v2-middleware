# Dialogflow Fulfillment V2 Middleware

[Actions on Google NodeJS](https://github.com/actions-on-google/actions-on-google-nodejs) is only support Dialogflow V1 API.
But [Dialogflow Enterprise Edition](https://cloud.google.com/dialogflow-enterprise/) only use V2 API.

This middleware convert V1/V2 json format both request and response if use V2 API on dialogflow.

## Usage

```js
const { DialogflowApp } = require('actions-on-google');
const connect = require('connect');
const dialogflowV2 = require('./dialogflow-fulfillment-v2-middleware');

const actionMap = new Map();
actionMap.set('input.welcome', welcome);

const app = connect();
app.use(dialogflowV2.v2to1());
app.use((req, res) => {
   const dialogflow = new DialogflowApp({request: req, response: res});
   dialogflow.handleRequest(actionMap);
});

app(request, dialogflowV2.v1to2(response));
```

[connect](https://github.com/senchalabs/connect) is convinience usefull middleware layer without server.

## TODO

- Unit Test
- CI
