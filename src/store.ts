import 'reflect-metadata';
import { JSONArray, JSONObject, JSONPrimitive } from './json-types';
import { _assert, _assertTrue } from './mgts/assertMgt';
import { isFunction } from './mgts/functionMgt';
import { defineMetadata, getMetadata } from './mgts/metadataMgt';
import { isObject } from './mgts/objectMgt';
import { Permission, PermissionValueObject } from './mgts/permissionMgt';

type StoreResult = Store | JSONPrimitive | undefined;

type StoreValue = JSONObject | JSONArray | StoreResult | (() => StoreResult);

interface IStore {
  defaultPolicy: Permission;
  allowedToRead(key: string): boolean;
  allowedToWrite(key: string): boolean;
  read(path: string): StoreResult;
  write(path: string, value: StoreValue): StoreValue;
  writeEntries(entries: JSONObject): void;
  entries(): JSONObject;
}

const METADATA_KEY = 'restrict-decorator';
export function Restrict(permission?: Permission): any {
  return function (target: IStore, key: string) {
    _assertTrue(target instanceof Store, 'Restrict decorator can only be used on Store');
    defineMetadata(METADATA_KEY, permission, target, key);
  };
}

export class Store implements IStore {
  defaultPolicy: Permission = 'rw';

  [key: string]: any;

  allowedToRead(key: string): boolean {
    const permission = this.getPermissionFrom(key);
    return permission.allowedToRead();
  }

  allowedToWrite(key: string): boolean {
    const permission = this.getPermissionFrom(key);
    return permission.allowedToWrite();
  }

  read(path: string): StoreResult {
    const permission = this.getPermissionFrom(path);
    _assertTrue(permission.allowedToRead(), `Permission denied to read from path ${path}`);
    return this.getValue(path);
  }

  write(path: string, value: StoreValue): StoreValue {
    const permission = this.getPermissionFrom(path);
    _assertTrue(permission.allowedToWrite(), `Permission denied to write to path ${path}`);
    return this.setValue(path, value);
  }

  writeEntries(entries: JSONObject): void {
    Object.keys(entries).forEach((key) => {
      const value = entries[key];
      this.write(key, value);
    });
  }

  entries(): JSONObject {
    return Object.entries(this).reduce((acc, [key, value]) => {
      if (this.allowedToRead(key)) {
        acc[key] = value;
      }
      return acc;
    }, {} as JSONObject);
  }

  private setValue(path: string, value: StoreValue): StoreValue {
    const { primaryKey, keys } = getPathInfo(path);
    const result = keys.reverse().reduce((acc, key, index) => {
      acc = { [key]: index === 0 ? value : acc } as StoreValue;
      return acc;
    }, undefined as StoreValue);
    this[primaryKey] = replaceReservedKeyword(result || value);
    return this.getValue(path);
  }

  private getValue(path: string): StoreResult {
    const { primaryKey, keys } = getPathInfo(path);
    const result = keys.reduce(
      (acc, key) => {
        acc = isFunction(acc[key]) ? acc[key]() : acc[key];
        return acc;
      },
      isFunction(this[primaryKey]) ? this[primaryKey]() : this[primaryKey]
    );
    return result;
  }

  private getPermissionFrom(path: string) {
    const { primaryKey, keys } = getPathInfo(path);
    let currentStore = this;
    let currentPermission = undefined;
    for (const key of [primaryKey, ...keys]) {
      if (isStore(this[key])) {
        currentStore = this[key];
      }

      const permissionValue = getMetadata(METADATA_KEY, currentStore, key);
      if (permissionValue !== undefined) {
        currentPermission = permissionValue;
      }
    }

    return new PermissionValueObject(currentPermission || this.defaultPolicy);
  }
}

const isStore = (value: any): value is Store => value instanceof Store;

const getPathInfo = (path: string) => {
  const keys = path.split(':');
  const primaryKey = keys.at(0);
  _assert(primaryKey, `Invalid path ${path}`);
  return { primaryKey, keys: keys.slice(1) };
};

const replaceReservedKeyword = (value: StoreValue) => {
  if (isObject(value)) {
    for (const key of Object.keys(value)) {
      if (key === 'store' && !isStore(value[key])) {
        const refValue = structuredClone(value[key]);
        value[key] = new Store();
        value[key].writeEntries(refValue);
      }
    }
  }
  return value;
};
