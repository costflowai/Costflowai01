/**
 * Lightweight calculator event bus used for coordination between modules.
 * Provides publish/subscribe semantics with automatic cleanup hooks so
 * calculators can be lazy-loaded per panel.
 */

const subscribers = new Map();
let uid = 0;

/**
 * Subscribe to a topic and receive published payloads.
 * @param {string} topic
 * @param {(payload: any) => void} handler
 * @returns {() => void} unsubscribe function
 */
export function subscribe(topic, handler) {
  if (!subscribers.has(topic)) {
    subscribers.set(topic, new Map());
  }
  const topicSubscribers = subscribers.get(topic);
  const token = ++uid;
  topicSubscribers.set(token, handler);
  return () => {
    topicSubscribers.delete(token);
    if (topicSubscribers.size === 0) {
      subscribers.delete(topic);
    }
  };
}

/**
 * Publish a payload to all subscribers of a topic.
 * @param {string} topic
 * @param {any} payload
 */
export function publish(topic, payload) {
  const topicSubscribers = subscribers.get(topic);
  if (!topicSubscribers) return;
  topicSubscribers.forEach(handler => {
    try {
      handler(payload);
    } catch (error) {
      console.warn(`calcBus handler for "${topic}" failed`, error);
    }
  });
}

/**
 * Remove all subscribers – used when calculators are torn down between
 * navigation events.
 */
export function reset() {
  subscribers.clear();
  uid = 0;
}

export default {
  subscribe,
  publish,
  reset
};
