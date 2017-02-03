(function umd(require){
  if ('object' == typeof exports) {
    module.exports = require('1');
  } else if ('function' == typeof define && define.amd) {
    define(function(){ return require('1'); });
  } else {
    this['amplitude'] = require('1');
  }
})((function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
/* jshint expr:true */

var Amplitude = require('./amplitude');

var old = window.amplitude || {};
var newInstance = new Amplitude();
newInstance._q = old._q || [];
for (var instance in old._iq) { // migrate each instance's queue
  if (old._iq.hasOwnProperty(instance)) {
    newInstance.getInstance(instance)._q = old._iq[instance]._q || [];
  }
}

// export the instance
module.exports = newInstance;

}, {"./amplitude":2}],
2: [function(require, module, exports) {
var AmplitudeClient = require('./amplitude-client');
var Constants = require('./constants');
var Identify = require('./identify');
var object = require('object-component');
var Revenue = require('./revenue');
var type = require('./type');
var utils = require('./utils');
var version = require('./version');
var DEFAULT_OPTIONS = require('./options');

/**
 * Amplitude SDK API - instance manager.
 * Function calls directly on amplitude have been deprecated. Please call methods on the default shared instance: amplitude.getInstance() instead.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#300-update-and-logging-events-to-multiple-amplitude-apps} for more information about this change.
 * @constructor Amplitude
 * @public
 * @example var amplitude = new Amplitude();
 */
var Amplitude = function Amplitude() {
  this.options = object.merge({}, DEFAULT_OPTIONS);
  this._q = [];
  this._instances = {}; // mapping of instance names to instances
};

Amplitude.prototype.Identify = Identify;
Amplitude.prototype.Revenue = Revenue;

Amplitude.prototype.getInstance = function getInstance(instance) {
  instance = utils.isEmptyString(instance) ? Constants.DEFAULT_INSTANCE : instance.toLowerCase();
  var client = this._instances[instance];
  if (client === undefined) {
    client = new AmplitudeClient(instance);
    this._instances[instance] = client;
  }
  return client;
};

/**
 * Initializes the Amplitude Javascript SDK with your apiKey and any optional configurations.
 * This is required before any other methods can be called.
 * @public
 * @param {string} apiKey - The API key for your app.
 * @param {string} opt_userId - (optional) An identifier for this user.
 * @param {object} opt_config - (optional) Configuration options.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#configuration-options} for list of options and default values.
 * @param {function} opt_callback - (optional) Provide a callback function to run after initialization is complete.
 * @deprecated Please use amplitude.getInstance().init(apiKey, opt_userId, opt_config, opt_callback);
 * @example amplitude.init('API_KEY', 'USER_ID', {includeReferrer: true, includeUtm: true}, function() { alert('init complete'); });
 */
Amplitude.prototype.init = function init(apiKey, opt_userId, opt_config, opt_callback) {
  this.getInstance().init(apiKey, opt_userId, opt_config, function(instance) {
    // make options such as deviceId available for callback functions
    this.options = instance.options;
    if (type(opt_callback) === 'function') {
      opt_callback(instance);
    }
  }.bind(this));
};

/**
 * Run functions queued up by proxy loading snippet
 * @private
 */
Amplitude.prototype.runQueuedFunctions = function () {
  // run queued up old versions of functions
  for (var i = 0; i < this._q.length; i++) {
    var fn = this[this._q[i][0]];
    if (type(fn) === 'function') {
      fn.apply(this, this._q[i].slice(1));
    }
  }
  this._q = []; // clear function queue after running

  // run queued up functions on instances
  for (var instance in this._instances) {
    if (this._instances.hasOwnProperty(instance)) {
      this._instances[instance].runQueuedFunctions();
    }
  }
};

/**
 * Returns true if a new session was created during initialization, otherwise false.
 * @public
 * @return {boolean} Whether a new session was created during initialization.
 * @deprecated Please use amplitude.getInstance().isNewSession();
 */
Amplitude.prototype.isNewSession = function isNewSession() {
  return this.getInstance().isNewSession();
};

/**
 * Returns the id of the current session.
 * @public
 * @return {number} Id of the current session.
 * @deprecated Please use amplitude.getInstance().getSessionId();
 */
Amplitude.prototype.getSessionId = function getSessionId() {
  return this.getInstance().getSessionId();
};

/**
 * Increments the eventId and returns it.
 * @private
 */
Amplitude.prototype.nextEventId = function nextEventId() {
  return this.getInstance().nextEventId();
};

/**
 * Increments the identifyId and returns it.
 * @private
 */
Amplitude.prototype.nextIdentifyId = function nextIdentifyId() {
  return this.getInstance().nextIdentifyId();
};

/**
 * Increments the sequenceNumber and returns it.
 * @private
 */
Amplitude.prototype.nextSequenceNumber = function nextSequenceNumber() {
  return this.getInstance().nextSequenceNumber();
};

/**
 * Saves unsent events and identifies to localStorage. JSON stringifies event queues before saving.
 * Note: this is called automatically every time events are logged, unless you explicitly set option saveEvents to false.
 * @private
 */
Amplitude.prototype.saveEvents = function saveEvents() {
  this.getInstance().saveEvents();
};

/**
 * Sets a customer domain for the amplitude cookie. Useful if you want to support cross-subdomain tracking.
 * @public
 * @param {string} domain to set.
 * @deprecated Please use amplitude.getInstance().setDomain(domain);
 * @example amplitude.setDomain('.amplitude.com');
 */
Amplitude.prototype.setDomain = function setDomain(domain) {
  this.getInstance().setDomain(domain);
};

/**
 * Sets an identifier for the current user.
 * @public
 * @param {string} userId - identifier to set. Can be null.
 * @deprecated Please use amplitude.getInstance().setUserId(userId);
 * @example amplitude.setUserId('joe@gmail.com');
 */
Amplitude.prototype.setUserId = function setUserId(userId) {
  this.getInstance().setUserId(userId);
};

/**
 * Add user to a group or groups. You need to specify a groupType and groupName(s).
 * For example you can group people by their organization.
 * In that case groupType is "orgId" and groupName would be the actual ID(s).
 * groupName can be a string or an array of strings to indicate a user in multiple gruups.
 * You can also call setGroup multiple times with different groupTypes to track multiple types of groups (up to 5 per app).
 * Note: this will also set groupType: groupName as a user property.
 * See the [SDK Readme]{@link https://github.com/amplitude/Amplitude-Javascript#setting-groups} for more information.
 * @public
 * @param {string} groupType - the group type (ex: orgId)
 * @param {string|list} groupName - the name of the group (ex: 15), or a list of names of the groups
 * @deprecated Please use amplitude.getInstance().setGroup(groupType, groupName);
 * @example amplitude.setGroup('orgId', 15); // this adds the current user to orgId 15.
 */
Amplitude.prototype.setGroup = function(groupType, groupName) {
  this.getInstance().setGroup(groupType, groupName);
};

/**
 * Sets whether to opt current user out of tracking.
 * @public
 * @param {boolean} enable - if true then no events will be logged or sent.
 * @deprecated Please use amplitude.getInstance().setOptOut(enable);
 * @example: amplitude.setOptOut(true);
 */
Amplitude.prototype.setOptOut = function setOptOut(enable) {
  this.getInstance().setOptOut(enable);
};

/**
  * Regenerates a new random deviceId for current user. Note: this is not recommended unless you know what you
  * are doing. This can be used in conjunction with `setUserId(null)` to anonymize users after they log out.
  * With a null userId and a completely new deviceId, the current user would appear as a brand new user in dashboard.
  * This uses src/uuid.js to regenerate the deviceId.
  * @public
  * @deprecated Please use amplitude.getInstance().regenerateDeviceId();
  */
Amplitude.prototype.regenerateDeviceId = function regenerateDeviceId() {
  this.getInstance().regenerateDeviceId();
};

/**
  * Sets a custom deviceId for current user. Note: this is not recommended unless you know what you are doing
  * (like if you have your own system for managing deviceIds). Make sure the deviceId you set is sufficiently unique
  * (we recommend something like a UUID - see src/uuid.js for an example of how to generate) to prevent conflicts with other devices in our system.
  * @public
  * @param {string} deviceId - custom deviceId for current user.
  * @deprecated Please use amplitude.getInstance().setDeviceId(deviceId);
  * @example amplitude.setDeviceId('45f0954f-eb79-4463-ac8a-233a6f45a8f0');
  */
Amplitude.prototype.setDeviceId = function setDeviceId(deviceId) {
  this.getInstance().setDeviceId(deviceId);
};

/**
 * Sets user properties for the current user.
 * @public
 * @param {object} - object with string keys and values for the user properties to set.
 * @param {boolean} - DEPRECATED opt_replace: in earlier versions of the JS SDK the user properties object was kept in
 * memory and replace = true would replace the object in memory. Now the properties are no longer stored in memory, so replace is deprecated.
 * @deprecated Please use amplitude.getInstance.setUserProperties(userProperties);
 * @example amplitude.setUserProperties({'gender': 'female', 'sign_up_complete': true})
 */
Amplitude.prototype.setUserProperties = function setUserProperties(userProperties) {
  this.getInstance().setUserProperties(userProperties);
};

/**
 * Clear all of the user properties for the current user. Note: clearing user properties is irreversible!
 * @public
 * @deprecated Please use amplitude.getInstance().clearUserProperties();
 * @example amplitude.clearUserProperties();
 */
Amplitude.prototype.clearUserProperties = function clearUserProperties(){
  this.getInstance().clearUserProperties();
};

/**
 * Send an identify call containing user property operations to Amplitude servers.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#user-properties-and-user-property-operations}
 * for more information on the Identify API and user property operations.
 * @param {Identify} identify_obj - the Identify object containing the user property operations to send.
 * @param {Amplitude~eventCallback} opt_callback - (optional) callback function to run when the identify event has been sent.
 * Note: the server response code and response body from the identify event upload are passed to the callback function.
 * @deprecated Please use amplitude.getInstance().identify(identify);
 * @example
 * var identify = new amplitude.Identify().set('colors', ['rose', 'gold']).add('karma', 1).setOnce('sign_up_date', '2016-03-31');
 * amplitude.identify(identify);
 */
Amplitude.prototype.identify = function(identify_obj, opt_callback) {
  this.getInstance().identify(identify_obj, opt_callback);
};

/**
 * Set a versionName for your application.
 * @public
 * @param {string} versionName - The version to set for your application.
 * @deprecated Please use amplitude.getInstance().setVersionName(versionName);
 * @example amplitude.setVersionName('1.12.3');
 */
Amplitude.prototype.setVersionName = function setVersionName(versionName) {
  this.getInstance().setVersionName(versionName);
};

/**
 * This is the callback for logEvent and identify calls. It gets called after the event/identify is uploaded,
 * and the server response code and response body from the upload request are passed to the callback function.
 * @callback Amplitude~eventCallback
 * @param {number} responseCode - Server response code for the event / identify upload request.
 * @param {string} responseBody - Server response body for the event / identify upload request.
 */

/**
 * Log an event with eventType and eventProperties
 * @public
 * @param {string} eventType - name of event
 * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
 * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
 * Note: the server response code and response body from the event upload are passed to the callback function.
 * @deprecated Please use amplitude.getInstance().logEvent(eventType, eventProperties, opt_callback);
 * @example amplitude.logEvent('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15});
 */
Amplitude.prototype.logEvent = function logEvent(eventType, eventProperties, opt_callback) {
  return this.getInstance().logEvent(eventType, eventProperties, opt_callback);
};

/**
 * Log an event with eventType, eventProperties, and groups. Use this to set event-level groups.
 * Note: the group(s) set only apply for the specific event type being logged and does not persist on the user
 * (unless you explicitly set it with setGroup).
 * See the [SDK Readme]{@link https://github.com/amplitude/Amplitude-Javascript#setting-groups} for more information
 * about groups and Count by Distinct on the Amplitude platform.
 * @public
 * @param {string} eventType - name of event
 * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
 * @param {object} groups - (optional) an object with string groupType: groupName values for the event being logged.
 * groupName can be a string or an array of strings.
 * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
 * Note: the server response code and response body from the event upload are passed to the callback function.
 * Deprecated Please use amplitude.getInstance().logEventWithGroups(eventType, eventProperties, groups, opt_callback);
 * @example amplitude.logEventWithGroups('Clicked Button', null, {'orgId': 24});
 */
Amplitude.prototype.logEventWithGroups = function(eventType, eventProperties, groups, opt_callback) {
  return this.getInstance().logEventWithGroups(eventType, eventProperties, groups, opt_callback);
};

/**
 * Log revenue with Revenue interface. The new revenue interface allows for more revenue fields like
 * revenueType and event properties.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#tracking-revenue}
 * for more information on the Revenue interface and logging revenue.
 * @public
 * @param {Revenue} revenue_obj - the revenue object containing the revenue data being logged.
 * @deprecated Please use amplitude.getInstance().logRevenueV2(revenue_obj);
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
 * amplitude.logRevenueV2(revenue);
 */
Amplitude.prototype.logRevenueV2 = function logRevenueV2(revenue_obj) {
  return this.getInstance().logRevenueV2(revenue_obj);
};

/**
 * Log revenue event with a price, quantity, and product identifier. DEPRECATED - use logRevenueV2
 * @public
 * @param {number} price - price of revenue event
 * @param {number} quantity - (optional) quantity of products in revenue event. If no quantity specified default to 1.
 * @param {string} product - (optional) product identifier
 * @deprecated Please use amplitude.getInstance().logRevenueV2(revenue_obj);
 * @example amplitude.logRevenue(3.99, 1, 'product_1234');
 */
Amplitude.prototype.logRevenue = function logRevenue(price, quantity, product) {
  return this.getInstance().logRevenue(price, quantity, product);
};

/**
 * Remove events in storage with event ids up to and including maxEventId.
 * @private
 */
Amplitude.prototype.removeEvents = function removeEvents(maxEventId, maxIdentifyId) {
  this.getInstance().removeEvents(maxEventId, maxIdentifyId);
};

/**
 * Send unsent events. Note: this is called automatically after events are logged if option batchEvents is false.
 * If batchEvents is true, then events are only sent when batch criterias are met.
 * @private
 * @param {Amplitude~eventCallback} callback - (optional) callback to run after events are sent.
 * Note the server response code and response body are passed to the callback as input arguments.
 */
Amplitude.prototype.sendEvents = function sendEvents(callback) {
  this.getInstance().sendEvents(callback);
};

/**
 * Set global user properties. Note this is deprecated, and we recommend using setUserProperties
 * @public
 * @deprecated
 */
Amplitude.prototype.setGlobalUserProperties = function setGlobalUserProperties(userProperties) {
  this.getInstance().setUserProperties(userProperties);
};

/**
 * Get the current version of Amplitude's Javascript SDK.
 * @public
 * @returns {number} version number
 * @example var amplitudeVersion = amplitude.__VERSION__;
 */
Amplitude.prototype.__VERSION__ = version;

module.exports = Amplitude;

}, {"./amplitude-client":3,"./constants":4,"./identify":5,"./revenue":6,"./type":7,"./utils":8,"./version":9,"./options":10}],
3: [function(require, module, exports) {
var Constants = require('./constants');
var cookieStorage = require('./cookiestorage');
var getUtmData = require('./utm');
var Identify = require('./identify');
var localStorage = require('./localstorage');  // jshint ignore:line
var md5 = require('blueimp-md5');
var object = require('object-component');
var Request = require('./xhr');
var Revenue = require('./revenue');
var type = require('./type');
var UAParser = require('ua-parser-js');
var utils = require('./utils');
var UUID = require('./uuid');
var version = require('./version');
var DEFAULT_OPTIONS = require('./options');

/**
 * AmplitudeClient SDK API - instance constructor.
 * The Amplitude class handles creation of client instances, all you need to do is call amplitude.getInstance()
 * @constructor AmplitudeClient
 * @public
 * @example var amplitudeClient = new AmplitudeClient();
 */
var AmplitudeClient = function AmplitudeClient(instanceName) {
  this._instanceName = utils.isEmptyString(instanceName) ? Constants.DEFAULT_INSTANCE : instanceName.toLowerCase();
  this._storageSuffix = this._instanceName === Constants.DEFAULT_INSTANCE ? '' : '_' + this._instanceName;
  this._unsentEvents = [];
  this._unsentIdentifys = [];
  this._ua = new UAParser(navigator.userAgent).getResult();
  this.options = object.merge({}, DEFAULT_OPTIONS);
  this.cookieStorage = new cookieStorage().getStorage();
  this._q = []; // queue for proxied functions before script load
  this._sending = false;
  this._updateScheduled = false;

  // event meta data
  this._eventId = 0;
  this._identifyId = 0;
  this._lastEventTime = null;
  this._newSession = false;
  this._sequenceNumber = 0;
  this._sessionId = null;

  this._userAgent = (navigator && navigator.userAgent) || null;
};

AmplitudeClient.prototype.Identify = Identify;
AmplitudeClient.prototype.Revenue = Revenue;

/**
 * Initializes the Amplitude Javascript SDK with your apiKey and any optional configurations.
 * This is required before any other methods can be called.
 * @public
 * @param {string} apiKey - The API key for your app.
 * @param {string} opt_userId - (optional) An identifier for this user.
 * @param {object} opt_config - (optional) Configuration options.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#configuration-options} for list of options and default values.
 * @param {function} opt_callback - (optional) Provide a callback function to run after initialization is complete.
 * @example amplitudeClient.init('API_KEY', 'USER_ID', {includeReferrer: true, includeUtm: true}, function() { alert('init complete'); });
 */
AmplitudeClient.prototype.init = function init(apiKey, opt_userId, opt_config, opt_callback) {
  if (type(apiKey) !== 'string' || utils.isEmptyString(apiKey)) {
    utils.log('Invalid apiKey. Please re-initialize with a valid apiKey');
    return;
  }

  try {
    this.options.apiKey = apiKey;
    _parseConfig(this.options, opt_config);
    this.cookieStorage.options({
      expirationDays: this.options.cookieExpiration,
      domain: this.options.domain
    });
    this.options.domain = this.cookieStorage.options().domain;

    if (this._instanceName === Constants.DEFAULT_INSTANCE) {
      _upgradeCookeData(this);
    }
    _loadCookieData(this);

    // load deviceId and userId from input, or try to fetch existing value from cookie
    this.options.deviceId = (type(opt_config) === 'object' && type(opt_config.deviceId) === 'string' &&
        !utils.isEmptyString(opt_config.deviceId) && opt_config.deviceId) ||
        (this.options.deviceIdFromUrlParam && this._getDeviceIdFromUrlParam(this._getUrlParams())) ||
        this.options.deviceId || UUID() + 'R';
    this.options.userId = (type(opt_userId) === 'string' && !utils.isEmptyString(opt_userId) && opt_userId) ||
        this.options.userId || null;

    // load unsent events and identifies before any attempt to log new ones
    if (this.options.saveEvents) {
      this._unsentEvents = this._loadSavedUnsentEvents(this.options.unsentKey);
      this._unsentIdentifys = this._loadSavedUnsentEvents(this.options.unsentIdentifyKey);

      // validate event properties for unsent events
      for (var i = 0; i < this._unsentEvents.length; i++) {
        var eventProperties = this._unsentEvents[i].event_properties;
        var groups = this._unsentEvents[i].groups;
        this._unsentEvents[i].event_properties = utils.validateProperties(eventProperties);
        this._unsentEvents[i].groups = utils.validateGroups(groups);
      }

      // validate user properties for unsent identifys
      for (var j = 0; j < this._unsentIdentifys.length; j++) {
        var userProperties = this._unsentIdentifys[j].user_properties;
        var identifyGroups = this._unsentIdentifys[j].groups;
        this._unsentIdentifys[j].user_properties = utils.validateProperties(userProperties);
        this._unsentIdentifys[j].groups = utils.validateGroups(identifyGroups);
      }
    }

    var now = new Date().getTime();
    if (!this._sessionId || !this._lastEventTime || now - this._lastEventTime > this.options.sessionTimeout) {
      this._newSession = true;
      this._sessionId = now;

      // only capture UTM params and referrer if new session
      if (this.options.saveParamsReferrerOncePerSession) {
        this._trackParamsAndReferrer();
      }
    }

    if (!this.options.saveParamsReferrerOncePerSession) {
      this._trackParamsAndReferrer();
    }

    this._lastEventTime = now;
    _saveCookieData(this);

    this._sendEventsIfReady(); // try sending unsent events
  } catch (e) {
    utils.log(e);
  } finally {
    if (type(opt_callback) === 'function') {
      opt_callback(this);
    }
  }
};

/**
 * @private
 */
AmplitudeClient.prototype._trackParamsAndReferrer = function _trackParamsAndReferrer() {
  if (this.options.includeUtm) {
    this._initUtmData();
  }
  if (this.options.includeReferrer) {
    this._saveReferrer(this._getReferrer());
  }
  if (this.options.includeGclid) {
    this._saveGclid(this._getUrlParams());
  }
};

/**
 * Parse and validate user specified config values and overwrite existing option value
 * DEFAULT_OPTIONS provides list of all config keys that are modifiable, as well as expected types for values
 * @private
 */
var _parseConfig = function _parseConfig(options, config) {
  if (type(config) !== 'object') {
    return;
  }

  // validates config value is defined, is the correct type, and some additional value sanity checks
  var parseValidateAndLoad = function parseValidateAndLoad(key) {
    if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
      return;  // skip bogus config values
    }

    var inputValue = config[key];
    var expectedType = type(DEFAULT_OPTIONS[key]);
    if (!utils.validateInput(inputValue, key + ' option', expectedType)) {
      return;
    }
    if (expectedType === 'boolean') {
      options[key] = !!inputValue;
    } else if ((expectedType === 'string' && !utils.isEmptyString(inputValue)) ||
        (expectedType === 'number' && inputValue > 0)) {
      options[key] = inputValue;
    }
   };

   for (var key in config) {
    if (config.hasOwnProperty(key)) {
      parseValidateAndLoad(key);
    }
   }
};

/**
 * Run functions queued up by proxy loading snippet
 * @private
 */
AmplitudeClient.prototype.runQueuedFunctions = function () {
  for (var i = 0; i < this._q.length; i++) {
    var fn = this[this._q[i][0]];
    if (type(fn) === 'function') {
      fn.apply(this, this._q[i].slice(1));
    }
  }
  this._q = []; // clear function queue after running
};

/**
 * Check that the apiKey is set before calling a function. Logs a warning message if not set.
 * @private
 */
AmplitudeClient.prototype._apiKeySet = function _apiKeySet(methodName) {
  if (utils.isEmptyString(this.options.apiKey)) {
    utils.log('Invalid apiKey. Please set a valid apiKey with init() before calling ' + methodName);
    return false;
  }
  return true;
};

/**
 * Load saved events from localStorage. JSON deserializes event array. Handles case where string is corrupted.
 * @private
 */
AmplitudeClient.prototype._loadSavedUnsentEvents = function _loadSavedUnsentEvents(unsentKey) {
  var savedUnsentEventsString = this._getFromStorage(localStorage, unsentKey);
  if (utils.isEmptyString(savedUnsentEventsString)) {
    return []; // new app, does not have any saved events
  }

  if (type(savedUnsentEventsString) === 'string') {
    try {
      var events = JSON.parse(savedUnsentEventsString);
      if (type(events) === 'array') { // handle case where JSON dumping of unsent events is corrupted
        return events;
      }
    } catch (e) {}
  }
  utils.log('Unable to load ' + unsentKey + ' events. Restart with a new empty queue.');
  return [];
};

/**
 * Returns true if a new session was created during initialization, otherwise false.
 * @public
 * @return {boolean} Whether a new session was created during initialization.
 */
AmplitudeClient.prototype.isNewSession = function isNewSession() {
  return this._newSession;
};

/**
 * Returns the id of the current session.
 * @public
 * @return {number} Id of the current session.
 */
AmplitudeClient.prototype.getSessionId = function getSessionId() {
  return this._sessionId;
};

/**
 * Increments the eventId and returns it.
 * @private
 */
AmplitudeClient.prototype.nextEventId = function nextEventId() {
  this._eventId++;
  return this._eventId;
};

/**
 * Increments the identifyId and returns it.
 * @private
 */
AmplitudeClient.prototype.nextIdentifyId = function nextIdentifyId() {
  this._identifyId++;
  return this._identifyId;
};

/**
 * Increments the sequenceNumber and returns it.
 * @private
 */
AmplitudeClient.prototype.nextSequenceNumber = function nextSequenceNumber() {
  this._sequenceNumber++;
  return this._sequenceNumber;
};

/**
 * Returns the total count of unsent events and identifys
 * @private
 */
AmplitudeClient.prototype._unsentCount = function _unsentCount() {
  return this._unsentEvents.length + this._unsentIdentifys.length;
};

/**
 * Send events if ready. Returns true if events are sent.
 * @private
 */
AmplitudeClient.prototype._sendEventsIfReady = function _sendEventsIfReady(callback) {
  if (this._unsentCount() === 0) {
    return false;
  }

  // if batching disabled, send any unsent events immediately
  if (!this.options.batchEvents) {
    this.sendEvents(callback);
    return true;
  }

  // if batching enabled, check if min threshold met for batch size
  if (this._unsentCount() >= this.options.eventUploadThreshold) {
    this.sendEvents(callback);
    return true;
  }

  // otherwise schedule an upload after 30s
  if (!this._updateScheduled) {  // make sure we only schedule 1 upload
    this._updateScheduled = true;
    setTimeout(function() {
        this._updateScheduled = false;
        this.sendEvents();
      }.bind(this), this.options.eventUploadPeriodMillis
    );
  }

  return false; // an upload was scheduled, no events were uploaded
};

/**
 * Helper function to fetch values from storage
 * Storage argument allows for localStoraoge and sessionStoraoge
 * @private
 */
AmplitudeClient.prototype._getFromStorage = function _getFromStorage(storage, key) {
  return storage.getItem(key + this._storageSuffix);
};

/**
 * Helper function to set values in storage
 * Storage argument allows for localStoraoge and sessionStoraoge
 * @private
 */
AmplitudeClient.prototype._setInStorage = function _setInStorage(storage, key, value) {
  storage.setItem(key + this._storageSuffix, value);
};

/**
 * cookieData (deviceId, userId, optOut, sessionId, lastEventTime, eventId, identifyId, sequenceNumber)
 * can be stored in many different places (localStorage, cookie, etc).
 * Need to unify all sources into one place with a one-time upgrade/migration.
 * @private
 */
var _upgradeCookeData = function _upgradeCookeData(scope) {
  // skip if migration already happened
  var cookieData = scope.cookieStorage.get(scope.options.cookieName);
  if (type(cookieData) === 'object' && cookieData.deviceId && cookieData.sessionId && cookieData.lastEventTime) {
    return;
  }

  var _getAndRemoveFromLocalStorage = function _getAndRemoveFromLocalStorage(key) {
    var value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value;
  };

  // in v2.6.0, deviceId, userId, optOut was migrated to localStorage with keys + first 6 char of apiKey
  var apiKeySuffix = (type(scope.options.apiKey) === 'string' && ('_' + scope.options.apiKey.slice(0, 6))) || '';
  var localStorageDeviceId = _getAndRemoveFromLocalStorage(Constants.DEVICE_ID + apiKeySuffix);
  var localStorageUserId = _getAndRemoveFromLocalStorage(Constants.USER_ID + apiKeySuffix);
  var localStorageOptOut = _getAndRemoveFromLocalStorage(Constants.OPT_OUT + apiKeySuffix);
  if (localStorageOptOut !== null && localStorageOptOut !== undefined) {
    localStorageOptOut = String(localStorageOptOut) === 'true'; // convert to boolean
  }

  // pre-v2.7.0 event and session meta-data was stored in localStorage. move to cookie for sub-domain support
  var localStorageSessionId = parseInt(_getAndRemoveFromLocalStorage(Constants.SESSION_ID));
  var localStorageLastEventTime = parseInt(_getAndRemoveFromLocalStorage(Constants.LAST_EVENT_TIME));
  var localStorageEventId = parseInt(_getAndRemoveFromLocalStorage(Constants.LAST_EVENT_ID));
  var localStorageIdentifyId = parseInt(_getAndRemoveFromLocalStorage(Constants.LAST_IDENTIFY_ID));
  var localStorageSequenceNumber = parseInt(_getAndRemoveFromLocalStorage(Constants.LAST_SEQUENCE_NUMBER));

  var _getFromCookie = function _getFromCookie(key) {
    return type(cookieData) === 'object' && cookieData[key];
  };
  scope.options.deviceId = _getFromCookie('deviceId') || localStorageDeviceId;
  scope.options.userId = _getFromCookie('userId') || localStorageUserId;
  scope._sessionId = _getFromCookie('sessionId') || localStorageSessionId || scope._sessionId;
  scope._lastEventTime = _getFromCookie('lastEventTime') || localStorageLastEventTime || scope._lastEventTime;
  scope._eventId = _getFromCookie('eventId') || localStorageEventId || scope._eventId;
  scope._identifyId = _getFromCookie('identifyId') || localStorageIdentifyId || scope._identifyId;
  scope._sequenceNumber = _getFromCookie('sequenceNumber') || localStorageSequenceNumber || scope._sequenceNumber;

  // optOut is a little trickier since it is a boolean
  scope.options.optOut = localStorageOptOut || false;
  if (cookieData && cookieData.optOut !== undefined && cookieData.optOut !== null) {
    scope.options.optOut = String(cookieData.optOut) === 'true';
  }

  _saveCookieData(scope);
};

/**
 * Fetches deviceId, userId, event meta data from amplitude cookie
 * @private
 */
var _loadCookieData = function _loadCookieData(scope) {
  var cookieData = scope.cookieStorage.get(scope.options.cookieName + scope._storageSuffix);
  if (type(cookieData) === 'object') {
    if (cookieData.deviceId) {
      scope.options.deviceId = cookieData.deviceId;
    }
    if (cookieData.userId) {
      scope.options.userId = cookieData.userId;
    }
    if (cookieData.optOut !== null && cookieData.optOut !== undefined) {
      scope.options.optOut = cookieData.optOut;
    }
    if (cookieData.sessionId) {
      scope._sessionId = parseInt(cookieData.sessionId);
    }
    if (cookieData.lastEventTime) {
      scope._lastEventTime = parseInt(cookieData.lastEventTime);
    }
    if (cookieData.eventId) {
      scope._eventId = parseInt(cookieData.eventId);
    }
    if (cookieData.identifyId) {
      scope._identifyId = parseInt(cookieData.identifyId);
    }
    if (cookieData.sequenceNumber) {
      scope._sequenceNumber = parseInt(cookieData.sequenceNumber);
    }
  }
};

/**
 * Saves deviceId, userId, event meta data to amplitude cookie
 * @private
 */
var _saveCookieData = function _saveCookieData(scope) {
  scope.cookieStorage.set(scope.options.cookieName + scope._storageSuffix, {
    deviceId: scope.options.deviceId,
    userId: scope.options.userId,
    optOut: scope.options.optOut,
    sessionId: scope._sessionId,
    lastEventTime: scope._lastEventTime,
    eventId: scope._eventId,
    identifyId: scope._identifyId,
    sequenceNumber: scope._sequenceNumber
  });
};

/**
 * Parse the utm properties out of cookies and query for adding to user properties.
 * @private
 */
AmplitudeClient.prototype._initUtmData = function _initUtmData(queryParams, cookieParams) {
  queryParams = queryParams || this._getUrlParams();
  cookieParams = cookieParams || this.cookieStorage.get('__utmz');
  var utmProperties = getUtmData(cookieParams, queryParams);
  _sendParamsReferrerUserProperties(this, utmProperties);
};

/**
 * The calling function should determine when it is appropriate to send these user properties. This function
 * will no longer contain any session storage checking logic.
 * @private
 */
var _sendParamsReferrerUserProperties = function _sendParamsReferrerUserProperties(scope, userProperties) {
  if (type(userProperties) !== 'object' || Object.keys(userProperties).length === 0) {
    return;
  }

  // setOnce the initial user properties
  var identify = new Identify();
  for (var key in userProperties) {
    if (userProperties.hasOwnProperty(key)) {
      identify.setOnce('initial_' + key, userProperties[key]);
      identify.set(key, userProperties[key]);
    }
  }

  scope.identify(identify);
};

/**
 * @private
 */
AmplitudeClient.prototype._getReferrer = function _getReferrer() {
  return document.referrer;
};

/**
 * @private
 */
AmplitudeClient.prototype._getUrlParams = function _getUrlParams() {
  return location.search;
};

/**
 * Try to fetch Google Gclid from url params.
 * @private
 */
AmplitudeClient.prototype._saveGclid = function _saveGclid(urlParams) {
  var gclid = utils.getQueryParam('gclid', urlParams);
  if (utils.isEmptyString(gclid)) {
    return;
  }
  var gclidProperties = {'gclid': gclid};
  _sendParamsReferrerUserProperties(this, gclidProperties);
};

/**
 * Try to fetch Amplitude device id from url params.
 * @private
 */
AmplitudeClient.prototype._getDeviceIdFromUrlParam = function _getDeviceIdFromUrlParam(urlParams) {
  return utils.getQueryParam(Constants.AMP_DEVICE_ID_PARAM, urlParams);
};

/**
 * Parse the domain from referrer info
 * @private
 */
AmplitudeClient.prototype._getReferringDomain = function _getReferringDomain(referrer) {
  if (utils.isEmptyString(referrer)) {
    return null;
  }
  var parts = referrer.split('/');
  if (parts.length >= 3) {
    return parts[2];
  }
  return null;
};

/**
 * Fetch the referrer information, parse the domain and send.
 * Since user properties are propagated on the server, only send once per session, don't need to send with every event
 * @private
 */
AmplitudeClient.prototype._saveReferrer = function _saveReferrer(referrer) {
  if (utils.isEmptyString(referrer)) {
    return;
  }
  var referrerInfo = {
    'referrer': referrer,
    'referring_domain': this._getReferringDomain(referrer)
  };
  _sendParamsReferrerUserProperties(this, referrerInfo);
};

/**
 * Saves unsent events and identifies to localStorage. JSON stringifies event queues before saving.
 * Note: this is called automatically every time events are logged, unless you explicitly set option saveEvents to false.
 * @private
 */
AmplitudeClient.prototype.saveEvents = function saveEvents() {
  try {
    this._setInStorage(localStorage, this.options.unsentKey, JSON.stringify(this._unsentEvents));
  } catch (e) {}

  try {
    this._setInStorage(localStorage, this.options.unsentIdentifyKey, JSON.stringify(this._unsentIdentifys));
  } catch (e) {}
};

/**
 * Sets a customer domain for the amplitude cookie. Useful if you want to support cross-subdomain tracking.
 * @public
 * @param {string} domain to set.
 * @example amplitudeClient.setDomain('.amplitude.com');
 */
AmplitudeClient.prototype.setDomain = function setDomain(domain) {
  if (!utils.validateInput(domain, 'domain', 'string')) {
    return;
  }

  try {
    this.cookieStorage.options({
      domain: domain
    });
    this.options.domain = this.cookieStorage.options().domain;
    _loadCookieData(this);
    _saveCookieData(this);
  } catch (e) {
    utils.log(e);
  }
};

/**
 * Sets an identifier for the current user.
 * @public
 * @param {string} userId - identifier to set. Can be null.
 * @example amplitudeClient.setUserId('joe@gmail.com');
 */
AmplitudeClient.prototype.setUserId = function setUserId(userId) {
  try {
    this.options.userId = (userId !== undefined && userId !== null && ('' + userId)) || null;
    _saveCookieData(this);
  } catch (e) {
    utils.log(e);
  }
};

/**
 * Add user to a group or groups. You need to specify a groupType and groupName(s).
 * For example you can group people by their organization.
 * In that case groupType is "orgId" and groupName would be the actual ID(s).
 * groupName can be a string or an array of strings to indicate a user in multiple gruups.
 * You can also call setGroup multiple times with different groupTypes to track multiple types of groups (up to 5 per app).
 * Note: this will also set groupType: groupName as a user property.
 * See the [SDK Readme]{@link https://github.com/amplitude/Amplitude-Javascript#setting-groups} for more information.
 * @public
 * @param {string} groupType - the group type (ex: orgId)
 * @param {string|list} groupName - the name of the group (ex: 15), or a list of names of the groups
 * @example amplitudeClient.setGroup('orgId', 15); // this adds the current user to orgId 15.
 */
AmplitudeClient.prototype.setGroup = function(groupType, groupName) {
  if (!this._apiKeySet('setGroup()') || !utils.validateInput(groupType, 'groupType', 'string') ||
        utils.isEmptyString(groupType)) {
    return;
  }

  var groups = {};
  groups[groupType] = groupName;
  var identify = new Identify().set(groupType, groupName);
  this._logEvent(Constants.IDENTIFY_EVENT, null, null, identify.userPropertiesOperations, groups, null, null);
};

/**
 * Sets whether to opt current user out of tracking.
 * @public
 * @param {boolean} enable - if true then no events will be logged or sent.
 * @example: amplitude.setOptOut(true);
 */
AmplitudeClient.prototype.setOptOut = function setOptOut(enable) {
  if (!utils.validateInput(enable, 'enable', 'boolean')) {
    return;
  }

  try {
    this.options.optOut = enable;
    _saveCookieData(this);
  } catch (e) {
    utils.log(e);
  }
};

/**
  * Regenerates a new random deviceId for current user. Note: this is not recommended unless you know what you
  * are doing. This can be used in conjunction with `setUserId(null)` to anonymize users after they log out.
  * With a null userId and a completely new deviceId, the current user would appear as a brand new user in dashboard.
  * This uses src/uuid.js to regenerate the deviceId.
  * @public
  */
AmplitudeClient.prototype.regenerateDeviceId = function regenerateDeviceId() {
  this.setDeviceId(UUID() + 'R');
};

/**
  * Sets a custom deviceId for current user. Note: this is not recommended unless you know what you are doing
  * (like if you have your own system for managing deviceIds). Make sure the deviceId you set is sufficiently unique
  * (we recommend something like a UUID - see src/uuid.js for an example of how to generate) to prevent conflicts with other devices in our system.
  * @public
  * @param {string} deviceId - custom deviceId for current user.
  * @example amplitudeClient.setDeviceId('45f0954f-eb79-4463-ac8a-233a6f45a8f0');
  */
AmplitudeClient.prototype.setDeviceId = function setDeviceId(deviceId) {
  if (!utils.validateInput(deviceId, 'deviceId', 'string')) {
    return;
  }

  try {
    if (!utils.isEmptyString(deviceId)) {
      this.options.deviceId = ('' + deviceId);
      _saveCookieData(this);
    }
  } catch (e) {
    utils.log(e);
  }
};

/**
 * Sets user properties for the current user.
 * @public
 * @param {object} - object with string keys and values for the user properties to set.
 * @param {boolean} - DEPRECATED opt_replace: in earlier versions of the JS SDK the user properties object was kept in
 * memory and replace = true would replace the object in memory. Now the properties are no longer stored in memory, so replace is deprecated.
 * @example amplitudeClient.setUserProperties({'gender': 'female', 'sign_up_complete': true})
 */
AmplitudeClient.prototype.setUserProperties = function setUserProperties(userProperties) {
  if (!this._apiKeySet('setUserProperties()') || !utils.validateInput(userProperties, 'userProperties', 'object')) {
    return;
  }
  // sanitize the userProperties dict before converting into identify
  var sanitized = utils.truncate(utils.validateProperties(userProperties));
  if (Object.keys(sanitized).length === 0) {
    return;
  }

  // convert userProperties into an identify call
  var identify = new Identify();
  for (var property in sanitized) {
    if (sanitized.hasOwnProperty(property)) {
      identify.set(property, sanitized[property]);
    }
  }
  this.identify(identify);
};

/**
 * Clear all of the user properties for the current user. Note: clearing user properties is irreversible!
 * @public
 * @example amplitudeClient.clearUserProperties();
 */
AmplitudeClient.prototype.clearUserProperties = function clearUserProperties(){
  if (!this._apiKeySet('clearUserProperties()')) {
    return;
  }

  var identify = new Identify();
  identify.clearAll();
  this.identify(identify);
};

/**
 * Applies the proxied functions on the proxied object to an instance of the real object.
 * Used to convert proxied Identify and Revenue objects.
 * @private
 */
var _convertProxyObjectToRealObject = function _convertProxyObjectToRealObject(instance, proxy) {
  for (var i = 0; i < proxy._q.length; i++) {
    var fn = instance[proxy._q[i][0]];
    if (type(fn) === 'function') {
      fn.apply(instance, proxy._q[i].slice(1));
    }
  }
  return instance;
};

/**
 * Send an identify call containing user property operations to Amplitude servers.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#user-properties-and-user-property-operations}
 * for more information on the Identify API and user property operations.
 * @param {Identify} identify_obj - the Identify object containing the user property operations to send.
 * @param {Amplitude~eventCallback} opt_callback - (optional) callback function to run when the identify event has been sent.
 * Note: the server response code and response body from the identify event upload are passed to the callback function.
 * @example
 * var identify = new amplitude.Identify().set('colors', ['rose', 'gold']).add('karma', 1).setOnce('sign_up_date', '2016-03-31');
 * amplitude.identify(identify);
 */
AmplitudeClient.prototype.identify = function(identify_obj, opt_callback) {
  if (!this._apiKeySet('identify()')) {
    if (type(opt_callback) === 'function') {
      opt_callback(0, 'No request sent');
    }
    return;
  }

  // if identify input is a proxied object created by the async loading snippet, convert it into an identify object
  if (type(identify_obj) === 'object' && identify_obj.hasOwnProperty('_q')) {
    identify_obj = _convertProxyObjectToRealObject(new Identify(), identify_obj);
  }

  if (identify_obj instanceof Identify) {
    // only send if there are operations
    if (Object.keys(identify_obj.userPropertiesOperations).length > 0) {
      return this._logEvent(
        Constants.IDENTIFY_EVENT, null, null, identify_obj.userPropertiesOperations, null, null, opt_callback
        );
    }
  } else {
    utils.log('Invalid identify input type. Expected Identify object but saw ' + type(identify_obj));
  }

  if (type(opt_callback) === 'function') {
    opt_callback(0, 'No request sent');
  }
};

/**
 * Set a versionName for your application.
 * @public
 * @param {string} versionName - The version to set for your application.
 * @example amplitudeClient.setVersionName('1.12.3');
 */
AmplitudeClient.prototype.setVersionName = function setVersionName(versionName) {
  if (!utils.validateInput(versionName, 'versionName', 'string')) {
    return;
  }
  this.options.versionName = versionName;
};

/**
 * Private logEvent method. Keeps apiProperties from being publicly exposed.
 * @private
 */
AmplitudeClient.prototype._logEvent = function _logEvent(eventType, eventProperties, apiProperties, userProperties, groups, timestamp, callback) {
  _loadCookieData(this); // reload cookie before each log event to sync event meta-data between windows and tabs
  if (!eventType || this.options.optOut) {
    if (type(callback) === 'function') {
      callback(0, 'No request sent');
    }
    return;
  }

  try {
    var eventId;
    if (eventType === Constants.IDENTIFY_EVENT) {
      eventId = this.nextIdentifyId();
    } else {
      eventId = this.nextEventId();
    }
    var sequenceNumber = this.nextSequenceNumber();
    var eventTime = (type(timestamp) === 'number') ? timestamp : new Date().getTime();
    if (!this._sessionId || !this._lastEventTime || eventTime - this._lastEventTime > this.options.sessionTimeout) {
      this._sessionId = eventTime;
    }
    this._lastEventTime = eventTime;
    _saveCookieData(this);

    userProperties = userProperties || {};
    apiProperties = apiProperties || {};
    eventProperties = eventProperties || {};
    groups = groups || {};
    var event = {
      device_id: this.options.deviceId,
      user_id: this.options.userId,
      timestamp: eventTime,
      event_id: eventId,
      session_id: this._sessionId || -1,
      event_type: eventType,
      version_name: this.options.versionName || null,
      platform: this.options.platform,
      os_name: this._ua.browser.name || null,
      os_version: this._ua.browser.major || null,
      device_model: this._ua.os.name || null,
      language: this.options.language,
      api_properties: apiProperties,
      event_properties: utils.truncate(utils.validateProperties(eventProperties)),
      user_properties: utils.truncate(utils.validateProperties(userProperties)),
      uuid: UUID(),
      library: {
        name: 'amplitude-js',
        version: version
      },
      sequence_number: sequenceNumber, // for ordering events and identifys
      groups: utils.truncate(utils.validateGroups(groups)),
      user_agent: this._userAgent
      // country: null
    };

    if (eventType === Constants.IDENTIFY_EVENT) {
      this._unsentIdentifys.push(event);
      this._limitEventsQueued(this._unsentIdentifys);
    } else {
      this._unsentEvents.push(event);
      this._limitEventsQueued(this._unsentEvents);
    }

    if (this.options.saveEvents) {
      this.saveEvents();
    }

    if (!this._sendEventsIfReady(callback) && type(callback) === 'function') {
      callback(0, 'No request sent');
    }

    return eventId;
  } catch (e) {
    utils.log(e);
  }
};

/**
 * Remove old events from the beginning of the array if too many have accumulated. Default limit is 1000 events.
 * @private
 */
AmplitudeClient.prototype._limitEventsQueued = function _limitEventsQueued(queue) {
  if (queue.length > this.options.savedMaxCount) {
    queue.splice(0, queue.length - this.options.savedMaxCount);
  }
};

/**
 * This is the callback for logEvent and identify calls. It gets called after the event/identify is uploaded,
 * and the server response code and response body from the upload request are passed to the callback function.
 * @callback Amplitude~eventCallback
 * @param {number} responseCode - Server response code for the event / identify upload request.
 * @param {string} responseBody - Server response body for the event / identify upload request.
 */

/**
 * Log an event with eventType and eventProperties
 * @public
 * @param {string} eventType - name of event
 * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
 * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
 * Note: the server response code and response body from the event upload are passed to the callback function.
 * @example amplitudeClient.logEvent('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15});
 */
AmplitudeClient.prototype.logEvent = function logEvent(eventType, eventProperties, opt_callback) {
  return this.logEventWithTimestamp(eventType, eventProperties, null, opt_callback);
};

/**
 * Log an event with eventType and eventProperties and a custom timestamp
 * @public
 * @param {string} eventType - name of event
 * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
 * @param {number} timesatmp - (optional) the custom timestamp as milliseconds since epoch.
 * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
 * Note: the server response code and response body from the event upload are passed to the callback function.
 * @example amplitudeClient.logEvent('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15});
 */
AmplitudeClient.prototype.logEventWithTimestamp = function logEvent(eventType, eventProperties, timestamp, opt_callback) {
  if (!this._apiKeySet('logEvent()') || !utils.validateInput(eventType, 'eventType', 'string') ||
        utils.isEmptyString(eventType)) {
    if (type(opt_callback) === 'function') {
      opt_callback(0, 'No request sent');
    }
    return -1;
  }
  return this._logEvent(eventType, eventProperties, null, null, null, timestamp, opt_callback);
};

/**
 * Log an event with eventType, eventProperties, and groups. Use this to set event-level groups.
 * Note: the group(s) set only apply for the specific event type being logged and does not persist on the user
 * (unless you explicitly set it with setGroup).
 * See the [SDK Readme]{@link https://github.com/amplitude/Amplitude-Javascript#setting-groups} for more information
 * about groups and Count by Distinct on the Amplitude platform.
 * @public
 * @param {string} eventType - name of event
 * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
 * @param {object} groups - (optional) an object with string groupType: groupName values for the event being logged.
 * groupName can be a string or an array of strings.
 * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
 * Note: the server response code and response body from the event upload are passed to the callback function.
 * @example amplitudeClient.logEventWithGroups('Clicked Button', null, {'orgId': 24});
 */
AmplitudeClient.prototype.logEventWithGroups = function(eventType, eventProperties, groups, opt_callback) {
  if (!this._apiKeySet('logEventWithGroup()') ||
        !utils.validateInput(eventType, 'eventType', 'string')) {
    if (type(opt_callback) === 'function') {
      opt_callback(0, 'No request sent');
    }
    return -1;
  }
  return this._logEvent(eventType, eventProperties, null, null, groups, null, opt_callback);
};

/**
 * Test that n is a number or a numeric value.
 * @private
 */
var _isNumber = function _isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
 * Log revenue with Revenue interface. The new revenue interface allows for more revenue fields like
 * revenueType and event properties.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#tracking-revenue}
 * for more information on the Revenue interface and logging revenue.
 * @public
 * @param {Revenue} revenue_obj - the revenue object containing the revenue data being logged.
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
 * amplitude.logRevenueV2(revenue);
 */
AmplitudeClient.prototype.logRevenueV2 = function logRevenueV2(revenue_obj) {
  if (!this._apiKeySet('logRevenueV2()')) {
    return;
  }

  // if revenue input is a proxied object created by the async loading snippet, convert it into an revenue object
  if (type(revenue_obj) === 'object' && revenue_obj.hasOwnProperty('_q')) {
    revenue_obj = _convertProxyObjectToRealObject(new Revenue(), revenue_obj);
  }

  if (revenue_obj instanceof Revenue) {
    // only send if revenue is valid
    if (revenue_obj && revenue_obj._isValidRevenue()) {
      return this.logEvent(Constants.REVENUE_EVENT, revenue_obj._toJSONObject());
    }
  } else {
    utils.log('Invalid revenue input type. Expected Revenue object but saw ' + type(revenue_obj));
  }
};

/**
 * Log revenue event with a price, quantity, and product identifier. DEPRECATED - use logRevenueV2
 * @public
 * @deprecated
 * @param {number} price - price of revenue event
 * @param {number} quantity - (optional) quantity of products in revenue event. If no quantity specified default to 1.
 * @param {string} product - (optional) product identifier
 * @example amplitudeClient.logRevenue(3.99, 1, 'product_1234');
 */
AmplitudeClient.prototype.logRevenue = function logRevenue(price, quantity, product) {
  // Test that the parameters are of the right type.
  if (!this._apiKeySet('logRevenue()') || !_isNumber(price) || (quantity !== undefined && !_isNumber(quantity))) {
    // utils.log('Price and quantity arguments to logRevenue must be numbers');
    return -1;
  }

  return this._logEvent(Constants.REVENUE_EVENT, {}, {
    productId: product,
    special: 'revenue_amount',
    quantity: quantity || 1,
    price: price
  }, null, null, null, null);
};

/**
 * Remove events in storage with event ids up to and including maxEventId.
 * @private
 */
AmplitudeClient.prototype.removeEvents = function removeEvents(maxEventId, maxIdentifyId) {
  _removeEvents(this, '_unsentEvents', maxEventId);
  _removeEvents(this, '_unsentIdentifys', maxIdentifyId);
};

/**
 * Helper function to remove events up to maxId from a single queue.
 * Does a true filter in case events get out of order or old events are removed.
 * @private
 */
var _removeEvents = function _removeEvents(scope, eventQueue, maxId) {
  if (maxId < 0) {
    return;
  }

  var filteredEvents = [];
  for (var i = 0; i < scope[eventQueue].length || 0; i++) {
    if (scope[eventQueue][i].event_id > maxId) {
      filteredEvents.push(scope[eventQueue][i]);
    }
  }
  scope[eventQueue] = filteredEvents;
};

/**
 * Send unsent events. Note: this is called automatically after events are logged if option batchEvents is false.
 * If batchEvents is true, then events are only sent when batch criterias are met.
 * @private
 * @param {Amplitude~eventCallback} callback - (optional) callback to run after events are sent.
 * Note the server response code and response body are passed to the callback as input arguments.
 */
AmplitudeClient.prototype.sendEvents = function sendEvents(callback) {
  if (!this._apiKeySet('sendEvents()') || this._sending || this.options.optOut || this._unsentCount() === 0) {
    if (type(callback) === 'function') {
      callback(0, 'No request sent');
    }
    return;
  }

  this._sending = true;
  var protocol = this.options.forceHttps ? 'https' : ('https:' === window.location.protocol ? 'https' : 'http');
  var url = protocol + '://' + this.options.apiEndpoint + '/';

  // fetch events to send
  var numEvents = Math.min(this._unsentCount(), this.options.uploadBatchSize);
  var mergedEvents = this._mergeEventsAndIdentifys(numEvents);
  var maxEventId = mergedEvents.maxEventId;
  var maxIdentifyId = mergedEvents.maxIdentifyId;
  var events = JSON.stringify(mergedEvents.eventsToSend);
  var uploadTime = new Date().getTime();

  var data = {
    client: this.options.apiKey,
    e: events,
    v: Constants.API_VERSION,
    upload_time: uploadTime,
    checksum: md5(Constants.API_VERSION + this.options.apiKey + events + uploadTime)
  };

  var scope = this;
  new Request(url, data).send(function(status, response) {
    scope._sending = false;
    try {
      if (status === 200) {
        scope.removeEvents(maxEventId, maxIdentifyId);

        // Update the event cache after the removal of sent events.
        if (scope.options.saveEvents) {
          scope.saveEvents();
        }

        // Send more events if any queued during previous send.
        if (!scope._sendEventsIfReady(callback) && type(callback) === 'function') {
          callback(status, response);
        }

      // handle payload too large
      } else if (status === 413) {
        // utils.log('request too large');
        // Can't even get this one massive event through. Drop it, even if it is an identify.
        if (scope.options.uploadBatchSize === 1) {
          scope.removeEvents(maxEventId, maxIdentifyId);
        }

        // The server complained about the length of the request. Backoff and try again.
        scope.options.uploadBatchSize = Math.ceil(numEvents / 2);
        scope.sendEvents(callback);

      } else if (type(callback) === 'function') { // If server turns something like a 400
        callback(status, response);
      }
    } catch (e) {
      // utils.log('failed upload');
    }
  });
};

/**
 * Merge unsent events and identifys together in sequential order based on their sequence number, for uploading.
 * @private
 */
AmplitudeClient.prototype._mergeEventsAndIdentifys = function _mergeEventsAndIdentifys(numEvents) {
  // coalesce events from both queues
  var eventsToSend = [];
  var eventIndex = 0;
  var maxEventId = -1;
  var identifyIndex = 0;
  var maxIdentifyId = -1;

  while (eventsToSend.length < numEvents) {
    var event;
    var noIdentifys = identifyIndex >= this._unsentIdentifys.length;
    var noEvents = eventIndex >= this._unsentEvents.length;

    // case 0: no events or identifys left
    // note this should not happen, this means we have less events and identifys than expected
    if (noEvents && noIdentifys) {
      utils.log('Merging Events and Identifys, less events and identifys than expected');
      break;
    }

    // case 1: no identifys - grab from events
    else if (noIdentifys) {
      event = this._unsentEvents[eventIndex++];
      maxEventId = event.event_id;

    // case 2: no events - grab from identifys
    } else if (noEvents) {
      event = this._unsentIdentifys[identifyIndex++];
      maxIdentifyId = event.event_id;

    // case 3: need to compare sequence numbers
    } else {
      // events logged before v2.5.0 won't have a sequence number, put those first
      if (!('sequence_number' in this._unsentEvents[eventIndex]) ||
          this._unsentEvents[eventIndex].sequence_number <
          this._unsentIdentifys[identifyIndex].sequence_number) {
        event = this._unsentEvents[eventIndex++];
        maxEventId = event.event_id;
      } else {
        event = this._unsentIdentifys[identifyIndex++];
        maxIdentifyId = event.event_id;
      }
    }

    eventsToSend.push(event);
  }

  return {
    eventsToSend: eventsToSend,
    maxEventId: maxEventId,
    maxIdentifyId: maxIdentifyId
  };
};

/**
 * Set global user properties. Note this is deprecated, and we recommend using setUserProperties
 * @public
 * @deprecated
 */
AmplitudeClient.prototype.setGlobalUserProperties = function setGlobalUserProperties(userProperties) {
  this.setUserProperties(userProperties);
};

/**
 * Get the current version of Amplitude's Javascript SDK.
 * @public
 * @returns {number} version number
 * @example var amplitudeVersion = amplitude.__VERSION__;
 */
AmplitudeClient.prototype.__VERSION__ = version;

module.exports = AmplitudeClient;

}, {"./constants":4,"./cookiestorage":11,"./utm":12,"./identify":5,"./localstorage":13,"./xhr":14,"./revenue":6,"./type":7,"./utils":8,"./uuid":15,"./version":9,"./options":10}],
4: [function(require, module, exports) {
module.exports = {
  DEFAULT_INSTANCE: '$default_instance',
  API_VERSION: 2,
  MAX_STRING_LENGTH: 4096,
  MAX_PROPERTY_KEYS: 1000,
  IDENTIFY_EVENT: '$identify',

  // localStorageKeys
  LAST_EVENT_ID: 'amplitude_lastEventId',
  LAST_EVENT_TIME: 'amplitude_lastEventTime',
  LAST_IDENTIFY_ID: 'amplitude_lastIdentifyId',
  LAST_SEQUENCE_NUMBER: 'amplitude_lastSequenceNumber',
  SESSION_ID: 'amplitude_sessionId',

  // Used in cookie as well
  DEVICE_ID: 'amplitude_deviceId',
  OPT_OUT: 'amplitude_optOut',
  USER_ID: 'amplitude_userId',

  COOKIE_TEST: 'amplitude_cookie_test',

  // revenue keys
  REVENUE_EVENT: 'revenue_amount',
  REVENUE_PRODUCT_ID: '$productId',
  REVENUE_QUANTITY: '$quantity',
  REVENUE_PRICE: '$price',
  REVENUE_REVENUE_TYPE: '$revenueType',

  AMP_DEVICE_ID_PARAM: 'amp_device_id'  // url param
};

}, {}],
11: [function(require, module, exports) {
/* jshint -W020, unused: false, noempty: false, boss: true */

/*
 * Abstraction layer for cookie storage.
 * Uses cookie if available, otherwise fallback to localstorage.
 */

var Constants = require('./constants');
var Cookie = require('./cookie');
var localStorage = require('./localstorage'); // jshint ignore:line

var cookieStorage = function() {
  this.storage = null;
};

// test that cookies are enabled - navigator.cookiesEnabled yields false positives in IE, need to test directly
cookieStorage.prototype._cookiesEnabled = function() {
  var uid = String(new Date());
  var result;
  try {
    Cookie.set(Constants.COOKIE_TEST, uid);
    result = Cookie.get(Constants.COOKIE_TEST) === uid;
    Cookie.remove(Constants.COOKIE_TEST);
    return result;
  } catch (e) {
    // cookies are not enabled
  }
  return false;
};

cookieStorage.prototype.getStorage = function() {
  if (this.storage !== null) {
    return this.storage;
  }

  if (this._cookiesEnabled()) {
    this.storage = Cookie;
  } else {
    // if cookies disabled, fallback to localstorage
    // note: localstorage does not persist across subdomains
    var keyPrefix = 'amp_cookiestore_';
    this.storage = {
      _options: {
        expirationDays: undefined,
        domain: undefined
      },
      reset: function() {
        this._options = {
          expirationDays: undefined,
          domain: undefined
        };
      },
      options: function(opts) {
        if (arguments.length === 0) {
          return this._options;
        }
        opts = opts || {};
        this._options.expirationDays = opts.expirationDays || this._options.expirationDays;
        // localStorage is specific to subdomains
        this._options.domain = opts.domain || this._options.domain || window.location.hostname;
        return this._options;
      },
      get: function(name) {
        try {
          return JSON.parse(localStorage.getItem(keyPrefix + name));
        } catch (e) {
        }
        return null;
      },
      set: function(name, value) {
        try {
          localStorage.setItem(keyPrefix + name, JSON.stringify(value));
          return true;
        } catch (e) {
        }
        return false;
      },
      remove: function(name) {
        try {
          localStorage.removeItem(keyPrefix + name);
        } catch (e) {
          return false;
        }
      }
    };
  }

  return this.storage;
};

module.exports = cookieStorage;

}, {"./constants":4,"./cookie":16,"./localstorage":13}],
16: [function(require, module, exports) {
/*
 * Cookie data
 */

var Base64 = require('./base64');
var topDomain = require('top-domain');
var utils = require('./utils');


var _options = {
  expirationDays: undefined,
  domain: undefined
};


var reset = function() {
  _options = {
    expirationDays: undefined,
    domain: undefined
  };
};


var options = function(opts) {
  if (arguments.length === 0) {
    return _options;
  }

  opts = opts || {};

  _options.expirationDays = opts.expirationDays;

  var domain = (!utils.isEmptyString(opts.domain)) ? opts.domain : '.' + topDomain(window.location.href);
  var token = Math.random();
  _options.domain = domain;
  set('amplitude_test', token);
  var stored = get('amplitude_test');
  if (!stored || stored !== token) {
    domain = null;
  }
  remove('amplitude_test');
  _options.domain = domain;
};

var _domainSpecific = function(name) {
  // differentiate between cookies on different domains
  var suffix = '';
  if (_options.domain) {
    suffix = _options.domain.charAt(0) === '.' ? _options.domain.substring(1) : _options.domain;
  }
  return name + suffix;
};


var get = function(name) {
  try {
    var nameEq = _domainSpecific(name) + '=';
    var ca = document.cookie.split(';');
    var value = null;
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEq) === 0) {
        value = c.substring(nameEq.length, c.length);
        break;
      }
    }

    if (value) {
      return JSON.parse(Base64.decode(value));
    }
    return null;
  } catch (e) {
    return null;
  }
};


