import { useSyncExternalStore } from "react";

type Setter<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

type Listener = () => void;

export type StoreApi<T> = {
  getState: () => T;
  setState: Setter<T>;
  subscribe: (listener: Listener) => () => void;
};

export type StateCreator<T> = (set: Setter<T>, get: () => T) => T;

export const createStore = <T>(initializer: StateCreator<T>) => {
  let state: T;
  const listeners = new Set<Listener>();

  const setState: Setter<T> = (update) => {
    const next = typeof update === "function" ? { ...state, ...(update as (s: T) => Partial<T>)(state) } : { ...state, ...update };
    if (Object.is(next, state)) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  const getState = () => state;

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  const useStore = <SelectorOutput>(
    selector: (state: T) => SelectorOutput = (s) => s as unknown as SelectorOutput,
    equality: (a: SelectorOutput, b: SelectorOutput) => boolean = Object.is
  ) => {
    return useSyncExternalStore(
      subscribe,
      () => {
        const selected = selector(state);
        return selected;
      },
      () => selector(state)
    );
  };

  return Object.assign(useStore, {
    getState,
    setState,
    subscribe,
  });
};
