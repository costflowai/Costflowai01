export function builder() {
  const documents = [];
  return {
    ref(field) {
      this._ref = field;
    },
    field(name) {
      if (!this._fields) this._fields = [];
      this._fields.push(name);
    },
    add(doc) {
      documents.push(doc);
    },
    build() {
      const index = Object.create(null);
      for (const doc of documents) {
        const ref = doc[this._ref];
        for (const field of this._fields) {
          const tokens = String(doc[field] ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
          for (const token of tokens) {
            if (!index[token]) index[token] = new Set();
            index[token].add(ref);
          }
        }
      }
      return {
        search(query) {
          const qTokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
          const matches = qTokens.map(token => index[token] ? new Set(index[token]) : new Set());
          if (!matches.length) return [];
          let intersection = matches[0];
          for (let i = 1; i < matches.length; i += 1) {
            intersection = new Set([...intersection].filter(x => matches[i].has(x)));
          }
          return [...intersection].map(ref => ({ ref }));
        },
        toJSON() {
          const serialised = {};
          for (const [token, refs] of Object.entries(index)) {
            serialised[token] = [...refs];
          }
          return { index: serialised, ref: this._ref, fields: this._fields };
        }
      };
    }
  };
}

export function Index(data) {
  const map = Object.create(null);
  for (const [token, refs] of Object.entries(data.index)) {
    map[token] = new Set(refs);
  }
  return {
    search(query) {
      const tokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const matches = tokens.map(token => map[token] ? new Set(map[token]) : new Set());
      if (!matches.length) return [];
      let intersection = matches[0];
      for (let i = 1; i < matches.length; i += 1) {
        intersection = new Set([...intersection].filter(x => matches[i].has(x)));
      }
      return [...intersection].map(ref => ({ ref }));
    }
  };
}
