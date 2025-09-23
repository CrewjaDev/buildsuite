import api from '@/lib/api'
import type { BusinessType } from '@/types/features/business/businessTypes'

class BusinessTypeService {
  async getBusinessTypes(): Promise<BusinessType[]> {
    const response = await api.get('/business-types')
    return response.data.data
  }

  async getActiveBusinessTypes(): Promise<BusinessType[]> {
    const response = await api.get('/business-types/active')
    return response.data.data
  }

  async getBusinessTypesByCategory(category: string): Promise<BusinessType[]> {
    const response = await api.get('/business-types', { params: { category, is_active: true } })
    return response.data.data
  }

  async getBusinessType(id: number): Promise<BusinessType> {
    const response = await api.get(`/business-types/${id}`)
    return response.data.data
  }
}

export const businessTypeService = new BusinessTypeService()