import { Injectable } from '@nestjs/common';
import { getAdminData } from './queries';
import { reviewAccessRequest, reviewOrganizerApplication, setAccountAccess, setServiceProviderVerified } from './actions';

@Injectable()
export class AdminService {
  async getDashboard() {
    return getAdminData();
  }

  async reviewAccessRequest(input: { id: string; decision: 'approved' | 'rejected'; reviewNote?: string }) {
    const formData = new FormData();
    formData.set('id', input.id);
    formData.set('decision', input.decision);
    if (input.reviewNote) formData.set('reviewNote', input.reviewNote);
    return reviewAccessRequest(formData);
  }

  async reviewOrganizerApplication(input: { id: string; decision: 'approved' | 'rejected'; reviewNote?: string }) {
    const formData = new FormData();
    formData.set('id', input.id);
    formData.set('decision', input.decision);
    if (input.reviewNote) formData.set('reviewNote', input.reviewNote);
    return reviewOrganizerApplication(formData);
  }

  async setServiceProviderVerified(vendorId: string, verified: boolean) {
    const formData = new FormData();
    formData.set('vendorId', vendorId);
    formData.set('verified', verified ? 'true' : 'false');
    return setServiceProviderVerified(formData);
  }

  async setAccountAccess(userId: string, action: 'activate' | 'suspend' | 'ban') {
    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('action', action);
    return setAccountAccess(formData);
  }
}
