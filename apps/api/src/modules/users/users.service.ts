import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  list() {
    return {
      success: true,
      data: [],
      message: 'Users list scaffolded',
    };
  }
}
