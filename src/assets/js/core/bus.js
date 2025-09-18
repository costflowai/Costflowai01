const createBus = () => {
  const topics = new Map();

  const ensureTopic = (topic) => {
    if (!topics.has(topic)) {
      topics.set(topic, new Set());
    }
    return topics.get(topic);
  };

  return Object.freeze({
    subscribe(topic, handler) {
      const listeners = ensureTopic(topic);
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    publish(topic, payload) {
      const listeners = topics.get(topic);
      if (!listeners) return;
      for (const handler of [...listeners]) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Bus handler for "${topic}" failed`, error);
        }
      }
    },
    clear(topic) {
      if (topic) {
        topics.delete(topic);
        return;
      }
      topics.clear();
    }
  });
};

export const bus = createBus();
export default bus;
