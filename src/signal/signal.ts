import { AsyncLocalStorage } from "node:async_hooks";

export abstract class Observer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRead<T>(signal: Signal<T>, currentValue: T): void {
    /* empty */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onWrite<T>(signal: MutableSignal<T>, newValue: T): void {
    /* empty */
  }

  onEnter<R>(other: Observer, block: () => R): R {
    return observerStore.run(new ObserverInstance(this, other), block);
  }

  enter<R>(block: () => R): R {
    return currentObserver().onEnter(this, block);
  }
}

export class ObserverInstance extends Observer {
  constructor(private current: Observer, private parent: Observer) {
    super();
  }

  onRead<T>(signal: Signal<T>, currentValue: T) {
    this.current.onRead(signal, currentValue);
    this.parent.onRead(signal, currentValue);
  }

  onWrite<T>(signal: MutableSignal<T>, newValue: T) {
    this.current.onWrite(signal, newValue);
    this.parent.onWrite(signal, newValue);
  }
}
const emptyObserver: Observer = new (class extends Observer {})();

const notifiers: Observer[] = [];
const globalObserver = new (class extends Observer {
  onRead<T>(signal: Signal<T>, currentValue: T): T {
    for (const notifier of notifiers) {
      notifier.onRead(signal, currentValue);
    }
    return currentValue;
  }
  onWrite<T>(signal: MutableSignal<T>, newValue: T): void {
    for (const notifier of notifiers) {
      notifier.onWrite(signal, newValue);
    }
  }
})();

const observerStore = new AsyncLocalStorage<Observer>();

export function currentObserver(): Observer {
  return observerStore.getStore() ?? globalObserver;
}

let globalSignalIds = 0;
export abstract class Signal<T> {
  readonly signalId = globalSignalIds++;

  abstract get revisionId(): number;

  abstract get value(): T;
}

export class MutableSignal<T> extends Signal<T> {
  private $revisionId = 0;

  constructor(private $value: T) {
    super();
  }

  isEqual(previousValue: T, newValue: T): boolean {
    return Object.is(previousValue, newValue);
  }

  get revisionId(): number {
    return this.$revisionId;
  }

  get value(): T {
    currentObserver().onRead(this, this.$value);
    return this.$value;
  }

  set value(newValue: T) {
    this.$value = newValue;
    this.$revisionId++;
    currentObserver().onWrite(this, newValue);
  }
}

// More Utilities!

export function observer(data: Partial<Observer>): Observer {
  return Object.assign(new (class extends Observer {})(), data);
}

export function escapeObserver<R>(block: () => R): R;

export function escapeObserver<R>(observer: Observer, block: () => R): R;

export function escapeObserver<R>(a: Observer | (() => R), b?: () => R): R {
  if (b) {
    return observerStore.run(a as Observer, b);
  } else {
    return observerStore.run(emptyObserver, a as () => R);
  }
}

export function observeRead<R>(
  onRead: (signal: Signal<unknown>) => void,
  block: () => R,
): R {
  const observer = new (class extends Observer {
    onRead<T>(signal: Signal<T>, _currentValue: T) {
      onRead(signal);
    }
  })();

  return observer.enter(block);
}

export function signal<T>(initialValue: T): MutableSignal<T> {
  return new MutableSignal(initialValue);
}
