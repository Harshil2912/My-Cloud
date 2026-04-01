'use strict';

// utils/idGenerator.js — UUIDv4 generation for file IDs, share tokens, etc.

const { v4: uuidv4 } = require('uuid');

module.exports = {
  newId:        () => uuidv4(),
  newShareToken:() => uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, ''),
};
