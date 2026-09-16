import { Injectable } from '@nestjs/common';
import { raiseDispute, resolveDispute } from './actions';
import type { RaiseDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';

@Injectable()
export class DisputesService {
  async raise(dto: RaiseDisputeDto) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    return raiseDispute(formData);
  }

  async resolve(dto: ResolveDisputeDto) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    return resolveDispute(formData);
  }
}