var set = function(name, value) {
  try {
    _set(_domainSpecific(name), Base64.encode(JSON.stringify(value)), _options);
    return true;
  } catch (e) {
    return false;
  }
};


var _set = function(name, value, opts) {
  var expires = value !== null ? opts.expirationDays : -1 ;
  if (expires) {
    var date = new Date();
    date.setTime(date.getTime() + (expires * 24 * 60 * 60 * 1000));
    expires = date;
  }
  var str = name + '=' + value;
  if (expires) {
    str += '; expires=' + expires.toUTCString();
  }
  str += '; path=/';
  if (opts.domain) {
    str += '; domain=' + opts.domain;
  }
  document.cookie = str;
};


var remove = function(name) {
  try {
    _set(_domainSpecific(name), null, _options);
    return true;
  } catch (e) {
    return false;
  }
};


module.exports = {
  reset: reset,
  options: options,
  get: get,
  set: set,
  remove: remove

};

}, {"./base64":17,"./utils":8}],
17: [function(require, module, exports) {
/* jshint bitwise: false */
/* global escape, unescape */

var UTF8 = require('./utf8');

/*
 * Base64 encoder/decoder
 * http://www.webtoolkit.info/
 */
var Base64 = {
    _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    encode: function (input) {
        try {
            if (window.btoa && window.atob) {
                return window.btoa(unescape(encodeURIComponent(input)));
            }
        } catch (e) {
            //log(e);
        }
        return Base64._encode(input);
    },

    _encode: function (input) {
        var output = '';
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = UTF8.encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
            Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
        }
        return output;
    },

    decode: function (input) {
        try {
            if (window.btoa && window.atob) {
                return decodeURIComponent(escape(window.atob(input)));
            }
        } catch (e) {
            //log(e);
        }
        return Base64._decode(input);
    },

    _decode: function (input) {
        var output = '';
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        while (i < input.length) {
            enc1 = Base64._keyStr.indexOf(input.charAt(i++));
            enc2 = Base64._keyStr.indexOf(input.charAt(i++));
            enc3 = Base64._keyStr.indexOf(input.charAt(i++));
            enc4 = Base64._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = UTF8.decode(output);
        return output;
    }
};

module.exports = Base64;

}, {"./utf8":18}],
18: [function(require, module, exports) {
/* jshint bitwise: false */

/*
 * UTF-8 encoder/decoder
 * http://www.webtoolkit.info/
 */
var UTF8 = {
    encode: function (s) {
        var utftext = '';

        for (var n = 0; n < s.length; n++) {
            var c = s.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },

    decode: function (utftext) {
        var s = '';
        var i = 0;
        var c = 0, c1 = 0, c2 = 0;

        while ( i < utftext.length ) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                s += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c1 = utftext.charCodeAt(i+1);
                s += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                i += 2;
            }
            else {
                c1 = utftext.charCodeAt(i+1);
                c2 = utftext.charCodeAt(i+2);
                s += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
                i += 3;
            }
        }
        return s;
    }
};

module.exports = UTF8;

}, {}],
8: [function(require, module, exports) {
var constants = require('./constants');
var type = require('./type');

var log = function log(s) {
  try {
    console.log('[Amplitude] ' + s);
  } catch (e) {
    // console logging not available
  }
};

var isEmptyString = function isEmptyString(str) {
  return (!str || str.length === 0);
};

var sessionStorageEnabled = function sessionStorageEnabled() {
  try {
    if (window.sessionStorage) {
      return true;
    }
  } catch (e) {} // sessionStorage disabled
  return false;
};

// truncate string values in event and user properties so that request size does not get too large
var truncate = function truncate(value) {
  if (type(value) === 'array') {
    for (var i = 0; i < value.length; i++) {
      value[i] = truncate(value[i]);
    }
  } else if (type(value) === 'object') {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        value[key] = truncate(value[key]);
      }
    }
  } else {
    value = _truncateValue(value);
  }

  return value;
};

