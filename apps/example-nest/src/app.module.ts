import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppRepo } from './app.repository';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppRepo],
})
export class AppModule {}
