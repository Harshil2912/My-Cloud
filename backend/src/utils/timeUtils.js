'use strict';

// utils/timeUtils.js — Unix ms helpers, expiry calculation.

const nowMs = () => Date.now();
const nowSec = () => Math.floor(Date.now() / 1000);
const addDays = (ms, days) => ms + days * 86400_000;
const addHours = (ms, hours) => ms + hours * 3600_000;
const isExpired = (expiresAtMs) => Date.now() > expiresAtMs;
const toHttpDate = (ms) => new Date(ms).toUTCString();

module.exports = { nowMs, nowSec, addDays, addHours, isExpired, toHttpDate };
