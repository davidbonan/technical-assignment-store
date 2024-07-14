export type AssertMessage = string;

export function _assert<T>(value: T, message?: AssertMessage): asserts value is NonNullable<T> {
  if (value !== undefined && value !== null && typeof value !== 'boolean') {
    return;
  }

  if (typeof value === 'boolean') {
    console.error('do not use _assert for boolean value, use _assertTrue instead');
  }

  throw new Error(message);
}

export function _assertTrue(value: boolean, message?: AssertMessage): asserts value {
  if (value === true) {
    return;
  }
  throw new Error(message);
}
