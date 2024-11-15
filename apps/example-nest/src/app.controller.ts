import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AppRepo } from './app.repository';
import { User } from './types';

const user: User = {
  id: '123',
  role: 'user',
}

@Controller()
export class AppController {
  constructor(private readonly appRepo: AppRepo) {}

  @Post()
  async create() {
    return await this.appRepo.createPost(user, {
      ownerId: user.id,
      title: 'Title: ' + Math.floor(Math.random() * 100),
      content: 'This is my post'
    });
  }

  @Get(':id')
  async read(
    @Param('id') id: string,
  ) {
    return await this.appRepo.getPostById(user, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
  ) {
    return await this.appRepo.updatePost(user, id, {
      title: 'A new title: ' + Math.floor(Math.random() * 100),
    })
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ) {
    await this.appRepo.deletePost(user, id);
  }
}
