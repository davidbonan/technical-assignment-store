import 'reflect-metadata';

export const defineMetadata = (metadataKey: string, metadataValue: any, target: Object, propertyKey: string) => {
  Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
};

export const getMetadata = (metadataKey: string, target: Object, propertyKey: string) => {
  return Reflect.getMetadata(metadataKey, target, propertyKey);
};
