type ResourceMap<C extends string> = Record<C, any>;
type OwnershipChecker<U, RMap extends ResourceMap<string> = ResourceMap<string>> = <C extends keyof RMap>(user: U, resourceType: C, resource?: RMap[C]) => boolean | Promise<boolean>

export interface ACConfig<U, RMap extends ResourceMap<string> = ResourceMap<string>, Roles extends string = string> {
  getUserRole: (user: U) => Roles;
  checkOwnership?: OwnershipChecker<U, RMap>;
}

export type PermissionCheck<U, R = any> = (user: U, resource?: R) => Promise<boolean> | boolean;
const defaultPermissionCheck: PermissionCheck<any, any> = () => true;

export type AuthAction = 'create' | 'read' | 'update' | 'delete';

export type Permissions<U, R = any> = Record<AuthAction, PermissionCheck<U, R>>

export class Grant<U, C extends string, RMap extends ResourceMap<C>> {
  /** @internal */
  permissions: Record<string, Permissions<U, RMap[C]>> = {};

  /** @internal */
  constructor(
    private readonly ownershipChecker: OwnershipChecker<U, RMap> | undefined
  ) {}

  manageOwn<K extends C>(resourceType: K) {
    if (this.ownershipChecker === undefined) {
      throw new Error(`'checkOwnership' not supplied to AccessControl constructor`);
    }

    const ownershipCheck: PermissionCheck<U, RMap[K]> = async (user, resource) =>
      await this.ownershipChecker!(user, resourceType, resource);

    return this
      .create(resourceType)
      .read(resourceType, ownershipCheck)
      .update(resourceType, ownershipCheck)
      .delete(resourceType, ownershipCheck);
  }

  create<K extends C>(resourceType: K, check: PermissionCheck<U, RMap[K]> = defaultPermissionCheck) {
    this.permissions[resourceType] = this.permissions[resourceType] || {};
    this.permissions[resourceType].create = check as any;
    return this;
  }

  read<K extends C>(resourceType: K, check: PermissionCheck<U, RMap[K]> = defaultPermissionCheck) {
    this.permissions[resourceType] = this.permissions[resourceType] || {};
    this.permissions[resourceType].read = check as any;
    return this;
  }

  update<K extends C>(resourceType: K, check: PermissionCheck<U, RMap[K]> = defaultPermissionCheck) {
    this.permissions[resourceType] = this.permissions[resourceType] || {};
    this.permissions[resourceType].update = check as any;
    return this;
  }

  delete<K extends C>(resourceType: K, check: PermissionCheck<U, RMap[K]> = defaultPermissionCheck) {
    this.permissions[resourceType] = this.permissions[resourceType] || {};
    this.permissions[resourceType].delete = check as any;
    return this;
  }
}

export class PermissionChecker<U, C extends string, RMap extends ResourceMap<C>> {
  constructor(private user: U, private grant: Grant<U, C, RMap>) { }

  execute<K extends C>(action: AuthAction) {
    return {
      on: async (resourceType: K, resource?: RMap[K]) => {
        switch (action) {
          case 'create':
            return await this.create(resourceType, resource);

          case 'read':
            return await this.read(resourceType, resource);

          case 'update':
            return await this.update(resourceType, resource);

          case 'delete':
            return await this.delete(resourceType, resource);
        }
      }
    }
  }

  async create<K extends C>(resourceType: K, resource?: RMap[K]) {
    return await this.grant.permissions[resourceType]?.create?.(this.user, resource) || false;
  }

  async read<K extends C>(resourceType: K, resource?: RMap[K]) {
    return await this.grant.permissions[resourceType]?.read?.(this.user, resource) || false;
  }

  async update<K extends C>(resourceType: K, resource?: RMap[K]) {
    return await this.grant.permissions[resourceType]?.update?.(this.user, resource) || false;
  }

  async delete<K extends C>(resourceType: K, resource?: RMap[K]) {
    return await this.grant.permissions[resourceType]?.delete?.(this.user, resource) || false;
  }
}

export class AccessControl<U, RMap extends ResourceMap<string> = ResourceMap<string>, Roles extends string = string> {
  private grants = {} as Record<Roles, Grant<U, Extract<keyof RMap, string>, RMap>>;
  private defaultGrant: Grant<U, Extract<keyof RMap, string>, RMap>;

  constructor(private config: ACConfig<U, RMap, Roles>) {
    this.defaultGrant = new Grant<U, Extract<keyof RMap, string>, RMap>(this.config.checkOwnership)
  }

  grant(role: Roles) {
    const grant = new Grant<U, Extract<keyof RMap, string>, RMap>(this.config.checkOwnership);

    this.grants[role] = grant;

    return grant;
  }

  can(user: U): PermissionChecker<U, Extract<keyof RMap, string>, RMap> {
    const grant = this.grants[this.config.getUserRole(user)];

    return new PermissionChecker<U, Extract<keyof RMap, string>, RMap>(user, grant || this.defaultGrant);
  }
}
