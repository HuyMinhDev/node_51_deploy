import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { QueryArticleDto } from './dto/query-article.dto';
import { User } from 'src/common/decorators/user.decorator';
import type { Users } from 'generated/prisma';
import { SkipPermission } from 'src/common/decorators/skip-permission.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
// import { Request, Response } from 'express';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  //http://localhost:3000/article/get-list-article
  @Get()
  @SkipPermission()
  @ApiBearerAuth()
  findAll(
    @Query() query: QueryArticleDto,
    @Param() params,
    @Headers() headers,
    @Body() body,
    @Req() req,
    @User()
    user: Users,
    // @Res() res,
  ) {
    // console.log({ query, params, headers, body });
    console.log({ user: user });
    return this.articleService.findAll(query);
  }
}
