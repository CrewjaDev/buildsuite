# Phase 1: 統合アプリケーション実装戦略

## 概要

承認フロー設計機能の実装において、段階的アプローチの第1フェーズとして**統合アプリケーション構成**を採用します。このドキュメントでは、現在のBuildSuiteシステムに承認フロー設計機能を統合する具体的な実装戦略について詳しく説明します。

## 🎯 Phase 1 の目標

### **基本方針**
- **リスク最小化**: 既存システムへの影響を最小限に抑制
- **迅速な価値提供**: 早期のMVP（最小実用製品）提供
- **コスト最適化**: 初期投資を抑えた段階的な機能実装
- **将来への拡張性**: 後のフェーズへの移行を考慮した設計

### **実装スコープ**
```
■ 必須機能 (MVP)
✅ 基本的なノーコード設計画面
✅ 階層別・金額別承認フローテンプレート
✅ 簡単な条件分岐機能
✅ 基本的なテスト・シミュレーション

■ 重要機能 (Phase 1 完了時)
🔶 複合条件承認フロー
🔶 動的承認者解決
🔶 業務データ連携
🔶 詳細なテスト・分析機能

■ 将来機能 (Phase 2以降)
⏭️ 高度なテンプレート管理
⏭️ 外部システム連携
⏭️ AI支援機能
⏭️ SaaS化対応
```

## 🏗️ システム構成

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│ BuildSuite - 統合アプリケーション (Phase 1)                  │
├─────────────────────────────────────────────────────────────┤
│ ■ フロントエンド層 (Next.js 15.5.0 + React 19.1.0)         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 統合アプリケーション (Next.js App Router)               │ │
│ │ ├─ (management)/ - 管理機能                            │ │
│ │ │  ├─ users/ - ユーザー管理                            │ │
│ │ │  ├─ departments/ - 部署管理                          │ │
│ │ │  └─ permissions/ - 権限管理                          │ │
│ │ ├─ (estimates)/ - 見積管理                             │ │
│ │ ├─ (budgets)/ - 予算管理                               │ │
│ │ ├─ (orders)/ - 発注管理                                │ │
│ │ └─ (approval)/ - 承認フロー機能 ← 新規追加              │ │
│ │    ├─ design/ - フロー設計キャンバス                    │ │
│ │    ├─ templates/ - テンプレート管理                     │ │
│ │    ├─ test/ - テスト・シミュレーション                  │ │
│ │    └─ layout.tsx - 承認機能共通レイアウト               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│ ■ API層 (GraphQL)            │                               │
│ ┌─────────────────────────┬─────────────────────────────────┐ │
│ │ 業務API                 │ 設計API                         │ │
│ │ ├─ Users/Departments    │ ├─ FlowDesigns                  │ │
│ │ ├─ Estimates/Contracts  │ ├─ Templates                    │ │
│ │ ├─ ApprovalRequests     │ ├─ TestExecutions               │ │
│ │ └─ Permissions          │ └─ Simulations                  │ │
│ └─────────────────────────┴─────────────────────────────────┘ │
│                              │                               │
│ ■ ビジネスロジック層 (Laravel)                               │
│ ┌─────────────────────────┬─────────────────────────────────┐ │
│ │ 業務サービス             │ 設計サービス                     │ │
│ │ ├─ EstimateService      │ ├─ FlowDesignService            │ │
│ │ ├─ ApprovalService      │ ├─ TemplateService              │ │
│ │ ├─ PermissionService    │ ├─ SimulationService            │ │
│ │ └─ NotificationService  │ └─ ValidationService            │ │
│ └─────────────────────────┴─────────────────────────────────┘ │
│                              │                               │
│ ■ データ層 (PostgreSQL)                                      │
│ ┌─────────────────────────┬─────────────────────────────────┐ │
│ │ 業務テーブル             │ 設計テーブル                     │ │
│ │ ├─ users                │ ├─ no_code_flow_designs         │ │
│ │ ├─ departments          │ ├─ no_code_flow_templates       │ │
│ │ ├─ estimates            │ ├─ flow_test_executions         │ │
│ │ ├─ approval_requests    │ ├─ approver_groups              │ │
│ │ └─ approval_histories   │ └─ design_versions              │ │
│ └─────────────────────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 フロントエンド実装戦略

