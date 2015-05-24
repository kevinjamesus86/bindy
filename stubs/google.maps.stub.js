var EventEmitter = require('wolfy87-eventemitter');

/**
 * Base class implementing KVO.
 *
 * The MVCObject constructor is guaranteed to be an empty function, and so
 * you may inherit from MVCObject by simply writing MySubclass.prototype = new google.maps.MVCObject();.
 * Unless otherwise noted, this is not true of other classes in the API,
 * and inheriting from other classes in the API is not supported.
 *
 * @constructor
 */
function MVCObject() {}
MVCObject.prototype = Object.create(EventEmitter.prototype);
MVCObject.prototype.constructor = MVCObject;

module.exports = {

  // google.maps namespace
  maps: {

    // google.maps.MVCObject
    MVCObject: MVCObject,

    // google.maps.event namespace
    event: {

      /**
       * Adds the given listener function to the given event name for the given
       * object instance. Returns an identifier for this listener that can
       * be used with removeListener()
       *
       * @param {Object} instance
       * @param {string} eventName
       * @param {Function} handler
       * @return {MapsEventListener}
       */
      addListener: function(instance, eventName, handler) {
        instance.addListener(eventName, handler);
        return {
          event: eventName,
          handler: handler,
          instance: instance
        };
      },

      /**
       * Like addListener, but the handler removes itself after handling
       * the first event
       *
       * @param {Object} instance
       * @param {string} eventName
       * @param {Function} handler
       * @return {MapsEventListener}
       */
      addListenerOnce: function(instance, eventName, handler) {
        instance.addOnceListener(eventName, handler);
        return {
          event: eventName,
          handler: handler,
          instance: instance
        };
      },

      /**
       * Removes all listeners for all events for the given instance
       *
       * @param {Object} instance
       */
      clearInstanceListeners: function(instance) {
        instance.removeAllListeners();
      },

      /**
       * Removes the given listener, which should have been returned by
       * addListener above.
       *
       * @param {MapsEventListener} listener
       */
      removeListener: function(listener) {
        listener.instance.removeListener(listener.event, listener.handler);
      },


      /**
       * Triggers the given event. All arguments after eventName are passed
       * as arguments to the listeners.
       *
       * @param {Object} instance
       * @param {string} eventName
       * @param {...*=} var_args
       */
      trigger: function(instance, eventName /*, var_args */ ) {
        instance.emitEvent(eventName, Array.prototype.slice.call(arguments, 2));
      }
    }
  }
};