var _truncateValue = function _truncateValue(value) {
  if (type(value) === 'string') {
    return value.length > constants.MAX_STRING_LENGTH ? value.substring(0, constants.MAX_STRING_LENGTH) : value;
  }
  return value;
};

var validateInput = function validateInput(input, name, expectedType) {
  if (type(input) !== expectedType) {
    log('Invalid ' + name + ' input type. Expected ' + expectedType + ' but received ' + type(input));
    return false;
  }
  return true;
};

// do some basic sanitization and type checking, also catch property dicts with more than 1000 key/value pairs
var validateProperties = function validateProperties(properties) {
  var propsType = type(properties);
  if (propsType !== 'object') {
    log('Error: invalid properties format. Expecting Javascript object, received ' + propsType + ', ignoring');
    return {};
  }

  if (Object.keys(properties).length > constants.MAX_PROPERTY_KEYS) {
    log('Error: too many properties (more than 1000), ignoring');
    return {};
  }

  var copy = {}; // create a copy with all of the valid properties
  for (var property in properties) {
    if (!properties.hasOwnProperty(property)) {
      continue;
    }

    // validate key
    var key = property;
    var keyType = type(key);
    if (keyType !== 'string') {
      key = String(key);
      log('WARNING: Non-string property key, received type ' + keyType + ', coercing to string "' + key + '"');
    }

    // validate value
    var value = validatePropertyValue(key, properties[property]);
    if (value === null) {
      continue;
    }
    copy[key] = value;
  }
  return copy;
};

