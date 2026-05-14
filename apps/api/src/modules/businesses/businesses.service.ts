import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessesService {
  list() {
    return {
      success: true,
      data: [],
      message: 'Businesses list scaffolded',
    };
  }
}