### 1. Next.js App Router による統合

#### **メインアプリケーション構成**
```typescript
// Next.js App Router 構成
// src/app/layout.tsx (ルートレイアウト)
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/layout/Navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="container mx-auto py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
```

#### **承認フロー機能の統合**
```typescript
// src/app/(approval)/layout.tsx (承認機能共通レイアウト)
import { ApprovalNavigation } from '@/components/approval/ApprovalNavigation'

export default function ApprovalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="approval-layout">
      <ApprovalNavigation />
      <div className="approval-content">
        {children}
      </div>
    </div>
  )
}

// src/app/(approval)/design/page.tsx (フロー設計画面)
import { FlowDesigner } from '@/components/approval/FlowDesigner'
import { TemplateManager } from '@/components/approval/TemplateManager'
import { TestSimulator } from '@/components/approval/TestSimulator'

export default function ApprovalDesignPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">承認フロー設計</h1>
        <FlowDesigner />
      </div>
    </div>
  )
}

// src/app/(approval)/templates/page.tsx (テンプレート管理画面)
export default function ApprovalTemplatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">テンプレート管理</h1>
        <TemplateManager />
      </div>
    </div>
  )
}
```

### 2. 既存技術スタック活用

#### **設計画面メインコンポーネント**
```typescript
// src/components/approval/FlowDesigner.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

interface FlowDesignerProps {
  className?: string
}

export const FlowDesigner: React.FC<FlowDesignerProps> = ({ className }) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const dispatch = useAppDispatch()
  
  // TanStack Query でデータフェッチ
  const { data: flowDesigns, isLoading } = useQuery({
    queryKey: ['flowDesigns'],
    queryFn: async () => {
      const response = await fetch('/api/approval/flow-designs')
      return response.json()
    }
  })

  return (
    <div className={`grid grid-cols-12 gap-4 h-screen ${className}`}>
      {/* コンポーネントパレット */}
      <div className="col-span-3 border-r p-4">
        <h3 className="text-lg font-semibold mb-4">コンポーネント</h3>
        <ComponentPalette />
      </div>
      
      {/* 設計キャンバス */}
      <div className="col-span-6 p-4">
        <div className="h-full border rounded-lg">
          <DesignCanvas 
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        </div>
      </div>
      
      {/* プロパティパネル */}
      <div className="col-span-3 border-l p-4">
        <h3 className="text-lg font-semibold mb-4">プロパティ</h3>
        <PropertyPanel selectedNode={selectedNode} />
      </div>
    </div>
  )
}

// Shadcn/ui コンポーネントを活用したパレット
const ComponentPalette: React.FC = () => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">基本</TabsTrigger>
        <TabsTrigger value="advanced">高度</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          draggable
          onDragStart={(e) => e.dataTransfer.setData('componentType', 'approver')}
        >
          👤 承認者
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          draggable
          onDragStart={(e) => e.dataTransfer.setData('componentType', 'condition')}
        >
          ⚡ 条件分岐
        </Button>
      </TabsContent>
      
      <TabsContent value="advanced" className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          draggable
          onDragStart={(e) => e.dataTransfer.setData('componentType', 'applicant_judge')}
        >
          🎭 申請者判定
        </Button>
      </TabsContent>
    </Tabs>
  )
}
```

### 3. Tailwind CSS + Shadcn/ui 統合