var invalidValueTypes = [
  'null', 'nan', 'undefined', 'function', 'arguments', 'regexp', 'element'
];

var validatePropertyValue = function validatePropertyValue(key, value) {
  var valueType = type(value);
  if (invalidValueTypes.indexOf(valueType) !== -1) {
    log('WARNING: Property key "' + key + '" with invalid value type ' + valueType + ', ignoring');
    value = null;
  } else if (valueType === 'error') {
    value = String(value);
    log('WARNING: Property key "' + key + '" with value type error, coercing to ' + value);
  } else if (valueType === 'array') {
    // check for nested arrays or objects
    var arrayCopy = [];
    for (var i = 0; i < value.length; i++) {
      var element = value[i];
      var elemType = type(element);
      if (elemType === 'array' || elemType === 'object') {
        log('WARNING: Cannot have ' + elemType + ' nested in an array property value, skipping');
        continue;
      }
      arrayCopy.push(validatePropertyValue(key, element));
    }
    value = arrayCopy;
  } else if (valueType === 'object') {
    value = validateProperties(value);
  }
  return value;
};

var validateGroups = function validateGroups(groups) {
  var groupsType = type(groups);
  if (groupsType !== 'object') {
    log('Error: invalid groups format. Expecting Javascript object, received ' + groupsType + ', ignoring');
    return {};
  }

  var copy = {}; // create a copy with all of the valid properties
  for (var group in groups) {
    if (!groups.hasOwnProperty(group)) {
      continue;
    }

    // validate key
    var key = group;
    var keyType = type(key);
    if (keyType !== 'string') {
      key = String(key);
      log('WARNING: Non-string groupType, received type ' + keyType + ', coercing to string "' + key + '"');
    }

    // validate value
    var value = validateGroupName(key, groups[group]);
    if (value === null) {
      continue;
    }
    copy[key] = value;
  }
  return copy;
};

