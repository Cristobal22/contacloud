// A simple event emitter for our custom errors
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, payload: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(payload));
  }
}

export const errorEmitter = new EventEmitter();