#### **デザインシステム統合**
```css
/* globals.css - Tailwind CSS設定 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 承認フロー設計専用のカスタムスタイル */
@layer components {
  .approval-layout {
    @apply min-h-screen bg-background;
  }
  
  .design-canvas {
    @apply relative w-full h-full bg-muted/20 border border-border rounded-lg overflow-hidden;
  }
  
  .flow-node {
    @apply absolute bg-card border border-border rounded-lg shadow-sm p-3 cursor-move;
    @apply hover:shadow-md transition-shadow duration-200;
  }
  
  .flow-node.selected {
    @apply ring-2 ring-primary ring-offset-2;
  }
  
  .flow-connection {
    @apply absolute pointer-events-none;
    stroke: hsl(var(--muted-foreground));
    stroke-width: 2;
    fill: none;
  }
  
  .component-palette {
    @apply space-y-2 p-4 bg-card border border-border rounded-lg;
  }
  
  .property-panel {
    @apply space-y-4 p-4 bg-card border border-border rounded-lg;
  }
}

/* Tailwind CSS カスタム変数 */
:root {
  --design-canvas-bg: hsl(var(--muted) / 0.2);
  --node-border: hsl(var(--border));
  --connection-color: hsl(var(--muted-foreground));
}
```

#### **Shadcn/ui コンポーネント活用例**
```typescript
// プロパティパネルでの活用例
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PropertyPanel: React.FC<{ selectedNode: Node | null }> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">ノードを選択してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ノード設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-name">ノード名</Label>
          <Input 
            id="node-name"
            defaultValue={selectedNode.config.title}
            placeholder="ノード名を入力"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="approver-type">承認者タイプ</Label>
          <Select defaultValue={selectedNode.config.approver_type}>
            <SelectTrigger>
              <SelectValue placeholder="承認者タイプを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">特定ユーザー</SelectItem>
              <SelectItem value="position">役職指定</SelectItem>
              <SelectItem value="group">グループ指定</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="is-required" 
            defaultChecked={selectedNode.config.is_required}
          />
          <Label htmlFor="is-required">必須承認</Label>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🔧 バックエンド実装戦略

### 1. GraphQL API 統合

#### **スキーマ分離戦略**
```php
// config/graphql.php
return [
    'schemas' => [
        'default' => [
            'query' => [
                // 既存業務系クエリ
                'users' => App\GraphQL\Queries\UsersQuery::class,
                'estimates' => App\GraphQL\Queries\EstimatesQuery::class,
                'approval_requests' => App\GraphQL\Queries\ApprovalRequestsQuery::class,
                
                // 設計系クエリ (新規追加)
                'flow_designs' => App\GraphQL\Queries\FlowDesignsQuery::class,
                'flow_templates' => App\GraphQL\Queries\FlowTemplatesQuery::class,
                'test_executions' => App\GraphQL\Queries\TestExecutionsQuery::class,
            ],
            'mutation' => [
                // 既存業務系ミューテーション
                'create_estimate' => App\GraphQL\Mutations\CreateEstimateMutation::class,
                'approve_request' => App\GraphQL\Mutations\ApproveRequestMutation::class,
                
                // 設計系ミューテーション (新規追加)
                'create_flow_design' => App\GraphQL\Mutations\CreateFlowDesignMutation::class,
                'update_flow_design' => App\GraphQL\Mutations\UpdateFlowDesignMutation::class,
                'test_flow_design' => App\GraphQL\Mutations\TestFlowDesignMutation::class,
                'create_template' => App\GraphQL\Mutations\CreateTemplateMutation::class,
            ],
            'types' => [
                // 既存型定義
                'User' => App\GraphQL\Types\UserType::class,
                'Estimate' => App\GraphQL\Types\EstimateType::class,
                
                // 設計系型定義 (新規追加)
                'FlowDesign' => App\GraphQL\Types\FlowDesignType::class,
                'FlowTemplate' => App\GraphQL\Types\FlowTemplateType::class,
                'TestExecution' => App\GraphQL\Types\TestExecutionType::class,
            ],
        ],
    ],
];
```

#### **新規GraphQLタイプ定義**
```php
// app/GraphQL/Types/FlowDesignType.php
<?php

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;