var validateGroupName = function validateGroupName(key, groupName) {
  var groupNameType = type(groupName);
  if (groupNameType === 'string') {
    return groupName;
  }
  if (groupNameType === 'date' || groupNameType === 'number' || groupNameType === 'boolean') {
    groupName = String(groupName);
    log('WARNING: Non-string groupName, received type ' + groupNameType + ', coercing to string "' + groupName + '"');
    return groupName;
  }
  if (groupNameType === 'array') {
    // check for nested arrays or objects
    var arrayCopy = [];
    for (var i = 0; i < groupName.length; i++) {
      var element = groupName[i];
      var elemType = type(element);
      if (elemType === 'array' || elemType === 'object') {
        log('WARNING: Skipping nested ' + elemType + ' in array groupName');
        continue;
      } else if (elemType === 'string') {
        arrayCopy.push(element);
      } else if (elemType === 'date' || elemType === 'number' || elemType === 'boolean') {
        element = String(element);
        log('WARNING: Non-string groupName, received type ' + elemType + ', coercing to string "' + element + '"');
        arrayCopy.push(element);
      }
    }
    return arrayCopy;
  }
  log('WARNING: Non-string groupName, received type ' + groupNameType +
        '. Please use strings or array of strings for groupName');
};

// parses the value of a url param (for example ?gclid=1234&...)
var getQueryParam = function getQueryParam(name, query) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(query);
  return results === null ? undefined : decodeURIComponent(results[1].replace(/\+/g, " "));
};

