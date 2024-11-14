import { Injectable } from '@nestjs/common';
import { ProtectedRepo } from './protected.repository';
import { PostSchema, User } from './types';

@Injectable()
export class AppService {
  private repo = new ProtectedRepo();

  async createPost(user: User, post: Partial<PostSchema>) {
    return await this.repo.create.posts(post).for(user);
  }

  async getPostById(user: User, id: string) {
    return await this.repo.read.posts(id).for(user);
  }

  async updatePost(user: User, id: string, post: Partial<PostSchema>) {
    return await this.repo.update.posts(id).for(user).with(post);
  }

  async deletePost(user: User, id: string) {
    await this.repo.delete.posts(id).for(user);
  }
}
