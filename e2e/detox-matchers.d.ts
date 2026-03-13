declare global {
  namespace jest {
    // Detox extends Jest matchers at runtime; make TS aware of it.
    interface Matchers<R> {
      toExist(): R;
    }
  }
}

export {};