class FlowDesignType extends ObjectType
{
    public function __construct()
    {
        parent::__construct([
            'name' => 'FlowDesign',
            'description' => 'ノーコードフロー設計データ',
            'fields' => [
                'id' => ['type' => Type::nonNull(Type::id())],
                'name' => ['type' => Type::string()],
                'description' => ['type' => Type::string()],
                'design_data' => [
                    'type' => Type::string(),
                    'description' => 'JSON形式の設計データ'
                ],
                'canvas_data' => [
                    'type' => Type::string(),
                    'description' => 'キャンバス配置データ'
                ],
                'version' => ['type' => Type::int()],
                'is_active' => ['type' => Type::boolean()],
                'template' => [
                    'type' => FlowTemplateType::class,
                    'resolve' => fn($root) => $root->template
                ],
                'test_executions' => [
                    'type' => Type::listOf(TestExecutionType::class),
                    'resolve' => fn($root) => $root->testExecutions()->latest()->limit(10)->get()
                ],
                'created_by' => [
                    'type' => UserType::class,
                    'resolve' => fn($root) => $root->creator
                ],
                'created_at' => ['type' => Type::string()],
                'updated_at' => ['type' => Type::string()],
            ],
        ]);
    }
}
```

### 2. データベース統合

#### **既存テーブル拡張（PostgreSQL対応）**
```sql
-- 既存 approval_flows テーブルの拡張
ALTER TABLE approval_flows 
ADD COLUMN design_data JSONB,                    -- MySQL: JSON → PostgreSQL: JSONB
ADD COLUMN canvas_data JSONB,
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN template_id BIGINT;

-- PostgreSQL用インデックス
CREATE INDEX idx_approval_flows_template_id ON approval_flows(template_id);
CREATE INDEX idx_approval_flows_design_data ON approval_flows USING GIN(design_data);
CREATE INDEX idx_approval_flows_canvas_data ON approval_flows USING GIN(canvas_data);

-- 既存 approval_steps テーブルの拡張
ALTER TABLE approval_steps
ADD COLUMN node_id VARCHAR(100),
ADD COLUMN approver_type VARCHAR(20) CHECK (approver_type IN ('user', 'position', 'group', 'superior')),
ADD COLUMN department_id BIGINT,
ADD COLUMN position_id BIGINT,
ADD COLUMN group_id BIGINT,
ADD COLUMN amount_limit DECIMAL(15,2),
ADD COLUMN notification_settings JSONB;

-- PostgreSQL用インデックス
CREATE INDEX idx_approval_steps_node_id ON approval_steps(node_id);
CREATE INDEX idx_approval_steps_approver_type ON approval_steps(approver_type);
CREATE INDEX idx_approval_steps_notification ON approval_steps USING GIN(notification_settings);
```

#### **新規テーブル作成（PostgreSQL対応）**
```sql
-- ノーコードフローテンプレート
CREATE TABLE no_code_flow_templates (
    id BIGSERIAL PRIMARY KEY,                       -- MySQL: BIGINT AUTO_INCREMENT → PostgreSQL: BIGSERIAL
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    template_data JSONB NOT NULL,                   -- MySQL: JSON → PostgreSQL: JSONB
    preview_image VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PostgreSQL用インデックス
CREATE INDEX idx_templates_category ON no_code_flow_templates(category);
CREATE INDEX idx_templates_difficulty ON no_code_flow_templates(difficulty_level);
CREATE INDEX idx_templates_public ON no_code_flow_templates(is_public);
CREATE INDEX idx_templates_usage ON no_code_flow_templates(usage_count);
CREATE INDEX idx_templates_data ON no_code_flow_templates USING GIN(template_data);

-- フローテスト実行履歴
CREATE TABLE flow_test_executions (
    id BIGSERIAL PRIMARY KEY,
    flow_id BIGINT NOT NULL,
    test_data JSONB NOT NULL,                       -- MySQL: JSON → PostgreSQL: JSONB
    execution_result JSONB NOT NULL,                -- MySQL: JSON → PostgreSQL: JSONB
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
    error_details TEXT,
    executed_by BIGINT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flow_id) REFERENCES approval_flows(id),
    FOREIGN KEY (executed_by) REFERENCES users(id)
);

