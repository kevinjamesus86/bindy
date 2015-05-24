# bindy [![Codacy Badge](https://www.codacy.com/project/badge/302156ff4f004fc7b455a20e5f9c253f)](https://www.codacy.com/app/kevinjamesus86/bindy)

_a jQuery like event API for Google Maps MVCObject and its chilluns_

### Download

+ JS
 - [bindy.js](https://raw.githubusercontent.com/kevinjamesus86/bindy/master/bindy.js) big, or
 - [bindy.min.js](https://raw.githubusercontent.com/kevinjamesus86/bindy/master/bindy.min.js) small

## Install

Grab Google Maps JavaScript API V3

```html
<script src="https://maps.googleapis.com/maps/api/js?v=3"></script>
```

Then grab bindy

```html
<script src="https://cdn.rawgit.com/kevinjamesus86/bindy/v0.1.0/bindy.js"></script>
<!-- or -->
<script src="https://cdn.rawgit.com/kevinjamesus86/bindy/v0.1.0/bindy.min.js"></script>
```

### Async

Bindy will extend the Maps API automatically if it's made available before it loads.
If you need to load the API asynchronously then no worries, as soon as
it's available just call `bindy()` and it'll hook you up.

## Usage

Make a thing
```js
var poi = new google.maps.Marker({
  position: {
    lat: 45.517,
    lng: -122.670
  }
})
```

then event it up

#### \#on(events, handler)

```js
poi.on('click touch tap', function(event) {
  console.log("I've been " + event.event + "'d")
})
```

#### \#on(events)

```js
poi.on({
  click: function(event) {
    console.log('click:' + event.latLng.toUrlValue())
  },
  'mouseover mouseout': function(event) {
    if ('mouseover' == event.event) {
      // do something
    } else if ('mouseout' == event.event) {
      // otherwise, do this
    } else {
      // impossible
    }
  }
})
```

#### \#one(events, handler)

```js
var events = {
  click: 0,
  touch: 0
}
poi.one('click touch', function(event) {
  events[event.event] += 1
})

// CLICK CLICK TOUCH TOUCH

console.log(events.click) // 1
console.log(events.touch) // 1
```

#### \#one(events)

```js
poi.one({
  position_changed: function() {
    console.log("I won't be telling you about my next move")
  }
})
```

#### \#off

This has a maddening number of signatures so bear with me..

```js

var handler
poi.on('click mouseover', handler = function(event) {
  // do the things
})

// remove all events bound to `handler`
poi.off(handler)

// remove all click events
poi.off('click')

// remove all click events bound to `handler`
poi.off('click', handler)

// remove all mouseover events
poi.off('mouseover')

// remove all mouseover events bound to `handler`
poi.off('mouseover', handler)

// remove all click and mouseover events
poi.off('click mouseover')

// remove all click and mouseover events bound to `handler`
poi.off('click mouseover', handler)

// or

poi.off({
  'click mouseover': handler
})

```

&#9660;

```js
poi.one('click', function() {
  // do stuff once
})
```

is equivalent to

```js
poi.on('click', function(event) {
  this.off(event)
  // do stuff once
})
```

&#9650;

```js
poi.on('click position_changed', function handler(event) {
  // do stuff once

  /**
   * remove the remaining events bound to `handler`
   * making sure we only run this code one time
   */
  this.off(handler)

  /**
   * `e.event` can be 'click' or 'position_changed'
   * depending on which event happened first
   */
  console.log(e.event)
})
```

#### \#off _everything_

```js
// remove all events that bindy knows about, i.e.
// any events that were added via #on() or #one()
poi.off();

// remove all events, period
poi.off(true);
```
