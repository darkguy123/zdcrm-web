import { Injectable } from '@nestjs/common';

@Injectable()
export class BranchesService {
  list() {
    return {
      success: true,
      data: [],
      message: 'Branches list scaffolded',
    };
  }
}
