/**
 * Drizzle ORM mock for unit tests.
 *
 * Each call to select/insert/update/delete returns a thenable chain.
 * When awaited, the chain consumes the next value pushed via queueResult.
 */
export interface DbMock {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  queueResult: (value: unknown) => void;
  reset: () => void;
}

export function createDbMock(): DbMock {
  const queue: unknown[] = [];

  function makeChain(): unknown {
    const proxy: unknown = new Proxy(function () {}, {
      get(_target, prop) {
        if (prop === 'then') {
          if (queue.length === 0) {
            throw new Error(
              'createDbMock: no result queued for this call',
            );
          }
          const result = queue.shift();
          return (resolve: (v: unknown) => unknown) => resolve(result);
        }
        return () => proxy;
      },
      apply() {
        return proxy;
      },
    });
    return proxy;
  }

  const select = jest.fn(() => makeChain());
  const insert = jest.fn(() => makeChain());
  const update = jest.fn(() => makeChain());
  const del = jest.fn(() => makeChain());

  return {
    select,
    insert,
    update,
    delete: del,
    queueResult: (value) => queue.push(value),
    reset: () => {
      queue.length = 0;
      select.mockClear();
      insert.mockClear();
      update.mockClear();
      del.mockClear();
    },
  };
}
