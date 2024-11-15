import { Injectable } from '@nestjs/common';
import { ProtectedRepo } from './protected.repository';
import { PostSchema, User } from './types';

@Injectable()
export class AppRepo extends ProtectedRepo {
  async createPost(user: User, post: Partial<PostSchema>) {
    return await this.for(user).create.post(post);
  }

  async getPostById(user: User, id: string) {
    return await this.for(user).read.post(id);
  }

  async updatePost(user: User, id: string, updatedPost: Partial<PostSchema>) {
    return await this.for(user).update.post(id).with(updatedPost);
  }

  async deletePost(user: User, id: string) {
    await this.for(user).delete.post(id);
  }
}
