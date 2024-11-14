import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { User } from './types';

const user: User = {
  id: '123',
  role: 'user',
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async create() {
    return await this.appService.createPost(user, {
      ownerId: user.id,
      title: 'Title: ' + Math.floor(Math.random() * 100),
      content: 'This is my post'
    });
  }

  @Get(':id')
  async read(
    @Param('id') id: string,
  ) {
    return await this.appService.getPostById(user, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
  ) {
    return await this.appService.updatePost(user, id, {
      title: 'A new title: ' + Math.floor(Math.random() * 100),
    })
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ) {
    await this.appService.deletePost(user, id);
  }
}
