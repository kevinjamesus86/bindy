/*!
 * bindy - a jQuery like event API for the Google Maps MVCObject and its chilluns
 * license MIT (c) Kevin James 2015
 * https://github.com/kevinjamesus86/bindy
 */
(function(root, factory) {

  // universal module definition
  if ('function' === typeof define && define.amd) {
    // AMD
    define([], factory);
  } else if ('object' === typeof exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    root.bindy = factory();
  }

})(this, function bindyFactory() {
  'use strict';

  // google.maps.event namespace
  var eventNs;

  // keep your friends close and your vars closer
  var hasOwn = {}.hasOwnProperty,
    keys = Object.keys,
    slice = [].slice;

  /**
   * Iterate over an array of items invoking fn on
   * each item in the array
   *
   * @param {Array} o
   * @param {Function} fn
   * @api private
   */
  function each(o, fn) {
    if (o) {
      var len = o.length,
        i = -1;
      while (++i < len) {
        fn(o[i]);
      }
    }
  }

  /**
   * Delete every own property in an object
   *
   * @param {Object} o
   * @api private
   */
  function clear(o) {
    for (var k in o) {
      if (hasOwn.call(o, k)) {
        delete o[k];
      }
    }
  }

  /**
   * Determines if `fn` is a function
   *
   * @param {*} fn
   * @api private
   */
  function isFunction(fn) {
    return 'function' === typeof fn;
  }

  /**
   * Returns an array of event strings
   *
   * @param {string} s
   * @api private
   */
  function matchEvents(s) {
    return s.match(/\S+/g);
  }

  /**
   * Defines a new property on an object
   *
   * @param {Object} o
   * @param {string} prop
   * @param {Object} descriptor
   * @api private
   */
  var defineProperty = (function(define, obj) {
    if (isFunction(define)) {
      // IE 8 only supports DOM objects
      try {
        define(obj, 'i', { value: 0 });
        return define;
      } catch (e) {  }
    }
    return function defineProperty(o, prop, descriptor) {
      return o[prop] = descriptor.value, o;
    };
  })(Object.defineProperty, {});

  /**
   *
   */
  var dataKey = 'bindy_' + Date.now().toString(32);
  var dataStore = {
    has: function(o) {
      return hasOwn.call(o, dataKey);
    },
    set: function(o, v) {
      defineProperty(o, dataKey, {
        value: v,
        configurable: true
      });
      return v;
    },
    get: function(o) {
      return this.has(o) ? o[dataKey] : this.set(o, {});
    },
    discard: function(o) {
      var data = o[dataKey];
      if (data) {
        clear(data);
        delete o[dataKey];
      }
    }
  };

  /**
   *
   */
  var uuidKey = 'bindyuuid_' + Date.now().toString(32);
  var uuid = {
    uuid: 0,
    has: function(o) {
      return hasOwn.call(o, uuidKey);
    },
    set: function(o, v) {
      defineProperty(o, uuidKey, {
        value: v
      });
      return v;
    },
    get: function(o) {
      return this.has(o) ? o[uuidKey] : this.set(o, ++this.uuid);
    }
  };

  /**
   * Adds the given listener function to the given events for the given object instance.
   *
   * @param {Object} instance
   * @param {string} types
   * @param {Function} fn
   * @param {boolean} one
   * @api private
   */
  function _on(instance, types, fn, one) {
    var addListener = one ? eventNs.addListenerOnce : eventNs.addListener,
      data = dataStore.get(instance),
      id = uuid.get(fn),
      events,
      origFn;

    if (!(events = data.events)) {
      events = data.events = {};
    }

    if (one) {
      origFn = fn;
      fn = function(event) {
        _off(events, [event.event], id);

        return arguments.length === 1 ?
          origFn.call(this, event) :
          origFn.apply(this, arguments);
      };
    }

    each(matchEvents(types), function(type) {
      function wrappedHandler(event) {
        event = event || {};
        /**
         * When we trigger an event the fo event object
         * is used as the event for multiple handlers if
         * there are multiple listeners for said event.
         * We need the event object to be unique to assign it
         * the uuid of it's handler for use with the #off function.
         */
        if (event.triggered) {
          event = shallowCopy(event);
        }
        event.event = type;
        event.timeStamp = Date.now();
        uuid.set(event, id);

        return arguments.length < 2 ?
          fn.call(self, event) :
          fn.apply(self, [event].concat(slice.call(arguments, 1)));
      }

      var self = instance,
        fns = events[type] = events[type] || [],
        listener = addListener(self, type, wrappedHandler);

      fns.push(listener);
      uuid.set(listener, id);
    });
  }

  /**
   * Shallow copies an objects own properties
   *
   * @param {Object} o
   * @api private
   */
  function shallowCopy(o) {
    var copy = {};
    for (var prop in o) {
      if (hasOwn.call(o, prop)) {
        copy[prop] = o[prop];
      }
    }
    return copy;
  }

  /**
   * Removes events previously bound to an instance, optionally
   * filtered by an event handler id
   *
   * @param {Object} events
   * @param {string} types
   * @param {number=} id
   * @api private
   */
  function _off(events, types, id) {
    var removeListener = eventNs.removeListener;
    id |= 0;

    each(types, function(type) {
      var handlers = events[type],
        handler,
        length;

      if (handlers) {
        length = handlers.length;

        while (length--) {
          handler = handlers[length];
          if (!id || id === uuid.get(handler)) {
            removeListener(handler);
            handlers.splice(length, 1);
          }
        }
      }
    });
  }

  var ONE = {};
  /**
   * Like _on except any given handler may not be run more than one time per event
   *
   * @param {string} types
   * @param {Function} fn
   */
  function one(types, fn) {
    return this.on(types, fn, ONE);
  }

  /**
   * Public API for _on
   *
   * @param {string} types
   * @param {Function} fn
   * @param {Object} one
   */
  function on(types, fn /*, INTERNAL one */ ) {
    var one = arguments[2] === ONE,
      argType = typeof types;
    if (types) {
      if ('string' === argType) {
        _on(this, types, fn, one);
      } else if ('object' === argType) {
        for (var type in types) {
          if (isFunction(types[type])) {
            _on(this, type, types[type], one);
          }
        }
      }
    }
    return this;
  }

  /**
   * Public API for _off
   *
   * @param {(Object|string|boolean)=} types
   * @param {Function=} fn
   */
  function off(types, fn) {
    var events = dataStore.has(this) && dataStore.get(this).events,
      numArgs = arguments.length,
      argType = typeof types,
      self = this,
      type;

    if (!events) {
      if (1 === numArgs && true === types) {
        eventNs.clearInstanceListeners(self);
        dataStore.discard(self);
      }
      return self;
    }

    // event object
    if (types && types.event && uuid.has(types)) {
      return _off(events, [types.event], uuid.get(types)), self;
    }

    // types-object
    if (types && 'object' === argType) {
      for (type in types) {
        if (isFunction(fn = types[type]) && uuid.has(fn)) {
          _off(events, matchEvents(type), uuid.get(fn));
        }
      }
      return self;
    }

    // remove all events optionally associated with fn
    if ('string' === argType) {
      if (!fn || isFunction(fn) && uuid.has(fn)) {
        _off(events, matchEvents(types), fn && uuid.get(fn));
      }
      return self;
    }

    // remove all the events associated with fn
    if (isFunction(types)) {
      if (uuid.has(types)) {
        _off(events, keys(events), uuid.get(types));
      }
      return self;
    }

    // remove all the events, actually
    if (!numArgs || 1 === numArgs && true === types) {
      _off(events, keys(events));
      dataStore.discard(self);
      clear(events);

      // including the ones created at instantiation
      if (numArgs) {
        eventNs.clearInstanceListeners(this);
      }
    }

    return self;
  }

  /**
   * Triggers the given event. All arguments after type are
   * passed as arguments to the listeners.
   *
   * @param {string} type
   * @param {...*=} var_args
   */
  function trigger(type /*, var_args */ ) {
    var args = [this, type, {triggered:true}];
    if (1 === arguments.length) {
      eventNs.trigger(args[0], args[1], args[2]);
    } else {
      eventNs.trigger.apply(null, args.concat(slice.call(arguments, 1)));
    }
    return this;
  }

  bindy.init = bindy;
  /**
   * @param {Object} google
   */
  function bindy(google) {
    google = google || window && window.google;

    if (google) {
      eventNs = google.maps.event;

      if (!bindy.extended) {
        bindy.extended = true;
        extendBaseKVOClass(google.maps.MVCObject);
      }
    }
  }

  /**
   * Extend MVCObject with the *awesomeness* found above
   *
   * @param {MVCObject} Class
   */
  function extendBaseKVOClass(Class) {
    Class.prototype.on = on;
    Class.prototype.one = one;
    Class.prototype.off = off;
    Class.prototype.trigger = trigger;
  }

  if ('object' === typeof google && google.maps) {
    bindy(google);
  }

  return bindy;
});