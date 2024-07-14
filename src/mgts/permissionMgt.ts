export type Permission = 'r' | 'w' | 'rw' | 'none';

export class PermissionValueObject {
  constructor(public permission: Permission) {}

  allowedToRead(): boolean {
    return this.permission === 'r' || this.permission === 'rw';
  }
  allowedToWrite(): boolean {
    return this.permission === 'w' || this.permission === 'rw';
  }
}
