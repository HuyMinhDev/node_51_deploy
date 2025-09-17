import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/modules-system/prisma/prisma.service';
import { QueryArticleDto } from './dto/query-article.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: QueryArticleDto) {
    let { page, pageSize, filters: filtersStringJson } = query;
    page = +page > 0 ? +page : 1;
    pageSize = +pageSize > 0 ? +pageSize : 3;
    const filters = JSON.parse(filtersStringJson || '{}') || {};
    //index (OFFSET) = ( page - 1 ) * pageSize
    const index = (page - 1) * pageSize;
    // Lọc dữ liệu
    // Object.entries(filters) trả về mảng
    Object.entries(filters).forEach(([key, value]) => {
      console.log({ key, value });
      if (value === null || value === undefined || value === '') {
        delete filters[key];
        return;
      }
      if (typeof value === 'string') {
        filters[key] = {
          contains: value,
        };
      }
      // TODO: Xử lý ngày tháng
    });

    console.log(
      'page: ',
      page,
      'pageSize: ',
      pageSize,
      'index: ',
      index,
      'filters: ',
      filters,
    );
    const articlesPromise = this.prisma.articles.findMany({
      //SQL: OFFSET
      skip: index,
      //SQL: LIMIT
      take: pageSize,
      where: {
        ...filters,
        //xóa mềm
        // isActive: false,
      },
    });
    const totalItemPromise = this.prisma.articles.count();
    const [articles, totalItem] = await Promise.all([
      articlesPromise,
      totalItemPromise,
    ]);
    const totalPage = Math.ceil(totalItem / pageSize);

    return {
      page: page,
      pageSize: pageSize,
      totalItem: totalItem,
      totalPage: totalPage,
      items: articles || [],
    };
  }
}
