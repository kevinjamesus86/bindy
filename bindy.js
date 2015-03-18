(function(gMaps) {
  'use strict';

  var eventNs = gMaps.event,
    MVCObjectProto = gMaps.MVCObject.prototype,

    slice = [].slice,
    hasOwn = {}.hasOwnProperty,
    keys = Object.keys,
    defineProperty = Object.defineProperty,

    each = function(o, fn) {
      if (o) {
        var len = o.length,
          i = -1;
        while (++i < len) fn(o[i]);
      }
    },

    clear = function(o) {
      for (var k in o) {
        delete o[k];
      }
    },

    isFunction = function(f) {
      return 'function' == typeof f;
    },

    eventMatcher = function(s) {
      return s.match(/\S+/g);
    };

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

  function _on(instance, types, fn, one) {
    var addListener = one ? eventNs.addListenerOnce : eventNs.addListener,
      data = dataStore.get(instance),
      id = uuid.get(fn),
      events,
      origFn;

    if (!(events = data.events)) {
      events = data.events = Object.create(null);
    }

    if (one) {
      origFn = fn;
      fn = function(event) {
        _off(events, [event.event], id);

        return arguments.length == 1 ?
          origFn.call(this, event) :
          origFn.apply(this, arguments);
      };
    }

    each(eventMatcher(types), function(type) {
      var fns = events[type] = events[type] || [],
        listener = addListener(instance, type, eventInjector),
        self = instance;

      fns.push(listener);
      uuid.set(listener, id);

      function eventInjector(event) {
        event = event || {};
        event.event = type;
        event.timeStamp = Date.now();
        uuid.set(event, id);

        return arguments.length < 2 ?
          fn.call(self, event) :
          fn.apply(self, [event].concat(slice.call(arguments, 1)));
      }
    });
  }

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
  MVCObjectProto.one = function one(types, fn) {
    return this.on(types, fn, ONE);
  };

  MVCObjectProto.on = function on(types, fn /*, INTERNAL one */ ) {
    var one = arguments[2] === ONE,
      argType = typeof types;
    if (types) {
      if ('string' == argType) {
        _on(this, types, fn, one);
      } else if ('object' == argType) {
        for (var type in types) {
          if (isFunction(types[type])) {
            _on(this, type, types[type], one);
          }
        }
      }
    }
    return this;
  };

  MVCObjectProto.off = function off(types, fn) {
    var events = dataStore.has(this) && dataStore.get(this).events,
      numArgs = arguments.length,
      argType = typeof types,
      self = this,
      type;

    if (!events) {
      if (1 == numArgs && true === types) {
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
    if (types && 'object' == argType) {
      for (type in types) {
        if (isFunction(fn = types[type]) && uuid.has(fn)) {
          _off(events, eventMatcher(type), uuid.get(fn));
        }
      }
      return self;
    }

    // remove all events optionally associated with fn
    if ('string' == argType) {
      if (null == fn || isFunction(fn) && uuid.has(fn)) {
        _off(events, eventMatcher(types), fn && uuid.get(fn));
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
    if (!numArgs || 1 == numArgs && true === types) {
      _off(events, keys(events));
      dataStore.discard(self);
      clear(events);

      // including the ones created at instantiation
      if (numArgs) {
        eventNs.clearInstanceListeners(this);
      }
    }

    return self;
  };

  MVCObjectProto.trigger = function trigger(type) {
    var args = [this, type, {triggered:true}];
    if (1 == arguments.length) {
      eventNs.trigger(args[0], args[1], args[2]);
    } else {
      eventNs.trigger.apply(null, args.concat(slice.call(arguments, 1)));
    }
    return this;
  };

})(this.google.maps);