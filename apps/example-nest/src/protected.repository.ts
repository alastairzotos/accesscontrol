import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AccessControl, ProtectedRepository } from "@bitmetro/accesscontrol";
import { PostSchema, User, UserRole } from "./types";
import { MockDb } from "./mockDb";

export type ResourceMap = {
  posts: PostSchema;
};

export class ProtectedRepo extends ProtectedRepository<User, ResourceMap, UserRole> {
  private db = new MockDb();

  constructor() {
    super();

    const ac = this.createConfig();

    ac.grant('user')
      .manageOwn('posts')
  }

  private createConfig() {
    const ac = new AccessControl<User, ResourceMap, UserRole>({
      getUserRole: (user) => user.role,
      checkOwnership: (user, resourceType, resource) => user.id === resource.ownerId,
    });

    this.config({
      accessControl: ac,

      defaultCreate: async (resourceType, value) => {
        return await this.db.create(resourceType, value);
      },
      defaultRead: async (resourceType, resourceId) => {
        return await this.db.read(resourceType, resourceId);
      },
      defaultUpdate: async (resourceType, resourceId, values) => {
        return await this.db.update(resourceType, resourceId, values);
      },
      defaultDelete: async (resourceType, resourceId) => {
        await this.db.delete(resourceType, resourceId);
      },

      throw403(msg) {
        throw new ForbiddenException(msg);
      },

      throw404(msg) {
        throw new NotFoundException(msg);
      },
    })

    return ac;
  }  
}