module.exports = {
  log: log,
  isEmptyString: isEmptyString,
  getQueryParam: getQueryParam,
  sessionStorageEnabled: sessionStorageEnabled,
  truncate: truncate,
  validateGroups: validateGroups,
  validateInput: validateInput,
  validateProperties: validateProperties
};

}, {"./constants":4,"./type":7}],
7: [function(require, module, exports) {
/**
 * toString ref.
 * @private
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 * @private
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) {
    return 'null';
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (val !== val) {
    return 'nan';
  }
  if (val && val.nodeType === 1) {
    return 'element';
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
    return 'buffer';
  }

  val = val.valueOf ? val.valueOf() : Object.prototype.valueOf.apply(val);
  return typeof val;
};

}, {}],
13: [function(require, module, exports) {
/* jshint -W020, unused: false, noempty: false, boss: true */

/*
 * Implement localStorage to support Firefox 2-3 and IE 5-7
 */
var localStorage; // jshint ignore:line

// test that Window.localStorage is available and works
function windowLocalStorageAvailable() {
  var uid = new Date();
  var result;
  try {
    window.localStorage.setItem(uid, uid);
    result = window.localStorage.getItem(uid) === String(uid);
    window.localStorage.removeItem(uid);
    return result;
  } catch (e) {
    // localStorage not available
  }
  return false;
}

if (windowLocalStorageAvailable()) {
  localStorage = window.localStorage;
} else if (window.globalStorage) {
  // Firefox 2-3 use globalStorage
  // See https://developer.mozilla.org/en/dom/storage#globalStorage
  try {
    localStorage = window.globalStorage[window.location.hostname];
  } catch (e) {
    // Something bad happened...
  }
} else {
  // IE 5-7 use userData
  // See http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx
  var div = document.createElement('div'),
      attrKey = 'localStorage';
  div.style.display = 'none';
  document.getElementsByTagName('head')[0].appendChild(div);
  if (div.addBehavior) {
    div.addBehavior('#default#userdata');
    localStorage = {
      length: 0,
      setItem: function(k, v) {
        div.load(attrKey);
        if (!div.getAttribute(k)) {
          this.length++;
        }
        div.setAttribute(k, v);
        div.save(attrKey);
      },
      getItem: function(k) {
        div.load(attrKey);
        return div.getAttribute(k);
      },
      removeItem: function(k) {
        div.load(attrKey);
        if (div.getAttribute(k)) {
          this.length--;
        }
        div.removeAttribute(k);
        div.save(attrKey);
      },
      clear: function() {
        div.load(attrKey);
        var i = 0;
        var attr;
        while (attr = div.XMLDocument.documentElement.attributes[i++]) {
          div.removeAttribute(attr.name);
        }
        div.save(attrKey);
        this.length = 0;
      },
      key: function(k) {
        div.load(attrKey);
        return div.XMLDocument.documentElement.attributes[k];
      }
    };
    div.load(attrKey);
    localStorage.length = div.XMLDocument.documentElement.attributes.length;
  } else {
    /* Nothing we can do ... */
  }
}
if (!localStorage) {
  localStorage = {
    length: 0,
    setItem: function(k, v) {
    },
    getItem: function(k) {
    },
    removeItem: function(k) {
    },
    clear: function() {
    },
    key: function(k) {
    }
  };
}

module.exports = localStorage;

}, {}],
12: [function(require, module, exports) {
var utils = require('./utils');

var getUtmData = function getUtmData(rawCookie, query) {
  // Translate the utmz cookie format into url query string format.
  var cookie = rawCookie ? '?' + rawCookie.split('.').slice(-1)[0].replace(/\|/g, '&') : '';

  var fetchParam = function fetchParam(queryName, query, cookieName, cookie) {
    return utils.getQueryParam(queryName, query) ||
           utils.getQueryParam(cookieName, cookie);
  };

  var utmSource = fetchParam('utm_source', query, 'utmcsr', cookie);
  var utmMedium = fetchParam('utm_medium', query, 'utmcmd', cookie);
  var utmCampaign = fetchParam('utm_campaign', query, 'utmccn', cookie);
  var utmTerm = fetchParam('utm_term', query, 'utmctr', cookie);
  var utmContent = fetchParam('utm_content', query, 'utmcct', cookie);

  var utmData = {};
  var addIfNotNull = function addIfNotNull(key, value) {
    if (!utils.isEmptyString(value)) {
      utmData[key] = value;
    }
  };

  addIfNotNull('utm_source', utmSource);
  addIfNotNull('utm_medium', utmMedium);
  addIfNotNull('utm_campaign', utmCampaign);
  addIfNotNull('utm_term', utmTerm);
  addIfNotNull('utm_content', utmContent);

  return utmData;
};

module.exports = getUtmData;

}, {"./utils":8}],
5: [function(require, module, exports) {
var type = require('./type');
var utils = require('./utils');

/*
 * Wrapper for a user properties JSON object that supports operations.
 * Note: if a user property is used in multiple operations on the same Identify object,
 * only the first operation will be saved, and the rest will be ignored.
 */

var AMP_OP_ADD = '$add';
var AMP_OP_APPEND = '$append';
var AMP_OP_CLEAR_ALL = '$clearAll';
var AMP_OP_PREPEND = '$prepend';
var AMP_OP_SET = '$set';
var AMP_OP_SET_ONCE = '$setOnce';
var AMP_OP_UNSET = '$unset';

/**
 * Identify API - instance constructor. Identify objects are a wrapper for user property operations.
 * Each method adds a user property operation to the Identify object, and returns the same Identify object,
 * allowing you to chain multiple method calls together.
 * Note: if the same user property is used in multiple operations on a single Identify object,
 * only the first operation on that property will be saved, and the rest will be ignored.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#user-properties-and-user-property-operations}
 * for more information on the Identify API and user property operations.
 * @constructor Identify
 * @public
 * @example var identify = new amplitude.Identify();
 */
var Identify = function() {
  this.userPropertiesOperations = {};
  this.properties = []; // keep track of keys that have been added
};

/**
 * Increment a user property by a given value (can also be negative to decrement).
 * If the user property does not have a value set yet, it will be initialized to 0 before being incremented.
 * @public
 * @param {string} property - The user property key.
 * @param {number|string} value - The amount by which to increment the user property. Allows numbers as strings (ex: '123').
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().add('karma', 1).add('friends', 1);
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.add = function(property, value) {
  if (type(value) === 'number' || type(value) === 'string') {
    this._addOperation(AMP_OP_ADD, property, value);
  } else {
    utils.log('Unsupported type for value: ' + type(value) + ', expecting number or string');
  }
  return this;
};

/**
 * Append a value or values to a user property.
 * If the user property does not have a value set yet,
 * it will be initialized to an empty list before the new values are appended.
 * If the user property has an existing value and it is not a list,
 * the existing value will be converted into a list with the new values appended.
 * @public
 * @param {string} property - The user property key.
 * @param {number|string|list|object} value - A value or values to append.
 * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().append('ab-tests', 'new-user-tests');
 * identify.append('some_list', [1, 2, 3, 4, 'values']);
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.append = function(property, value) {
  this._addOperation(AMP_OP_APPEND, property, value);
  return this;
};

/**
 * Clear all user properties for the current user.
 * SDK user should instead call amplitude.clearUserProperties() instead of using this.
 * $clearAll needs to be sent on its own Identify object. If there are already other operations, then don't add $clearAll.
 * If $clearAll already in an Identify object, don't allow other operations to be added.
 * @private
 */
Identify.prototype.clearAll = function() {
  if (Object.keys(this.userPropertiesOperations).length > 0) {
    if (!this.userPropertiesOperations.hasOwnProperty(AMP_OP_CLEAR_ALL)) {
      utils.log('Need to send $clearAll on its own Identify object without any other operations, skipping $clearAll');
    }
    return this;
  }
  this.userPropertiesOperations[AMP_OP_CLEAR_ALL] = '-';
  return this;
};

/**
 * Prepend a value or values to a user property.
 * Prepend means inserting the value or values at the front of a list.
 * If the user property does not have a value set yet,
 * it will be initialized to an empty list before the new values are prepended.
 * If the user property has an existing value and it is not a list,
 * the existing value will be converted into a list with the new values prepended.
 * @public
 * @param {string} property - The user property key.
 * @param {number|string|list|object} value - A value or values to prepend.
 * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().prepend('ab-tests', 'new-user-tests');
 * identify.prepend('some_list', [1, 2, 3, 4, 'values']);
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.prepend = function(property, value) {
  this._addOperation(AMP_OP_PREPEND, property, value);
  return this;
};

/**
 * Sets the value of a given user property. If a value already exists, it will be overwriten with the new value.
 * @public
 * @param {string} property - The user property key.
 * @param {number|string|list|object} value - A value or values to set.
 * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().set('user_type', 'beta');
 * identify.set('name', {'first': 'John', 'last': 'Doe'}); // dict is flattened and becomes name.first: John, name.last: Doe
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.set = function(property, value) {
  this._addOperation(AMP_OP_SET, property, value);
  return this;
};

/**
 * Sets the value of a given user property only once. Subsequent setOnce operations on that user property will be ignored;
 * however, that user property can still be modified through any of the other operations.
 * Useful for capturing properties such as 'initial_signup_date', 'initial_referrer', etc.
 * @public
 * @param {string} property - The user property key.
 * @param {number|string|list|object} value - A value or values to set once.
 * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().setOnce('sign_up_date', '2016-04-01');
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.setOnce = function(property, value) {
  this._addOperation(AMP_OP_SET_ONCE, property, value);
  return this;
};

/**
 * Unset and remove a user property. This user property will no longer show up in a user's profile.
 * @public
 * @param {string} property - The user property key.
 * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
 * @example var identify = new amplitude.Identify().unset('user_type').unset('age');
 * amplitude.identify(identify); // send the Identify call
 */
Identify.prototype.unset = function(property) {
  this._addOperation(AMP_OP_UNSET, property, '-');
  return this;
};

/**
 * Helper function that adds operation to the Identify's object
 * Handle's filtering of duplicate user property keys, and filtering for clearAll.
 * @private
 */
Identify.prototype._addOperation = function(operation, property, value) {
  // check that the identify doesn't already contain a clearAll
  if (this.userPropertiesOperations.hasOwnProperty(AMP_OP_CLEAR_ALL)) {
    utils.log('This identify already contains a $clearAll operation, skipping operation ' + operation);
    return;
  }

  // check that property wasn't already used in this Identify
  if (this.properties.indexOf(property) !== -1) {
    utils.log('User property "' + property + '" already used in this identify, skipping operation ' + operation);
    return;
  }

  if (!this.userPropertiesOperations.hasOwnProperty(operation)){
    this.userPropertiesOperations[operation] = {};
  }
  this.userPropertiesOperations[operation][property] = value;
  this.properties.push(property);
};

module.exports = Identify;

}, {"./type":7,"./utils":8}],
14: [function(require, module, exports) {
var querystring = require('querystring');

/*
 * Simple AJAX request object
 */
var Request = function(url, data) {
  this.url = url;
  this.data = data || {};
};

Request.prototype.send = function(callback) {
  var isIE = window.XDomainRequest ? true : false;
  if (isIE) {
    var xdr = new window.XDomainRequest();
    xdr.open('POST', this.url, true);
    xdr.onload = function() {
      callback(200, xdr.responseText);
    };
    xdr.onerror = function () {
      // status code not available from xdr, try string matching on responseText
      if (xdr.responseText === 'Request Entity Too Large') {
        callback(413, xdr.responseText);
      } else {
        callback(500, xdr.responseText);
      }
    };
    xdr.ontimeout = function () {};
    xdr.onprogress = function() {};
    xdr.send(querystring.stringify(this.data));
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', this.url, true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(xhr.status, xhr.responseText);
      }
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.send(querystring.stringify(this.data));
  }
  //log('sent request to ' + this.url + ' with data ' + decodeURIComponent(queryString(this.data)));
};

module.exports = Request;

}, {}],
6: [function(require, module, exports) {
var constants = require('./constants');
var type = require('./type');
var utils = require('./utils');

/*
 * Wrapper for logging Revenue data. Revenue objects get passed to amplitude.logRevenueV2 to send to Amplitude servers.
 * Note: price is the only required field. If quantity is not specified, then defaults to 1.
 */

/**
 * Revenue API - instance constructor. Revenue objects are a wrapper for revenue data.
 * Each method updates a revenue property in the Revenue object, and returns the same Revenue object,
 * allowing you to chain multiple method calls together.
 * Note: price is a required field to log revenue events.
 * If quantity is not specified then defaults to 1.
 * See [Readme]{@link https://github.com/amplitude/Amplitude-Javascript#tracking-revenue} for more information
 * about logging Revenue.
 * @constructor Revenue
 * @public
 * @example var revenue = new amplitude.Revenue();
 */
var Revenue = function Revenue() {
  // required fields
  this._price = null;

  // optional fields
  this._productId = null;
  this._quantity = 1;
  this._revenueType = null;
  this._properties = null;
};

/**
 * Set a value for the product identifer.
 * @public
 * @param {string} productId - The value for the product identifier. Empty and invalid strings are ignored.
 * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
 * amplitude.logRevenueV2(revenue);
 */
Revenue.prototype.setProductId = function setProductId(productId) {
  if (type(productId) !== 'string') {
    utils.log('Unsupported type for productId: ' + type(productId) + ', expecting string');
  } else if (utils.isEmptyString(productId)) {
    utils.log('Invalid empty productId');
  } else {
    this._productId = productId;
  }
  return this;
};

/**
 * Set a value for the quantity. Note revenue amount is calculated as price * quantity.
 * @public
 * @param {number} quantity - Integer value for the quantity. If not set, quantity defaults to 1.
 * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setQuantity(5);
 * amplitude.logRevenueV2(revenue);
 */
Revenue.prototype.setQuantity = function setQuantity(quantity) {
  if (type(quantity) !== 'number') {
    utils.log('Unsupported type for quantity: ' + type(quantity) + ', expecting number');
  } else {
    this._quantity = parseInt(quantity);
  }
  return this;
};

/**
 * Set a value for the price. This field is required for all revenue being logged.
 * Note revenue amount is calculated as price * quantity.
 * @public
 * @param {number} price - Double value for the quantity.
 * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
 * amplitude.logRevenueV2(revenue);
 */
Revenue.prototype.setPrice = function setPrice(price) {
  if (type(price) !== 'number') {
    utils.log('Unsupported type for price: ' + type(price) + ', expecting number');
  } else {
    this._price = price;
  }
  return this;
};

/**
 * Set a value for the revenueType (for example purchase, cost, tax, refund, etc).
 * @public
 * @param {string} revenueType - RevenueType to designate.
 * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
 * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setRevenueType('purchase');
 * amplitude.logRevenueV2(revenue);
 */
Revenue.prototype.setRevenueType = function setRevenueType(revenueType) {
  if (type(revenueType) !== 'string') {
    utils.log('Unsupported type for revenueType: ' + type(revenueType) + ', expecting string');
  } else {
    this._revenueType = revenueType;
  }
  return this;
};

/**
 * Set event properties for the revenue event.
 * @public
 * @param {object} eventProperties - Revenue event properties to set.
 * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
 * @example var event_properties = {'city': 'San Francisco'};
 * var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setEventProperties(event_properties);
 * amplitude.logRevenueV2(revenue);
*/
Revenue.prototype.setEventProperties = function setEventProperties(eventProperties) {
  if (type(eventProperties) !== 'object') {
    utils.log('Unsupported type for eventProperties: ' + type(eventProperties) + ', expecting object');
  } else {
    this._properties = utils.validateProperties(eventProperties);
  }
  return this;
};

/**
 * @private
 */
Revenue.prototype._isValidRevenue = function _isValidRevenue() {
  if (type(this._price) !== 'number') {
    utils.log('Invalid revenue, need to set price field');
    return false;
  }
  return true;
};

/**
 * @private
 */
Revenue.prototype._toJSONObject = function _toJSONObject() {
  var obj = type(this._properties) === 'object' ? this._properties : {};

  if (this._productId !== null) {
    obj[constants.REVENUE_PRODUCT_ID] = this._productId;
  }
  if (this._quantity !== null) {
    obj[constants.REVENUE_QUANTITY] = this._quantity;
  }
  if (this._price !== null) {
    obj[constants.REVENUE_PRICE] = this._price;
  }
  if (this._revenueType !== null) {
    obj[constants.REVENUE_REVENUE_TYPE] = this._revenueType;
  }
  return obj;
};

module.exports = Revenue;

}, {"./constants":4,"./type":7,"./utils":8}],
15: [function(require, module, exports) {
/* jshint bitwise: false, laxbreak: true */

/**
 * Source: [jed's gist]{@link https://gist.github.com/982883}.
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f, and
 * y is replaced with a random hexadecimal digit from 8 to b.
 * Used to generate UUIDs for deviceIds.
 * @private
 */
var uuid = function(a) {
  return a           // if the placeholder was passed, return
      ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a / 4         // 8 to 11
      ).toString(16) // in hexadecimal
      : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
      /[018]/g,    // zeroes, ones, and eights with
      uuid         // random hex digits
  );
};

