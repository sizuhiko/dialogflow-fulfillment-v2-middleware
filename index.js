/*!
 * dialogflow-fulfillment-v2-middleware
 * Copyright(c) 2018 Kenichiro Kishida
 * MIT Licensed
 */

'use strict'

const emitter = require('events').EventEmitter;
const nodeMocksHttp = require("node-mocks-http");
const UrlPattern = require('url-pattern');

/**
 * Module exports.
 * @public
 */
module.exports = {
  v2to1: v2to1,
  v1to2: v1to2
};

const v2ContextName = new UrlPattern('projects/(:projectId)/agent/sessions/(:sessionId)/contexts/(:contextId)');
const v2IntentName = new UrlPattern('projects/(:projectId)/agent/intents/(:intentId)');
const v2SessionName = new UrlPattern('projects/(:projectId)/agent/sessions/(:sessionId)')

/**
 * Create a middleware to convert dialogflow v1 json bodies from v2.
 *
 * @public
 * @return {Function} middleware
 */
function v2to1() {
  return (req, res, next) => {
    const v2req = req.body;
    const v1req = {
      id: v2req.responseId,
      result: {
        resolvedQuery: v2req.queryResult.queryText,
        action: v2req.queryResult.action,
        parameters: v2req.queryResult.parameters,
        contexts: v2req.queryResult.outputContexts.map(context => {
          return {
            name: v2ContextName.match(context.name).contextId || '',
            parameters: context.parameters || {},
            lifespan: context.lifespanCount || 0
          };
        }),
        metadata: {
          intentId: v2IntentName.match(v2req.queryResult.intent.name).intentId,
          intentName: v2req.queryResult.intent.displayName
        },
      },
      lang: v2req.queryResult.languageCode,
      originalRequest: {
        source: v2req.originalDetectIntentRequest.source,
        version: v2req.originalDetectIntentRequest.version,
        data: v2req.originalDetectIntentRequest.payload
      },
      sessionId: v2SessionName.match(v2req.session).sessionId
    };
    req.v2body = v2req;
    res.v2body = v2req;
    req.body = v1req;

    next();
  };
}

/**
 * Create a response to respond v1 bodies from v2 bodies to dialogflow.
 *
 * @public
 * @param {Object} response express response object with v2 bodies
 * @return {Object} express response object with v1 bodies
 */
function v1to2(response) {
  const v1response = nodeMocksHttp.createResponse({eventEmitter: emitter});
  const headers = {};
  // For express response
  // https://github.com/howardabrams/node-mocks-http/issues/143
  v1response['append'] = (header, value) => {
    headers[header] = value;
  };

  v1response.on('end', () => {
    headers['Content-Type'] = 'application/json;charset=UTF-8';
    const body = v1response._getData();
    const v2response = {
      fulfillmentText: body.speech,
      outputContexts: body.contextOut.map(context => {
        return {
          name: `${v1response.v2body.session}/contexts/${context.name}`,
          parameters: context.parameters,
          lifespanCount: context.lifespan
        };
      }),
      payload: body.data
    };
    response.set(headers);
    return response.status(v1response._getStatusCode()).send(v2response);
  });

  return v1response;
}
