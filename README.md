[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# redux sync

A store enhancer for [Redux](https://github.com/reactjs/redux) which allows to mirror one store as a part of another and keeps them in sync.


## About

Although one of the core principles of Redux is referring to a [single source of truth](http://redux.js.org/docs/introduction/ThreePrinciples.html), depending on the application its not always possible. Environments like `iframes` or `Web Worker` can't share code directly as they are running in a different context. While its possible to use just one store and pass each data manually, another approach is to run these stores separate and automatically synchronize data changes. This allows to access the data at a single store and invoke changes across scope boundaries (e.g. triggering an action which changes the values outside will also transfer the value into the `iframe` store).


## Usage

### Install

`npm install --save redux-sync`

### General setup

1.) Configure the redux store which should be synchronized

```js
import syncStore from 'redux-sync'

// optional
const middlewares = [
  thunkMiddleware,
  loggerMiddleware
]

const finalCreateStore = compose(
  applyMiddleware(...middlewares),
  syncStore()
)(createStore)

const store = finalCreateStore(reducer, initialState)
```

2.) Configure the redux store which should should contain the synchronized store

```js
import syncStore from 'redux-sync'

// optional
const middlewares = [
  thunkMiddleware,
  loggerMiddleware
]

const finalCreateStore = compose(
  applyMiddleware(...middlewares),
  syncStore('subtree')
)(createStore)

const store = finalCreateStore(reducer, initialState)
```


## FAQ

### Copying data from one store to another sounds like redundant data management...
No question it is, but regarding the aspect that this module is meant to ease the state management between different context it provides the advantages of completeness and performance.

### Why not using [redux persist](https://github.com/rt2zz/redux-persist) ?
Indeed using a layer in between which can be accessed from both could be used,
but the focus is actual not on persistence (you could still do it if you like)
but on communication and optimized synchronization of substates.


## TODO
- add example
- checkout more lightweight alternatives (current total ~ 39kb), e.g. for [patching](https://github.com/flitbit/diff)
- support include/exclude filter options
- integrate webworker and websocket adapter


### Development

To build your own version run `npm run dev` for development (incl. watch) or `npm run build` for production (minified).
