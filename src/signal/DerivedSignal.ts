import { Signal, currentObserver, escapeObserver, observer } from "./signal.ts";

const sUnset = Symbol("unset");

class DerivedSignal<T> extends Signal<T> {
  private result: T | typeof sUnset = sUnset;
  private resultHash = 0;
  private $revisionId = 0;
  private dependents: Signal<unknown>[] = [];

  constructor(private calculate: () => T) {
    super();
  }

  get revisionId(): number {
    return this.$revisionId;
  }

  private calculateHash(): number {
    let hash = 0;
    for (const dependent of this.dependents) {
      hash = Math.imul(hash, 31) + dependent.signalId;
      hash = Math.imul(hash, 31) + dependent.revisionId;
    }
    return hash;
  }

  get value(): T {
    if (this.result === sUnset || this.resultHash !== this.calculateHash()) {
      const self = this;
      const dependents: Signal<unknown>[] = [];
      const parentObserver = currentObserver();
      const result = escapeObserver(
        observer({
          onRead(signal, currentValue) {
            if (!dependents.includes(signal)) {
              dependents.push(signal);
              parentObserver.onRead(signal, currentValue); // note: Is this different behavior? Maybe different in 'observer' sense(but same in all of my use)
            }
          },
        }),
        () => self.calculate(),
      );

      this.$revisionId++;
      this.result = result;
      this.resultHash = this.calculateHash(); // kind/count of dependents may differ
      this.dependents = dependents;
      return result;
    } else {
      return this.result;
    }
  }
}

export function derivedSignal<T>(calculate: () => T): Signal<T> {
  return new DerivedSignal(calculate);
}
