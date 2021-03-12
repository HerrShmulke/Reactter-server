import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { String250Scalar } from 'src/common/scalars/string.scalar';
import { TokenModule } from 'src/token/token.module';
import { User } from 'src/user/user.entity';
import { Post } from './post.entity';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User]), TokenModule],
  providers: [PostService, PostResolver, String250Scalar],
  exports: [PostService],
})
export class PostModule {}
