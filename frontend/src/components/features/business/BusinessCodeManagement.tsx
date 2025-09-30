'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  Shield, 
  FileText, 
  Search,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useBusinessCodes, useBusinessCodePermissions, useBusinessCodeAssignmentStatus } from '@/hooks/features/business/useBusinessCode';
import { BusinessCode } from '@/services/features/business/businessCodeService';

const BusinessCodeManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<BusinessCode | null>(null);

  const { data: businessCodesResponse, isLoading, error } = useBusinessCodes({
    category: selectedCategory === 'all' ? undefined : selectedCategory
  });

  const businessCodes = businessCodesResponse?.data?.business_codes || [];

  // 検索フィルタリング
  const filteredBusinessCodes = businessCodes.filter(bc => 
    bc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Shield className="h-4 w-4" />;
      case 'financial':
        return <FileText className="h-4 w-4" />;
      case 'construction':
        return <Building2 className="h-4 w-4" />;
      case 'general':
        return <Users className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'system':
        return 'システム';
      case 'financial':
        return '財務';
      case 'construction':
        return '工事';
      case 'general':
        return '一般';
      default:
        return category;
    }
  };

  const getStatusIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">ビジネスコード一覧を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">ビジネスコード一覧の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ビジネスコード管理</h1>
          <p className="text-gray-600 mt-1">
            ビジネスコード単位での権限管理を行います
          </p>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">検索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="ビジネスコード名、コード、説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">カテゴリー</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="system">システム</SelectItem>
                  <SelectItem value="financial">財務</SelectItem>
                  <SelectItem value="construction">工事</SelectItem>
                  <SelectItem value="general">一般</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ビジネスコード一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ビジネスコード一覧</CardTitle>
          <CardDescription>
            {filteredBusinessCodes.length}件のビジネスコードが見つかりました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ビジネスコード</TableHead>
                <TableHead>カテゴリー</TableHead>
                <TableHead>権限数</TableHead>
                <TableHead>権限付与状況</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinessCodes.map((businessCode) => (
                <TableRow key={businessCode.code}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{businessCode.name}</div>
                      <div className="text-sm text-gray-500">{businessCode.code}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {businessCode.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(businessCode.category)}
                      <Badge variant={businessCode.is_system ? "default" : "secondary"}>
                        {getCategoryLabel(businessCode.category)}
                      </Badge>
                      {businessCode.is_core && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          コア
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{businessCode.permissions_count}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(businessCode.assigned_levels.length > 0)}
                        <span>システム権限レベル: {businessCode.assigned_levels.length}件</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(businessCode.assigned_roles.length > 0)}
                        <span>役割: {businessCode.assigned_roles.length}件</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(businessCode.assigned_departments.length > 0)}
                        <span>部署: {businessCode.assigned_departments.length}件</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(businessCode.assigned_positions.length > 0)}
                        <span>職位: {businessCode.assigned_positions.length}件</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBusinessCode(businessCode)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ビジネスコード詳細 */}
      {selectedBusinessCode && (
        <BusinessCodeDetail
          businessCode={selectedBusinessCode}
          onClose={() => setSelectedBusinessCode(null)}
        />
      )}
    </div>
  );
};

// ビジネスコード権限コンポーネント
interface BusinessCodePermissionsProps {
  businessCode: BusinessCode;
}

const BusinessCodePermissions: React.FC<BusinessCodePermissionsProps> = ({ businessCode }) => {
  const { data: permissionsResponse, isLoading, error } = useBusinessCodePermissions(businessCode.code);
  const permissions = permissionsResponse?.data?.permissions || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">権限一覧を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">権限一覧の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">権限一覧</h3>
        <Badge variant="outline">{permissions.length}件の権限</Badge>
      </div>
      
      <div className="grid gap-3">
        {permissions.map((permission) => (
          <Card key={permission.name} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {permission.name}
                  </code>
                  <Badge variant="secondary" className="text-xs">
                    {permission.name && permission.name.split('.').length > 1 ? '詳細権限' : '基本権限'}
                  </Badge>
                </div>
                <h4 className="font-medium text-gray-900">{permission.display_name}</h4>
                {permission.description && (
                  <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-500">有効</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {permissions.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">このビジネスコードには権限が設定されていません</p>
        </div>
      )}
    </div>
  );
};

// ビジネスコード付与状況コンポーネント
interface BusinessCodeAssignmentStatusProps {
  businessCode: BusinessCode;
}

const BusinessCodeAssignmentStatus: React.FC<BusinessCodeAssignmentStatusProps> = ({ businessCode }) => {
  const { data: assignmentResponse, isLoading, error } = useBusinessCodeAssignmentStatus(businessCode.code);
  const assignmentStatus = assignmentResponse?.data?.assignment_status;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">付与状況を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">付与状況の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  if (!assignmentStatus) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">付与状況データがありません</p>
      </div>
    );
  }

  const renderAssignmentTable = (title: string, items: Array<{id: number; name: string; display_name?: string; has_permission: boolean; assigned_count: number; total_count: number}>, icon: React.ReactNode) => {
    if (!items || items.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">権限が付与されていません</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="outline">{items.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.display_name || item.name}</div>
                  <div className="text-sm text-gray-500">{item.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {item.assigned_count}/{item.total_count}
                    </div>
                    <div className="text-xs text-gray-500">権限</div>
                  </div>
                  <div className="flex items-center">
                    {item.has_permission ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">権限付与状況</h3>
        <Badge variant="outline">
          {businessCode.permissions_count}件の権限
        </Badge>
      </div>
      
      <div className="grid gap-6">
        {renderAssignmentTable(
          'システム権限レベル',
          assignmentStatus.system_levels,
          <Shield className="h-4 w-4" />
        )}
        
        {renderAssignmentTable(
          '役割',
          assignmentStatus.roles,
          <Users className="h-4 w-4" />
        )}
        
        {renderAssignmentTable(
          '部署',
          assignmentStatus.departments,
          <Building2 className="h-4 w-4" />
        )}
        
        {renderAssignmentTable(
          '職位',
          assignmentStatus.positions,
          <Briefcase className="h-4 w-4" />
        )}
      </div>
    </div>
  );
};

// ビジネスコード詳細コンポーネント
interface BusinessCodeDetailProps {
  businessCode: BusinessCode;
  onClose: () => void;
}

const BusinessCodeDetail: React.FC<BusinessCodeDetailProps> = ({ businessCode, onClose }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{businessCode.name}</CardTitle>
            <CardDescription>{businessCode.code}</CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="permissions">権限</TabsTrigger>
            <TabsTrigger value="assignment">付与状況</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">説明</Label>
                <p className="text-sm text-gray-600 mt-1">{businessCode.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">カテゴリー</Label>
                <p className="text-sm text-gray-600 mt-1">{businessCode.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">システム権限</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {businessCode.is_system ? 'はい' : 'いいえ'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">コア権限</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {businessCode.is_core ? 'はい' : 'いいえ'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="permissions">
            <BusinessCodePermissions businessCode={businessCode} />
          </TabsContent>
          
          <TabsContent value="assignment">
            <BusinessCodeAssignmentStatus businessCode={businessCode} />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="text-center py-8">
              <p className="text-gray-600">設定機能は今後実装予定です</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BusinessCodeManagement;
