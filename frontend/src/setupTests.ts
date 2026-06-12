import '@testing-library/jest-dom';

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs it.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
