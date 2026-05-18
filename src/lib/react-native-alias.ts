import * as RNW from 'react-native-web';

const ReactNativeWeb = (RNW as any).default || RNW || {};

// Define __DEV__ for compatibility with libraries that expect it (like Expo)
if (typeof (globalThis as any).__DEV__ === 'undefined') {
  (globalThis as any).__DEV__ = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV !== 'production' : true;
}

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};

export const NativeModules = ReactNativeWeb.NativeModules || {};

class MockEventEmitter {
  addListener() { return { remove: () => {} }; }
  removeListeners() { }
  removeAllListeners() { }
  emit() { }
}

export const EventEmitter = ReactNativeWeb.EventEmitter || MockEventEmitter;
export const NativeEventEmitter = ReactNativeWeb.NativeEventEmitter || class extends (EventEmitter as any) {};
export const DeviceEventEmitter = ReactNativeWeb.DeviceEventEmitter || new MockEventEmitter();

export const NativeModulesProxy = (NativeModules as any).NativeModulesProxy || {
  EventEmitter: new MockEventEmitter(),
  callMethod: async () => {},
  addListener: () => ({ remove: () => {} }),
  removeListeners: () => {},
};

// Ensure it's available in all potential locations
(NativeModules as any).NativeModulesProxy = NativeModulesProxy;
if (ReactNativeWeb.NativeModules) {
  ReactNativeWeb.NativeModules.NativeModulesProxy = NativeModulesProxy;
}

(NativeModules as any).ExponentConstants = (NativeModules as any).ExponentConstants || {};
(NativeModules as any).ExponentDevice = (NativeModules as any).ExponentDevice || {};

export const Platform = ReactNativeWeb.Platform || { OS: 'web', select: (obj: any) => obj.web || obj.default };

export const requireNativeModule = (name: string) => ({});

export class CodedError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class UnavailabilityError extends CodedError {
  constructor(moduleName: string, propertyName: string) {
    super('ERR_UNAVAILABLE', `The method or property ${moduleName}.${propertyName} is not available on web, are you sure you've linked it properly?`);
  }
}

// Re-export everything from react-native-web
export * from 'react-native-web';

// Populate globals for Expo
if (typeof (globalThis as any).NativeModulesProxy === 'undefined') {
  (globalThis as any).NativeModulesProxy = NativeModulesProxy;
}

if (typeof (globalThis as any).ExpoModules === 'undefined') {
  (globalThis as any).ExpoModules = {};
}

export default {
  ...ReactNativeWeb,
  TurboModuleRegistry,
  NativeModules,
  NativeModulesProxy,
  NativeEventEmitter,
  EventEmitter,
  DeviceEventEmitter,
  requireNativeModule,
  CodedError,
  UnavailabilityError,
};
