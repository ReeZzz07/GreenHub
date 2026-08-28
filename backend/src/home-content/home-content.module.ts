import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { HomeContentController } from './home-content.controller';
import { HomeContentService } from './home-content.service';

@Module({
  imports: [MediaModule],
  controllers: [HomeContentController],
  providers: [HomeContentService],
})
export class HomeContentModule {}
