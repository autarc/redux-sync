/**
 * # Stor
 *
 * A store enhancer which triggers change/update settings based on external events.
 *
 * TODO: checkout compatibity after upgrading redux, https://github.com/reactjs/redux/pull/1702
 */

import stringify from 'json-stringify-safe'
import objectPath from 'object-path'
import { DiffPatcher } from 'jsondiffpatch/src/diffpatcher'

const diffpatcher = new DiffPatcher()

const INIT = '@@redux-sync/INIT'
const SYNC = '@@redux-sync/SYNC'

const defaultOptions = {
  // exclude: [], // - allows to specify patterns for excludes
  // include: [], // - allows to specify patterns for includes
  root: null,  // - optional: entry pointer what/where it should be synchronized !
  id: '*'      // - optional: used to differentiate if multiple sync stores are used!
}

// TODO: remove reference on unsubscribe/disconnect to avoid memory leak
const connections = Object.create(null)

export default function syncStore (customOptions) {

  if (customOptions && typeof customOptions === 'string') {
    customOptions = { root: customOptions }
  }

  const options = {...defaultOptions}

  if (customOptions) {
    Object.assign(options, customOptions)
  }

  const env = {
    isIframe: window !== window.parent
  }

  return (createStore) => (reducer, initialState) => {

    const store = createStore(reducer, initialState)

    // get initial state after creation
    const creationState = store.getState()

    if (env.isIframe) {
      const creationPatch = diffpatcher.diff({}, creationState)
      sendMessage(options, window.parent, { type: INIT, state: creationState }, creationPatch)
    }

    // listen to internal dispatches to communicate (~ middlware)
    const dispatch = (action) => {

      const stateBefore = store.getState()
      const result = store.dispatch(action)
      const stateAfter = store.getState()

      if (env.isIframe) {
        const patch = diffpatcher.diff(stateBefore, stateAfter)
        sendMessage(options, window.parent, action, patch)
      } else {
        const patch = diffpatcher.diff(
          objectPath.get(stateBefore, options.root),
          objectPath.get(stateAfter, options.root)
        )
        if (patch) {
          const connection = connections[options.id]
          sendMessage(options, connection, action, patch)
        }
      }

      return result
    }

    // listen to external messages
    window.addEventListener('message', ({ data, origin, source }) => {
      // filter by prefix
      if (typeof data === 'string' && data.indexOf('redux-sync:') === 0) {

        const { id, trigger, patch } = JSON.parse(data.replace('redux-sync:', ''))

        if (trigger.type === INIT) {
          connections[id] = source
        }

        store.dispatch({ type: SYNC, trigger, patch })
      }
    })

    // wrap reducer to patch data
    store.replaceReducer((state = creationState, action) => {

      if (action.type === SYNC) {
        // TODO: handle/merge complex types of 'immutables'
        // TODO: use selective approach for decoupling references (e.g. based on {...state})
        state = JSON.parse(stringify(state))
        diffpatcher.patch(objectPath.get(state, options.root), action.patch)
        return state
      }

      return reducer(state, action)
    })

    return {
      ...store,
      dispatch
    }
  }
}

/**
* Send triggering action and the complete state.
* TODO: currently restricted to postMessages || could be extend to other channels (e.g. websocket)
*
* @param  {[type]} customOptions [description]
* @param  {[type]} state         [description]
* @return {[type]}               [description]
*/
function sendMessage (options, scope, action, patch) {
  scope.postMessage('redux-sync:' + stringify({
    id: options.id,
    trigger: action,
    patch
  }), '*')
}
