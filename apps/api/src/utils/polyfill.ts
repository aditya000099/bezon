import nodeUtil from 'util';

// Node 23+ removed the deprecated util.isNullOrUndefined function.
// We polyfill it here to prevent @tensorflow/tfjs-node from crashing.
if (typeof (nodeUtil as any).isNullOrUndefined !== 'function') {
  (nodeUtil as any).isNullOrUndefined = (v: any) => v === null || v === undefined;
}
