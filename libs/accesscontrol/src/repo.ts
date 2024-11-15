import { AccessControl, AuthAction } from "./ac";

type ReadQuery<T> = number | string | (() => Promise<T>);

type CreateAccess<ResourceMap extends Record<string, any>> = {
  [K in keyof ResourceMap]: <T extends ResourceMap[K] = ResourceMap[K]>(values: Partial<T>) => Promise<T | undefined>
}

type ReadAccess<ResourceMap extends Record<string, any>> = {
  [K in keyof ResourceMap]: <T extends ResourceMap[K] = ResourceMap[K]>(query: ReadQuery<T>) => Promise<T | undefined>
}

type UpdateAccess<ResourceMap extends Record<string, any>> = {
  [K in keyof ResourceMap]: <T extends ResourceMap[K] = ResourceMap[K]>(id: number | string) => {
    with: (values: Partial<T>) => Promise<T | undefined>
  }
}

type DeleteAccess<ResourceMap extends Record<string, any>> = {
  [K in keyof ResourceMap]: <T = ResourceMap[K]>(id: number | string) => Promise<T | void | undefined>
}

type ForUser<ResourceMap extends Record<string, any>> = {
  create: CreateAccess<ResourceMap>;
  read: ReadAccess<ResourceMap>;
  update: UpdateAccess<ResourceMap>;
  delete: DeleteAccess<ResourceMap>;
}

type ProtectedConfig<User, ResourceMap extends Record<string, any>, Roles extends string> = {
  accessControl: AccessControl<User, ResourceMap, Roles>;
  defaultCreate<K extends keyof ResourceMap>(resourceType: K, value: Partial<ResourceMap[K]>): Promise<ResourceMap[K]>;
  defaultRead<K extends keyof ResourceMap>(resourceType: K, resourceId: number | string): Promise<ResourceMap[K]>;
  defaultUpdate<K extends keyof ResourceMap>(resourceType: K, resourceId: number | string, values: Partial<ResourceMap[K]>): Promise<ResourceMap[K]>
  defaultDelete<K extends keyof ResourceMap>(resourceType: K, resourceId: number | string): Promise<ResourceMap[K] | void | undefined>;
  throw404?(msg: string): void;
  throw403?(msg: string): void;
}

export class ProtectedRepository<User, ResourceMap extends Record<string, any>, Roles extends string> {
  protected _config?: ProtectedConfig<User, ResourceMap, Roles>;
  private _throw403?: (msg: string) => void;
  private _throw404?: (msg: string) => void;

  protected config(config: ProtectedConfig<User, ResourceMap, Roles>) {
    this._config = config;

    this._throw404 = config.throw404 || ((msg) => {
      throw new Error(msg)
    })

    this._throw403 = config.throw403 || ((msg) => {
      throw new Error(msg)
    })
  }

  for(user: User): ForUser<ResourceMap> {
    return {
      create: new Proxy({} as CreateAccess<ResourceMap>, {
        get: <K extends Extract<keyof ResourceMap, string>>(target: CreateAccess<ResourceMap>, property: K) => {
          if (!(property in target)) {
            target[property] = async (value: Partial<ResourceMap[K]>) => {
              await this.can(user, 'create', property);
              return await this._config?.defaultCreate(property, value);
            }
          }
          return target[property];
        }
      }),

      read: new Proxy({} as ReadAccess<ResourceMap>, {
        get: <K extends Extract<keyof ResourceMap, string>>(target: ReadAccess<ResourceMap>, property: K) => {
          if (!(property in target)) {
            target[property] = async (query: ReadQuery<ResourceMap[K]>) => {
              return await this.can(user, 'read', property, query);
            };
          }

          return target[property];
        }
      }),

      update: new Proxy({} as UpdateAccess<ResourceMap>, {
        get: <K extends Extract<keyof ResourceMap, string>>(target: UpdateAccess<ResourceMap>, property: K) => {
          if (!(property in target)) {
            target[property] = (id: number | string) => ({
              with: async (values: Partial<ResourceMap[K]>) => {
                await this.can(user, 'update', property, id);
                return await this._config?.defaultUpdate(property, id, values);
              }
            })
          }

          return target[property];
        }
      }),

      delete: new Proxy({} as DeleteAccess<ResourceMap>, {
        get: <K extends Extract<keyof ResourceMap, string>>(target: DeleteAccess<ResourceMap>, property: K) => {
          if (!(property in target)) {
            target[property] = async (id: number | string) => {
              await this.can(user, 'delete', property, id);
              return await this._config?.defaultDelete(property, id);
            };
          }

          return target[property];
        }
      })
    };
  }

  async can<K extends keyof ResourceMap>(
    user: User,
    action: AuthAction,
    resourceType: Extract<keyof ResourceMap, string>,
    query?: ReadQuery<ResourceMap[K]>
  ): Promise<ResourceMap[K] | undefined> {
    if (!this._config) {
      throw new Error(`Missing access control configuration`);
    }

    if (action === 'create') {
      if (!await this._config.accessControl.can(user).create(resourceType)) {
        this._throw403?.(`User cannot create resource ${resourceType}`);
        return;
      }
    } else {
      if (query === undefined) {
        throw new Error('Query parameter must be defined');
      }

      const resource = typeof query === 'function'
        ? await query()
        : await this._config.defaultRead(resourceType, query);

      const errorId = typeof query === 'function' ? '<handler>' : query;

      if (!resource) {
        this._throw404?.(`Resource ${resourceType}[${errorId}] does not exist`);
        return;
      }

      const canAccess = await this._config.accessControl.can(user).execute(action).on(resourceType, resource);

      if (!canAccess) {
        this._throw403?.(`User cannot ${action} resource ${resourceType}[${errorId}]`);
      }

      return resource;
    }
  }
}