-- PostgreSQL用インデックス
CREATE INDEX idx_test_executions_flow_status ON flow_test_executions(flow_id, status);
CREATE INDEX idx_test_executions_executed_at ON flow_test_executions(executed_at);
CREATE INDEX idx_test_executions_test_data ON flow_test_executions USING GIN(test_data);
CREATE INDEX idx_test_executions_result ON flow_test_executions USING GIN(execution_result);

-- 承認者グループ
CREATE TABLE approver_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    approval_type VARCHAR(20) DEFAULT 'any' CHECK (approval_type IN ('all', 'any', 'majority')),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_approver_groups_approval_type ON approver_groups(approval_type);

-- 承認者グループメンバー
CREATE TABLE approver_group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES approver_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_priority ON approver_group_members(group_id, priority_order);
```

### 3. サービス層実装

#### **フロー設計サービス**
```php
// app/Services/FlowDesignService.php
<?php

namespace App\Services;

use App\Models\ApprovalFlow;
use App\Models\NoCodeFlowTemplate;
use App\Models\FlowTestExecution;
use Illuminate\Support\Facades\DB;

class FlowDesignService
{
    /**
     * テンプレートからフロー作成
     */
    public function createFromTemplate(int $templateId, array $data): ApprovalFlow
    {
        $template = NoCodeFlowTemplate::findOrFail($templateId);
        $template->increment('usage_count');

        return DB::transaction(function () use ($template, $data) {
            $flow = ApprovalFlow::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'template_id' => $template->id,
                'design_data' => $template->template_data,
                'canvas_data' => $template->template_data['canvas_data'] ?? [],
                'version' => 1,
                'is_active' => false,
                'created_by' => auth()->id(),
            ]);

            // テンプレートからステップ・条件を生成
            $this->generateStepsFromTemplate($flow, $template->template_data);

            return $flow;
        });
    }

    /**
     * フロー設計データの更新
     */
    public function updateDesign(int $flowId, array $designData): ApprovalFlow
    {
        $flow = ApprovalFlow::findOrFail($flowId);
        
        return DB::transaction(function () use ($flow, $designData) {
            // バージョン番号をインクリメント
            $flow->increment('version');
            
            // 設計データを更新
            $flow->update([
                'design_data' => $designData,
                'canvas_data' => $designData['canvas_data'] ?? [],
            ]);

            // 既存のステップ・条件を削除して再生成
            $flow->steps()->delete();
            $flow->conditions()->delete();

            // 新しい設計データからステップ・条件を生成
            $this->generateStepsFromDesign($flow, $designData);

            return $flow->fresh();
        });
    }

    /**
     * フロー設計のテスト実行
     */
    public function testDesign(int $flowId, array $testData): FlowTestExecution
    {
        $flow = ApprovalFlow::findOrFail($flowId);
        $startTime = microtime(true);

        try {
            $simulator = new FlowSimulator($flow);
            $result = $simulator->execute($testData);
            $executionTime = round((microtime(true) - $startTime) * 1000);

            return FlowTestExecution::create([
                'flow_id' => $flow->id,
                'test_data' => $testData,
                'execution_result' => $result,
                'execution_time_ms' => $executionTime,
                'status' => $result['status'] ?? 'success',
                'error_details' => $result['errors'] ?? null,
                'executed_by' => auth()->id(),
            ]);

        } catch (\Exception $e) {
            $executionTime = round((microtime(true) - $startTime) * 1000);
            
            return FlowTestExecution::create([
                'flow_id' => $flow->id,
                'test_data' => $testData,
                'execution_result' => ['status' => 'error'],
                'execution_time_ms' => $executionTime,
                'status' => 'error',
                'error_details' => $e->getMessage(),
                'executed_by' => auth()->id(),
            ]);
        }
    }

    /**
     * 設計データからステップ・条件を生成
     */
    private function generateStepsFromDesign(ApprovalFlow $flow, array $designData): void
    {
        $nodes = $designData['nodes'] ?? [];
        $connections = $designData['connections'] ?? [];
        
        $stepOrder = 1;
        
        foreach ($nodes as $node) {
            if ($node['type'] === 'approver') {
                $this->createApprovalStep($flow, $node, $stepOrder++);
            } elseif ($node['type'] === 'condition') {
                $this->createConditionStep($flow, $node, $connections);
            }
        }
    }

    /**
     * 承認ステップの作成
     */
    private function createApprovalStep(ApprovalFlow $flow, array $node, int $order): void
    {
        $config = $node['config'] ?? [];
        
        $flow->steps()->create([
            'step_order' => $order,
            'step_type' => 'approval',
            'node_id' => $node['id'],
            'approver_type' => $config['approver_type'] ?? 'user',
            'approver_id' => $this->resolveApproverId($config),
            'department_id' => $config['department_id'] ?? null,
            'position_id' => $config['position_id'] ?? null,
            'group_id' => $config['group_id'] ?? null,
            'amount_limit' => $config['amount_limit'] ?? null,
            'is_required' => $config['is_required'] ?? true,
            'can_delegate' => $config['can_delegate'] ?? false,
            'deadline_hours' => ($config['deadline_days'] ?? 3) * 24,
            'notification_settings' => $config['notification'] ?? [],
        ]);
    }

    /**
     * 条件ステップの作成
     */
    private function createConditionStep(ApprovalFlow $flow, array $node, array $connections): void
    {
        $config = $node['config'] ?? [];
        $conditions = $config['conditions'] ?? [];
        
        foreach ($conditions as $index => $condition) {
            $flow->conditions()->create([
                'step_id' => null, // 条件分岐は特定のステップに属さない
                'condition_type' => $config['field'] ?? 'amount',
                'field_name' => $config['field'] ?? 'amount',
                'operator' => $condition['operator'] ?? '<=',
                'value' => $condition['value'] ?? 0,
                'logical_operator' => 'AND',
                'condition_group' => $index + 1,
                'priority' => $index + 1,
            ]);
        }
    }

    /**
     * 承認者IDの解決
     */
    private function resolveApproverId(array $config): ?int
    {
        switch ($config['approver_type'] ?? 'user') {
            case 'user':
                return $config['user_id'] ?? null;
            case 'position':
                // 職位から承認者を動的解決（実行時に行う）
                return null;
            case 'group':
                // グループ承認（実行時に解決）
                return null;
            default:
                return null;
        }
    }
}
```

## 🔐 認証・認可統合

### 権限管理の拡張

#### **設計機能用権限の追加**
```php
// database/seeders/PermissionSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // 既存の権限...
        
        // 設計機能の権限 (新規追加)
        $designPermissions = [
            // フロー設計権限
            'approval.design.access' => 'フロー設計画面へのアクセス',
            'approval.design.create' => 'フロー設計の作成',
            'approval.design.edit' => 'フロー設計の編集',
            'approval.design.delete' => 'フロー設計の削除',
            'approval.design.publish' => 'フロー設計の公開',
            
            // テンプレート管理権限
            'approval.template.view' => 'テンプレートの表示',
            'approval.template.create' => 'テンプレートの作成',
            'approval.template.edit' => 'テンプレートの編集',
            'approval.template.delete' => 'テンプレートの削除',
            'approval.template.share' => 'テンプレートの共有',
            
            // テスト実行権限
            'approval.test.execute' => 'フローテストの実行',
            'approval.test.view_results' => 'テスト結果の表示',
            'approval.test.manage' => 'テスト履歴の管理',
            
            // 高度な設計権限
            'approval.design.advanced' => '高度な設計機能の利用',
            'approval.design.system_integration' => 'システム連携設定',
            'approval.design.bulk_operations' => '一括操作の実行',
        ];

        foreach ($designPermissions as $name => $description) {
            Permission::firstOrCreate(
                ['name' => $name],
                ['description' => $description]
            );
        }
    }
}
```

#### **ミドルウェア統合**
```php
// app/Http/Middleware/ApprovalDesignPermissionMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApprovalDesignPermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // 管理者は全権限を持つ
        if ($user->is_admin) {
            return $next($request);
        }

        // 設計機能の権限チェック
        if (!$user->hasPermission($permission)) {
            return response()->json([
                'error' => 'Insufficient permissions',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }
}
```

## 📊 実装スケジュール

### Phase 1 詳細スケジュール (16週間)

#### **Week 1-2: 環境・基盤整備**
```
■ Next.js App Router 拡張
□ (approval) ルートグループ作成
□ レイアウト・ページ構成
□ 既存UIコンポーネント活用確認
□ Shadcn/ui + TanStack統合確認

■ PostgreSQL データベース設計
□ 既存テーブル拡張（JSONB対応）
□ 新規テーブル作成（BIGSERIAL対応）
□ GINインデックス最適化
□ マイグレーション・シーダー作成
```

#### **Week 3-4: バックエンド基盤**
```
■ GraphQL API拡張
□ 新規タイプ定義
□ クエリ・ミューテーション実装
□ 権限管理の統合
□ エラーハンドリング

■ サービス層実装
□ FlowDesignService
□ TemplateService
□ SimulationService
□ ValidationService
```

#### **Week 5-8: フロントエンド基盤**
```
■ Next.js承認フロー画面実装
□ (approval)ルートグループ実装
□ TanStack Query + Redux Toolkit統合
□ Shadcn/ui コンポーネント活用
□ Tailwind CSS カスタムスタイル

■ 基本的な設計機能
□ フロー設計キャンバス実装
□ ドラッグ&ドロップ機能
□ ノード・接続の基本実装
□ プロパティパネル基盤
```

#### **Week 9-12: コア機能実装**
```
■ 設計機能の実装
□ 承認者ノード設定（Shadcn/ui活用）
□ 条件分岐ノード設定
□ テンプレート機能（TanStack Query）
□ 保存・読み込み機能（Redux Toolkit）

■ 検証・テスト機能
□ 設計検証機能
□ シミュレーション機能
□ エラー表示・ガイダンス
□ テスト結果表示（TanStack Table）
```

#### **Week 13-14: 統合・テスト**
```
■ Next.js アプリケーション統合
□ 既存機能との統合確認
□ 認証・認可の統合テスト
□ PostgreSQL パフォーマンステスト
□ セキュリティテスト

■ ユーザビリティテスト
□ Shadcn/ui レスポンシブ確認
□ アクセシビリティ対応
□ ブラウザ互換性テスト
```

#### **Week 15-16: 仕上げ・リリース準備**
```
■ 最終調整
□ バグ修正・改善
□ ドキュメント作成
□ 運用マニュアル作成
□ デプロイ準備

■ リリース
□ ステージング環境での最終確認
□ 本番環境へのデプロイ
□ ユーザー向け説明・トレーニング
```

## 📈 成功指標・評価基準

### 技術的指標

#### **パフォーマンス指標**
```
■ レスポンス時間
- 設計画面の初期表示: < 3秒
- ノード追加・編集: < 1秒
- フロー保存: < 2秒
- テスト実行: < 5秒

■ 可用性
- システム稼働率: > 99.5%
- 設計機能の稼働率: > 99%

■ スケーラビリティ
- 同時設計ユーザー数: 50名以上
- フローノード数: 100個以上
- テンプレート数: 100個以上
```

#### **品質指標**
```
■ テストカバレッジ
- バックエンド: > 80%
- フロントエンド: > 70%

■ セキュリティ
- 脆弱性スキャン: クリティカル 0件
- 権限制御: 100% 実装

■ 保守性
- コード品質スコア: A以上
- 技術的負債: 低レベル維持
```

### ビジネス指標

#### **利用状況指標**
```
■ ユーザー採用
- アクティブ設計者数: 月間20名以上
- 設計完了フロー数: 月間10件以上
- テンプレート利用率: 70%以上

■ 効率性
- フロー設計時間: 従来比50%削減
- 設定エラー率: 20%以下
- ユーザーサポート問い合わせ: 週1件以下
```

#### **満足度指標**
```
■ ユーザー満足度
- 使いやすさ評価: 4.0/5.0以上
- 機能充実度評価: 4.0/5.0以上
- 推奨意向: 80%以上

■ 運用効率
- 設定変更時間: 従来比70%削減
- 承認フロー運用エラー: 月1件以下
```

## 🚀 次フェーズへの移行判断基準

### Phase 2 移行の判断基準

#### **成功基準 (6ヶ月後評価)**
```
✅ 技術的成功
- パフォーマンス指標の達成
- 品質指標の達成
- 運用安定性の確保

✅ ビジネス成功
- ユーザー採用目標の達成
- 効率性改善の実現
- ROIの確認

✅ 組織的成功
- 開発チームのスキル向上
- 運用体制の確立
- ユーザーサポート体制の確立
```

#### **Phase 2 検討項目**
```
🔍 技術的検討
- マイクロフロントエンド化の必要性
- 独立デプロイメントの価値
- 技術スタック最適化の効果

🔍 ビジネス検討
- 外部連携の需要
- SaaS化・外販の可能性
- カスタマイズ需要の規模

🔍 運用検討
- 管理・監視の複雑性
- 開発・運用コストの変化
- チーム体制の最適化
```

## 📋 実装時の注意点

### **技術的注意点**

#### **Vue.js + React 統合**
```
⚠️ 注意点
- ビルドサイズの増加
- 状態管理の複雑化
- デバッグの困難さ

✅ 対策
- 動的インポートによる遅延読み込み
- 明確な責任分界の設定
- 統合テストの充実
```

#### **GraphQL API 拡張**
```
⚠️ 注意点
- スキーマの肥大化
- N+1クエリ問題
- キャッシュ戦略の複雑化

✅ 対策
- 機能別スキーマ分離
- DataLoaderの活用
- Apollo Client キャッシュ最適化
```

### **運用上の注意点**

#### **データ整合性**
```
⚠️ 注意点
- 設計データと実行データの同期
- バージョン管理の複雑性
- バックアップ・復旧の考慮

✅ 対策
- トランザクション制御の徹底
- 設計データの検証機能
- 段階的なデータ移行
```

#### **パフォーマンス**
```
⚠️ 注意点
- 大規模フローの処理性能
- 同時設計時の競合
- メモリ使用量の増加

✅ 対策
- 設計データの最適化
- 楽観的ロックの実装
- メモリプロファイリング
```

## 📝 まとめ

Phase 1では、**Next.js統合アプリケーション構成**により以下を実現します：

### **主要な成果物**
1. **Next.js App Router統合**: (approval)ルートグループによる機能分離
2. **既存技術スタック最大活用**: Shadcn/ui + TanStack Query/Table/Redux
3. **PostgreSQL + JSONB**: 高性能な設計データ管理
4. **統一認証・権限管理**: 既存システムとの完全統合
5. **レスポンシブ設計画面**: モダンUI/UXによる直感的操作

### **期待される効果**
- **開発効率**: 承認フロー設計時間の50%削減
- **技術統一**: React統一による保守性向上
- **パフォーマンス**: PostgreSQL JSONBによる高速操作
- **ユーザー満足度**: Shadcn/uiによる洗練されたUI体験

### **リスク管理**
- **技術リスク**: 既存技術スタック活用による最小化
- **運用リスク**: Next.js統合による安定性確保
- **ビジネスリスク**: 早期の価値提供によるROI確保

この Phase 1 実装により、**現在の技術スタックを最大限活用して承認フロー設計機能を効率的に構築し、将来のフェーズへの発展可能性を確保**します。

## 関連ドキュメント

- [ノーコード設計画面最終仕様](./no-code-designer-final-spec.md)
- [承認フロー実装状況](../implementation-status.md)
- [API リファレンス](../api-reference.md)
- [データベーススキーマ](../database-schema.md)

---

*最終更新日: 2024年1月*