module.exports = uuid;

}, {}],
9: [function(require, module, exports) {
module.exports = '3.4.0';

}, {}],
10: [function(require, module, exports) {
var language = require('./language');

// default options
module.exports = {
  apiEndpoint: 'api.amplitude.com',
  cookieExpiration: 365 * 10,
  cookieName: 'amplitude_id',
  domain: '',
  includeReferrer: false,
  includeUtm: false,
  language: language.language,
  optOut: false,
  platform: 'Web',
  savedMaxCount: 1000,
  saveEvents: true,
  sessionTimeout: 30 * 60 * 1000,
  unsentKey: 'amplitude_unsent',
  unsentIdentifyKey: 'amplitude_unsent_identify',
  uploadBatchSize: 100,
  batchEvents: false,
  eventUploadThreshold: 30,
  eventUploadPeriodMillis: 30 * 1000, // 30s
  forceHttps: false,
  includeGclid: false,
  saveParamsReferrerOncePerSession: true,
  deviceIdFromUrlParam: false,
};

}, {"./language":19}],
19: [function(require, module, exports) {
var getLanguage = function() {
    return (navigator && ((navigator.languages && navigator.languages[0]) ||
        navigator.language || navigator.userLanguage)) || undefined;
};

module.exports = {
    language: getLanguage()
};

}, {}]}, {}, {"1":""})
);