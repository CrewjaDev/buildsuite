import { useQuery } from '@tanstack/react-query';
import { businessCodeService, BusinessCodeListResponse, BusinessCodeDetailResponse, BusinessCodePermissionsResponse, BusinessCodeAssignmentStatusResponse, UseBusinessCodesParams } from '@/services/features/business/businessCodeService';

// ビジネスコード一覧取得
export const useBusinessCodes = (params?: UseBusinessCodesParams) => {
  return useQuery<BusinessCodeListResponse>({
    queryKey: ['businessCodes', params],
    queryFn: () => businessCodeService.getBusinessCodes(params),
    staleTime: 5 * 60 * 1000, // 5分
  });
};

// ビジネスコード詳細取得
export const useBusinessCodeDetail = (code: string) => {
  return useQuery<BusinessCodeDetailResponse>({
    queryKey: ['businessCode', code],
    queryFn: () => businessCodeService.getBusinessCodeDetail(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5分
  });
};

// ビジネスコード権限取得
export const useBusinessCodePermissions = (code: string) => {
  return useQuery<BusinessCodePermissionsResponse>({
    queryKey: ['businessCodePermissions', code],
    queryFn: () => businessCodeService.getBusinessCodePermissions(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5分
  });
};

// ビジネスコード付与状況取得
export const useBusinessCodeAssignmentStatus = (code: string) => {
  return useQuery<BusinessCodeAssignmentStatusResponse>({
    queryKey: ['businessCodeAssignmentStatus', code],
    queryFn: () => businessCodeService.getBusinessCodeAssignmentStatus(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5分
  });
};

// 統合フック：ビジネスコードのすべての情報を一度に取得
export const useBusinessCode = (code: string) => {
  const detail = useBusinessCodeDetail(code);
  const permissions = useBusinessCodePermissions(code);
  const assignmentStatus = useBusinessCodeAssignmentStatus(code);

  return {
    detail,
    permissions,
    assignmentStatus,
    isLoading: detail.isLoading || permissions.isLoading || assignmentStatus.isLoading,
    error: detail.error || permissions.error || assignmentStatus.error,
  };
};