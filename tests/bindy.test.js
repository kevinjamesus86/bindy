var expect = require('expect.js');
var google = require('../stubs/google.maps.stub');

require('../bindy.js')(google);

describe('MVCObject instance', function() {
  var counter;
  var instance;

  function plus1() {
    counter += 1;
  }

  beforeEach(function() {
    counter = 0;
    instance = new google.maps.MVCObject();
  });

  afterEach(function() {
    instance.off(true);
  });

  describe('#on', function() {

    it('adds a listener for one event', function() {

      instance.on('click', plus1);
      instance.trigger('click');
      instance.trigger('click');
      expect(counter).to.be(2);

      // reset
      instance.off();

      instance.on({
        click: plus1
      });
      instance.trigger('click');
      instance.trigger('click');
      expect(counter).to.be(4);
    });

    it('adds a listener for multiple events', function() {

      instance.on('click touch', plus1);
      instance.trigger('click');
      instance.trigger('touch');
      expect(counter).to.be(2);

      // reset
      instance.off();

      instance.on({
        click: plus1,
        touch: plus1
      });
      instance.on({
        'click touch': plus1
      });
      instance.trigger('click');
      instance.trigger('touch');
      expect(counter).to.be(6);
    });

  });

  describe('#one', function() {

    it('adds a listener for one event that executes, at most, one time', function() {

      instance.one('click', plus1);
      instance.trigger('click');
      instance.trigger('click');
      expect(counter).to.be(1);

      // reset
      instance.off();

      instance.one({
        click: plus1
      });
      instance.trigger('click');
      instance.trigger('click');
      expect(counter).to.be(2);
    });

    it('adds a listener for multiple events that execute, at most, one time per event', function() {

      instance.one('click touch', plus1);
      instance.
        trigger('click').
        trigger('click').
        trigger('touch').
        trigger('touch');

      expect(counter).to.be(2);

      // reset
      instance.off();

      instance.one({
        'click touch': plus1
      });
      instance.
        trigger('click').
        trigger('click').
        trigger('touch').
        trigger('touch');

      expect(counter).to.be(4);
    });

    it('will not recurse when triggering an event from & for the currently executing handler',
      function() {
        instance.one('click', function() {
          instance.trigger('click');
          plus1();
        });
        instance.trigger('click');
        expect(counter).to.be(1);

        // reset
        instance.off();

        instance.one({
          click: function() {
            instance.trigger('click');
            plus1();
          }
        });
        instance.trigger('click');
        expect(counter).to.be(2);
      }
    );
  });

  describe('#off', function() {
    var fn1 = function() {
      plus1();
    };
    var fn2 = function() {
      plus1();
    };
    var fn3 = function() {
      plus1();
    };

    it('removes a handler for a single event', function() {
      instance.
        on('click', fn1).
        on('click', fn2).
        off('click', fn1).
        trigger('click');

      expect(counter).to.be(1);

      instance.
        off('click', fn2).
        trigger('click');

      expect(counter).to.be(1);

      // reset
      instance.off();

      instance.on('touch', function fn() {
        plus1();
        this.off(fn);
      });
      instance.
        trigger('touch').
        trigger('touch');

      expect(counter).to.be(2);

      instance.on('swipe touch', function(event) {
        plus1();
        this.off(event);
      });
      instance.
        trigger('swipe').
        trigger('swipe').
        trigger('touch').
        trigger('touch');

      expect(counter).to.be(4);
    });

    it('removes a handler for multiple events', function() {

      instance.on('click touch tap', fn1);
      instance.off('click', fn1);
      instance.
        trigger('click').
        trigger('touch').
        trigger('tap');

      expect(counter).to.be(2);

      instance.off(fn1);
      instance.
        trigger('touch').
        trigger('tap');

      expect(counter).to.be(2);

      instance.on('click touch tap', function handler() {
        plus1();
        this.off(handler);
      });

      instance.
        trigger('click').
        trigger('touch').
        trigger('tap');

      expect(counter).to.be(3);
    });

    it('removes all handlers for 0 or more events', function() {

      instance.
        on('click', fn1).
        on('click', fn2).
        on('click', fn3);

      instance.
        off('click').
        trigger('click');

      expect(counter).to.be(0);

      instance.
        on('click', fn1).
        on('click', fn2).
        on('touch tap', fn3).
        on({
          click: fn1,
          touch: fn2,
          tap: fn3
        });

      instance.
        off('click').
        trigger('touch').
        trigger('tap');

      expect(counter).to.be(4);

      instance.off().
        trigger('touch').
        trigger('tap');

      expect(counter).to.be(4);
    });

    it('removes handlers added via bindy api', function() {

      google.maps.event.addListener(instance, 'click', plus1);
      instance.on('click', plus1);
      instance.trigger('click');

      expect(counter).to.be(2);

      instance.off('click');
      instance.trigger('click');

      expect(counter).to.be(3);

      instance.off(true);
      instance.trigger('click');

      expect(counter).to.be(3);
    });

    it('when passed `true` removes ALL listeners', function() {

      google.maps.event.addListener(instance, 'click', plus1);
      google.maps.event.addListener(instance, 'touch', plus1);
      instance.
        on('click', plus1).
        on('touch', plus1).
        trigger('click').
        trigger('touch');

      expect(counter).to.be(4);

      instance.off('click touch');
      instance.trigger('click');
      instance.trigger('touch');

      expect(counter).to.be(6);

      instance.off(true);
      instance.trigger('click');
      instance.trigger('touch');

      expect(counter).to.be(6);
    });
  });
});