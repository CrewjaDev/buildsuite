# ノーコード承認フロー設計画面

## 概要

このドキュメントでは、プログラミング知識不要で承認フローを視覚的に設計・設定できる画面の仕様について詳しく説明します。ドラッグ&ドロップによる直感的な操作で、複雑な承認フローを簡単に構築できます。

## 🎯 ノーコード設計の目標

### **対象ユーザー**
- システム管理者（プログラミング知識不要）
- 業務部門の管理者
- 承認フロー設計担当者

### **実現する機能**
- **ビジュアル設計**: ドラッグ&ドロップでフロー作成
- **リアルタイムプレビュー**: 設定内容の即座確認
- **テンプレート機能**: よく使うパターンの保存・再利用
- **シミュレーション**: 設計したフローのテスト実行

## 🎨 メイン設計画面

### フロー設計キャンバス

```
┌─────────────────────────────────────────────────────────────┐
│ 承認フロー設計画面                                           │
├─────────────────────────────────────────────────────────────┤
│ [新規作成] [テンプレート] [保存] [プレビュー] [テスト]        │
├─┬───────────────────────┬─────────────────────────────────┤
│ │ ■ 基本コンポーネント    │ ■ 設計キャンバス                │
│ │                       │                               │
│ │ 📝 申請開始            │ ┌─────────┐                   │
│ │ 👤 承認者              │ │ 申請開始 │                   │
│ │ 👥 グループ承認        │ │ (見積申請)│                   │
│ │ ⚡ 条件分岐            │ └─────────┘                   │
│ │ 📋 条件設定            │      │                        │
│ │ 📤 通知                │      ▼                        │
│ │ 🔄 ループ処理          │ ┌─────────┐                   │
│ │ ✅ 承認完了            │ │ 営業部長 │ ← ドラッグ中       │
│ │ ❌ 却下処理            │ │ (1次承認)│                   │
│ │ 🔙 差戻処理            │ └─────────┘                   │
│ │                       │      │                        │
│ │ ■ 高度なコンポーネント  │      ▼                        │
│ │ 🎭 申請者判定          │ ┌─────────┐                   │
│ │ 🔀 動的分岐            │ │申請者判定│                   │
│ │ 🏗️ 階層制御           │ │(役職確認) │                   │
│ │ 🎯 権限チェック        │ └─────────┘                   │
│ │                       │      │                        │
│ │ ■ テンプレート          │      ▼                        │
│ │ 🏢 部署承認フロー       │ ┌─────────┐                   │
│ │ 💰 金額別承認          │ │ 条件分岐 │                   │
│ │ 📊 階層承認            │ │(金額判定) │                   │
│ │ ⚡ 緊急承認            │ └─────────┘                   │
│ │                       │    │     │                    │
│ │                       │   ▼      ▼                    │
│ │                       │ ┌───┐  ┌───┐                │
│ │                       │ │社長│  │部長│                │
│ │                       │ │承認│  │承認│                │
│ │                       │ └───┘  └───┘                │
│ │                       │   │      │                    │
│ │                       │   └──┬───┘                    │
│ │                       │      ▼                        │
│ │                       │ ┌─────────┐                   │
│ │                       │ │ 承認完了 │                   │
│ │                       │ └─────────┘                   │
├─┴───────────────────────┴─────────────────────────────────┤
│ 選択中: 条件分岐(金額判定)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ■ 条件設定                                             │ │
│ │ 条件名: [金額による承認者判定        ]                   │ │
│ │ 判定項目: [見積金額 ▼]                                 │ │
│ │ 条件1: [1000万円以下] → [営業部長承認]                  │ │
│ │ 条件2: [1000万円超過] → [社長承認]                      │ │
│ │ [条件追加] [削除]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存して適用] [キャンセル] [テストシミュレーション]          │
└─────────────────────────────────────────────────────────────┘
```

### 新しいコンポーネント詳細設定

#### 申請者判定ノードの設定画面

```
┌─────────────────────────────────────────────────────────────┐
│ 申請者判定ノード設定                                         │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本情報                                                 │
│ ノード名: [申請者役職判定              ]                      │
│ 説明: [申請者の役職に応じて承認フローを自動選択]              │
│ アイコン: [🎭 ▼] 色: [#4A90E2 ▼]                          │
│                                                           │
│ ■ 判定条件設定                                             │
│ 判定基準: [申請者の役職レベル ▼]                            │
│ ├─ ○ 役職レベル (staff/manager/director/president)         │
│ ├─ ○ 部署 (営業部/技術部/管理部)                           │
│ ├─ ○ 職位 (担当/主任/課長/部長)                            │
│ └─ ○ カスタム属性 (雇用形態/勤続年数等)                     │
│                                                           │
│ ■ 分岐条件                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 条件1: [担当者レベル] → [部長承認ルート]                 │ │
│ │ ├─ 対象: ☑担当 ☑主任 ☐課長 ☐部長 ☐社長               │ │
│ │ ├─ 次ノード: [director_approval ▼]                      │ │
│ │ └─ 表示色: [緑 ▼]                                       │ │
│ │                                                       │ │
│ │ 条件2: [部長レベル] → [社長直接承認ルート]               │ │
│ │ ├─ 対象: ☐担当 ☐主任 ☐課長 ☑部長 ☐社長               │ │
│ │ ├─ 次ノード: [president_approval_direct ▼]             │ │
│ │ └─ 表示色: [青 ▼]                                       │ │
│ │                                                       │ │
│ │ 条件3: [社長レベル] → [エラー処理]                       │ │
│ │ ├─ 対象: ☐担当 ☐主任 ☐課長 ☐部長 ☑社長               │ │
│ │ ├─ アクション: [エラー表示 ▼]                           │ │
│ │ ├─ エラーメッセージ: [社長は申請できません]              │ │
│ │ └─ 表示色: [赤 ▼]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                           │
│ [条件追加] [削除] [順序変更] [テスト実行]                    │
│                                                           │
│ ■ 高度な設定                                               │
│ ☑ 判定結果をログに記録                                      │
│ ☑ 判定失敗時は管理者に通知                                  │
│ ☐ 判定条件の動的更新を許可                                  │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー] [テスト実行]                │
└─────────────────────────────────────────────────────────────┘
```

#### 従来の承認者ノード設定画面

```
┌─────────────────────────────────────────────────────────────┐
│ 承認者ノード設定                                             │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本情報                                                 │
│ ノード名: [営業部長承認                ]                      │
│ 表示名: [営業部長（1次承認）          ]                      │
│ アイコン: [👤 ▼] 色: [#28A745 ▼]                          │
│                                                           │
│ ■ 承認者指定方法                                           │
│ ○ 特定の人を指定                                           │
│   承認者: [田中部長 ▼] [追加]                              │
│   代理人: [佐藤課長 ▼] [追加]                              │
│                                                           │
│ ● 役職で指定 ← 今回のケース                                │
│   部署: [申請者と同じ部署 ▼] 役職: [部長 ▼]                │
│   代理設定: ☑ 不在時は副部長が代理                          │
│                                                           │
│ ○ グループで指定                                           │
│   承認グループ: [営業管理者グループ ▼]                      │
│   承認方式: [全員承認 ▼] (全員承認/一人承認/過半数承認)      │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額上限: [制限なし      ] ☑ 上限なし ← チェック済み        │
│ 期限設定: [3営業日      ] ☐ 期限なし                       │
│ 必須承認: ☑ この承認は必須                                  │
│ 委譲可能: ☑ 他の人に承認を委譲可能                          │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑ 承認依頼通知   ☑ リマインダー通知   ☑ 期限アラート        │
│ 通知方法: ☑ メール ☑ システム内通知 ☐ Slack               │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー] [承認者確認テスト]          │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技術実装アーキテクチャ

### 1. フロー設計データ構造

```php
// ノーコードフロー設計テーブル
CREATE TABLE no_code_flow_designs (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    design_data JSON, -- フロー設計の完全なデータ
    canvas_data JSON, -- キャンバス上の配置情報
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

// フロー設計データの例
{
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": {"x": 100, "y": 50},
      "config": {
        "title": "見積申請開始",
        "description": "見積の承認申請を開始"
      }
    },
    {
      "id": "approver_1", 
      "type": "approver",
      "position": {"x": 100, "y": 150},
      "config": {
        "title": "営業部長承認",
        "approver_type": "position",
        "department_id": 1,
        "position_id": 3,
        "amount_limit": 10000000,
        "deadline_days": 3,
        "is_required": true,
        "can_delegate": true,
        "notification": {
          "email": true,
          "system": true,
          "slack": false
        }
      }
    },
    {
      "id": "condition_1",
      "type": "condition", 
      "position": {"x": 100, "y": 250},
      "config": {
        "title": "金額判定",
        "field": "amount",
        "conditions": [
          {"operator": "<=", "value": 10000000, "next": "approver_2"},
          {"operator": ">", "value": 10000000, "next": "approver_3"}
        ]
      }
    }
  ],
  "connections": [
    {"from": "start_1", "to": "approver_1"},
    {"from": "approver_1", "to": "condition_1"},
    {"from": "condition_1", "to": "approver_2", "condition": "amount <= 10000000"},
    {"from": "condition_1", "to": "approver_3", "condition": "amount > 10000000"}
  ]
}
```

### 2. フロー実行エンジン

```php
class NoCodeFlowExecutionEngine
{
    /**
     * ノーコード設計からApprovalFlowを生成
     */
    public function generateApprovalFlow(NoCodeFlowDesign $design, ApprovalRequest $request): ApprovalFlow
    {
        $designData = json_decode($design->design_data, true);
        
        // ApprovalFlow作成
        $flow = ApprovalFlow::create([
            'name' => $design->name,
            'description' => $design->description,
            'is_active' => true,
            'created_from_design' => $design->id,
        ]);
        
        // ノードをApprovalStepに変換
        $steps = $this->convertNodesToSteps($designData['nodes'], $request);
        
        foreach ($steps as $stepData) {
            ApprovalStep::create([
                'approval_flow_id' => $flow->id,
                'step_order' => $stepData['order'],
                'step_type' => $stepData['type'],
                'approver_id' => $stepData['approver_id'],
                'conditions' => $stepData['conditions'],
                'is_required' => $stepData['is_required'],
                'can_delegate' => $stepData['can_delegate'],
                'deadline_hours' => $stepData['deadline_hours'],
            ]);
        }
        
        // 条件をApprovalConditionに変換
        $conditions = $this->convertConditions($designData['nodes'], $flow->id);
        
        foreach ($conditions as $conditionData) {
            ApprovalCondition::create($conditionData);
        }
        
        return $flow;
    }
    
    /**
     * ノードをステップに変換
     */
    private function convertNodesToSteps(array $nodes, ApprovalRequest $request): array
    {
        $steps = [];
        $order = 1;
        
        foreach ($nodes as $node) {
            if ($node['type'] === 'approver') {
                $steps[] = [
                    'order' => $order++,
                    'type' => 'approval',
                    'approver_id' => $this->resolveApprover($node['config'], $request),
                    'conditions' => $this->buildStepConditions($node['config']),
                    'is_required' => $node['config']['is_required'] ?? true,
                    'can_delegate' => $node['config']['can_delegate'] ?? false,
                    'deadline_hours' => ($node['config']['deadline_days'] ?? 3) * 24,
                ];
            }
        }
        
        return $steps;
    }
    
    /**
     * 承認者を解決
     */
    private function resolveApprover(array $config, ApprovalRequest $request): ?int
    {
        switch ($config['approver_type']) {
            case 'user':
                return $config['user_id'];
                
            case 'position':
                return $this->findUserByPosition(
                    $config['department_id'],
                    $config['position_id']
                );
                
            case 'superior':
                return $this->findSuperior($request->requested_by);
                
            case 'group':
                // グループ承認の場合は最初のメンバーを返す
                return $this->getGroupFirstMember($config['group_id']);
                
            default:
                return null;
        }
    }
}
```

### 3. フロント画面実装（React + TypeScript）

```typescript
// フロー設計画面のメインコンポーネント
interface FlowDesignerProps {
  designId?: string;
}

const FlowDesigner: React.FC<FlowDesignerProps> = ({ designId }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // ドラッグ&ドロップ処理
  const handleDrop = (event: React.DragEvent, position: Position) => {
    const componentType = event.dataTransfer.getData('componentType');
    const newNode = createNode(componentType, position);
    setNodes([...nodes, newNode]);
  };
  
  // ノード接続処理
  const handleConnect = (from: string, to: string) => {
    const newConnection = { from, to, id: generateId() };
    setConnections([...connections, newConnection]);
  };
  
  // 保存処理
  const handleSave = async () => {
    const designData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        config: node.config
      })),
      connections
    };
    
    await saveFlowDesign({
      name: designName,
      description: designDescription,
      design_data: designData,
      canvas_data: { zoom: 1, offset: { x: 0, y: 0 } }
    });
  };
  
  return (
    <div className="flow-designer">
      <Toolbar onSave={handleSave} onTest={handleTest} />
      
      <div className="designer-layout">
        <ComponentPalette onDragStart={handleComponentDrag} />
        
        <Canvas
          nodes={nodes}
          connections={connections}
          onDrop={handleDrop}
          onConnect={handleConnect}
          onNodeSelect={setSelectedNode}
        />
        
        <PropertyPanel 
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
      
      <StatusBar />
    </div>
  );
};

// 新しい申請者判定ノードコンポーネント
const ApplicantJudgeNode: React.FC<NodeProps> = ({ node, onConnect, onSelect }) => {
  const conditions = node.config.conditions || [];
  
  return (
    <div 
      className="flow-node applicant-judge-node"
      onClick={() => onSelect(node)}
      draggable
    >
      <div className="node-header">
        <span className="node-icon">🎭</span>
        <span className="node-title">{node.config.title}</span>
      </div>
      
      <div className="node-content">
        <div className="judge-info">
          <span className="judge-field">判定: {node.config.field}</span>
        </div>
        
        <div className="conditions-preview">
          {conditions.slice(0, 2).map((condition, index) => (
            <div key={index} className="condition-item">
              <span className="condition-label">{condition.description}</span>
            </div>
          ))}
          {conditions.length > 2 && (
            <div className="more-conditions">他{conditions.length - 2}件</div>
          )}
        </div>
      </div>
      
      <div className="node-connectors">
        <div className="connector input" />
        {conditions.map((condition, index) => (
          <div 
            key={index} 
            className={`connector output output-${index}`}
            data-condition={condition.condition}
          />
        ))}
      </div>
    </div>
  );
};

// 従来の承認者ノードコンポーネント（拡張版）
const ApproverNode: React.FC<NodeProps> = ({ node, onConnect, onSelect }) => {
  return (
    <div 
      className="flow-node approver-node"
      onClick={() => onSelect(node)}
      draggable
    >
      <div className="node-header">
        <span className="node-icon">👤</span>
        <span className="node-title">{node.config.title}</span>
      </div>
      
      <div className="node-content">
        <div className="approver-info">
          {node.config.approver_type === 'user' && (
            <span>{node.config.user_name}</span>
          )}
          {node.config.approver_type === 'position' && (
            <span>{node.config.department_name} {node.config.position_name}</span>
          )}
          {node.config.approver_type === 'superior_position' && (
            <span>上長({node.config.position_name})</span>
          )}
        </div>
        
        {node.config.amount_limit && (
          <div className="amount-limit">
            上限: {formatAmount(node.config.amount_limit)}
          </div>
        )}
        
        {node.config.amount_limit === null && (
          <div className="no-limit">
            金額制限なし
          </div>
        )}
        
        {node.config.deadline_days && (
          <div className="deadline">
            期限: {node.config.deadline_days}日
          </div>
        )}
      </div>
      
      <div className="node-connectors">
        <div className="connector input" />
        <div className="connector output" />
      </div>
    </div>
  );
};

// ノードファクトリー（新しいノードタイプ対応）
const createNode = (type: string, position: Position): Node => {
  const baseNode = {
    id: generateId(),
    position,
    selected: false
  };
  
  switch (type) {
    case 'applicant_judge':
      return {
        ...baseNode,
        type: 'applicant_judge',
        config: {
          title: '申請者判定',
          field: 'applicant_position',
          conditions: [
            {
              condition: "position_level == 'staff'",
              description: '担当者の場合',
              next: '',
              color: '#28A745'
            },
            {
              condition: "position_level == 'director'",
              description: '部長の場合', 
              next: '',
              color: '#007BFF'
            }
          ]
        }
      };
      
    case 'approver':
      return {
        ...baseNode,
        type: 'approver',
        config: {
          title: '承認者',
          approver_type: 'position',
          department_name: '',
          position_name: '',
          amount_limit: null,
          deadline_days: 3,
          is_required: true,
          can_delegate: true
        }
      };
      
    default:
      return baseNode;
  }
};
```

## 📋 設定テンプレート

### 1. 階層別動的承認フローテンプレート

```json
{
  "name": "階層別動的承認フロー",
  "description": "申請者の役職に応じて承認フローが自動変更される",
  "template_data": {
    "nodes": [
      {
        "id": "start_1",
        "type": "start",
        "config": {"title": "申請開始"}
      },
      {
        "id": "applicant_check",
        "type": "applicant_condition",
        "config": {
          "title": "申請者役職判定",
          "field": "applicant_position",
          "conditions": [
            {
              "condition": "position_level == 'staff'",
              "description": "担当者の場合",
              "next": "director_approval"
            },
            {
              "condition": "position_level == 'director'", 
              "description": "部長の場合",
              "next": "president_approval_direct"
            }
          ]
        }
      },
      {
        "id": "director_approval",
        "type": "approver",
        "config": {
          "title": "部長承認（1次）",
          "approver_type": "superior_position",
          "position_name": "部長",
          "amount_limit": null,
          "is_required": true,
          "can_delegate": true,
          "deadline_days": 3
        }
      },
      {
        "id": "president_approval",
        "type": "approver", 
        "config": {
          "title": "社長承認（最終）",
          "approver_type": "position",
          "position_name": "社長",
          "amount_limit": null,
          "is_required": true,
          "can_delegate": false,
          "deadline_days": 5
        }
      },
      {
        "id": "president_approval_direct",
        "type": "approver",
        "config": {
          "title": "社長直接承認",
          "approver_type": "position", 
          "position_name": "社長",
          "amount_limit": null,
          "is_required": true,
          "can_delegate": false,
          "deadline_days": 5,
          "note": "部長申請時の直接承認"
        }
      },
      {
        "id": "end_1",
        "type": "end",
        "config": {"title": "承認完了"}
      }
    ],
    "connections": [
      {"from": "start_1", "to": "applicant_check"},
      {"from": "applicant_check", "to": "director_approval", "condition": "staff"},
      {"from": "applicant_check", "to": "president_approval_direct", "condition": "director"},
      {"from": "director_approval", "to": "president_approval"},
      {"from": "president_approval", "to": "end_1"},
      {"from": "president_approval_direct", "to": "end_1"}
    ]
  }
}
```

## 🎯 階層別承認フローの具体的設定手順

### ステップ1: テンプレート選択
```
┌─────────────────────────────────────────────────────────────┐
│ 新規フロー作成                                              │
├─────────────────────────────────────────────────────────────┤
│ ■ テンプレート選択                                          │
│ ○ 空白から作成                                             │
│ ● 階層別動的承認フロー ← 選択                               │
│ ○ 金額別承認フロー                                         │
│ ○ 部署承認フロー                                           │
│                                                           │
│ フロー名: [見積承認フロー（階層別）      ]                   │
│ 説明: [申請者の役職に応じて承認段階が変わる見積承認フロー]     │
├─────────────────────────────────────────────────────────────┤
│ [作成] [キャンセル]                                         │
└─────────────────────────────────────────────────────────────┘
```

### ステップ2: フロー設計（自動生成後の調整）
```
┌─────────────────────────────────────────────────────────────┐
│ 階層別承認フロー設計                                         │
├─────────────────────────────────────────────────────────────┤
│ ■ 設計キャンバス                                           │
│                                                           │
│     ┌─────────┐                                           │
│     │ 申請開始 │                                           │
│     │ (見積申請)│                                           │
│     └─────────┘                                           │
│          │                                                │
│          ▼                                                │
│     ┌─────────┐                                           │
│     │申請者判定│ ← クリックで設定                            │
│     │(役職確認) │                                           │
│     └─────────┘                                           │
│        │     │                                            │
│     担当者    部長                                          │
│        │     │                                            │
│        ▼     ▼                                            │
│   ┌─────┐ ┌─────┐                                        │
│   │部長承認│ │社長直接│                                      │
│   │(1次) │ │承認   │                                      │
│   └─────┘ └─────┘                                        │
│      │       │                                            │
│      ▼       │                                            │
│   ┌─────┐    │                                            │
│   │社長承認│    │                                            │
│   │(最終) │    │                                            │
│   └─────┘    │                                            │
│      │       │                                            │
│      └───┬───┘                                            │
│          ▼                                                │
│     ┌─────────┐                                           │
│     │ 承認完了 │                                           │
│     └─────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### ステップ3: 申請者判定ノードの詳細設定
```
┌─────────────────────────────────────────────────────────────┐
│ 申請者判定ノード設定                                         │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [申請者役職判定                ]                    │
│ 説明: [申請者の役職レベルを確認して承認フローを分岐]          │
│                                                           │
│ ■ 判定条件設定                                             │
│ 判定項目: [申請者の役職レベル ▼]                            │
│                                                           │
│ 条件1: [担当者（staff）] → [部長承認へ]                     │
│ ├─ 対象役職: ☑担当 ☑主任 ☐課長 ☐部長 ☐社長               │
│ └─ 次のステップ: [director_approval ▼]                     │
│                                                           │
│ 条件2: [部長（director）] → [社長直接承認へ]                │
│ ├─ 対象役職: ☐担当 ☐主任 ☐課長 ☑部長 ☐社長               │
│ └─ 次のステップ: [president_approval_direct ▼]            │
│                                                           │
│ 条件3: [社長（president）] → [申請不可]                     │
│ ├─ 対象役職: ☐担当 ☐主任 ☐課長 ☐部長 ☑社長               │
│ └─ アクション: [エラー表示: 社長は申請できません]            │
│                                                           │
│ [条件追加] [削除] [テスト]                                   │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー]                             │
└─────────────────────────────────────────────────────────────┘
```

### ステップ4: 部長承認ノード設定
```
┌─────────────────────────────────────────────────────────────┐
│ 部長承認ノード設定                                           │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [部長承認（1次承認）            ]                   │
│ 説明: [担当者申請時の1次承認者]                              │
│                                                           │
│ ■ 承認者指定                                               │
│ 承認者タイプ: [上長の役職で指定 ▼]                          │
│ ├─ 役職: [部長 ▼]                                         │
│ ├─ 部署: [申請者と同じ部署 ▼]                              │
│ └─ 代理設定: ☑不在時は副部長が代理                          │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額制限: ☑制限なし                                        │
│ 期限: [3営業日]                                           │
│ 必須承認: ☑必須                                           │
│ 委譲可能: ☑可能                                           │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑承認依頼通知 ☑リマインダー(1日後) ☑期限アラート           │
│ 通知先: ☑メール ☑システム内 ☐Slack                        │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [テスト承認者確認]                       │
└─────────────────────────────────────────────────────────────┘
```

### ステップ5: 社長承認ノード設定
```
┌─────────────────────────────────────────────────────────────┐
│ 社長承認ノード設定                                           │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本設定                                                 │
│ ノード名: [社長承認（最終決裁）          ]                   │
│ 説明: [全ての申請の最終決裁者]                              │
│                                                           │
│ ■ 承認者指定                                               │
│ 承認者タイプ: [特定の役職で指定 ▼]                          │
│ ├─ 役職: [社長 ▼]                                         │
│ ├─ 部署: [本社 ▼]                                         │
│ └─ 代理設定: ☐代理不可（社長のみ）                          │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額制限: ☑制限なし                                        │
│ 期限: [5営業日]                                           │
│ 必須承認: ☑必須                                           │
│ 委譲可能: ☐不可（最終決裁者のため）                         │
│                                                           │
│ ■ 特別設定                                                 │
│ ☑最終決裁者フラグ                                          │
│ ☑承認専門（申請機能は利用不可）                             │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑承認依頼通知 ☑リマインダー(2日後) ☑緊急アラート           │
│ 通知先: ☑メール ☑システム内 ☑SMS(緊急時)                  │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [権限確認]                               │
└─────────────────────────────────────────────────────────────┘
```

### ステップ6: フロー全体のテスト
```
┌─────────────────────────────────────────────────────────────┐
│ フローテストシミュレーション                                 │
├─────────────────────────────────────────────────────────────┤
│ ■ テストケース1: 担当者申請                                 │
│ 申請者: [営業担当A（担当レベル）▼]                          │
│ 見積金額: [500万円]                                        │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 担当者レベル → 部長承認ルート選択        │
│ Step2: 営業部長承認（田中部長）3日以内 ✅権限あり            │
│ Step3: 社長最終承認（山田社長）5日以内 ✅権限あり            │
│ 予想完了: 3-8営業日                                        │
│                                                           │
│ ■ テストケース2: 部長申請                                   │
│ 申請者: [営業部長（部長レベル）▼]                          │
│ 見積金額: [1500万円]                                       │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 部長レベル → 社長直接承認ルート選択      │
│ Step2: 社長直接承認（山田社長）5日以内 ✅権限あり            │
│ 予想完了: 2-5営業日                                        │
│                                                           │
│ ■ テストケース3: 社長申請                                   │
│ 申請者: [社長（社長レベル）▼]                              │
│                                                           │
│ 【実行結果】                                               │
│ ❌ エラー: 社長は申請機能を利用できません                    │
│ → 承認待ち案件のみ表示される設定                           │
├─────────────────────────────────────────────────────────────┤
│ [再テスト] [設定修正] [本番適用]                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 金額別承認フローテンプレート

```json
{
  "name": "金額別承認フロー",
  "description": "金額に応じた承認者振り分け",
  "template_data": {
    "nodes": [
      {
        "type": "start",
        "config": {"title": "見積申請"}
      },
      {
        "type": "condition",
        "config": {
          "title": "金額判定",
          "field": "amount",
          "conditions": [
            {"operator": "<=", "value": 1000000, "next": "manager"},
            {"operator": "<=", "value": 10000000, "next": "director"}, 
            {"operator": ">", "value": 10000000, "next": "president"}
          ]
        }
      },
      {
        "type": "approver",
        "config": {
          "title": "課長承認",
          "approver_type": "position",
          "position_name": "課長"
        }
      },
      {
        "type": "approver", 
        "config": {
          "title": "部長承認",
          "approver_type": "position", 
          "position_name": "部長"
        }
      },
      {
        "type": "approver",
        "config": {
          "title": "社長承認",
          "approver_type": "position",
          "position_name": "社長"
        }
      }
    ]
  }
}
```

## 🔧 管理機能

### フロー管理画面

```
┌─────────────────────────────────────────────────────────────┐
│ 承認フロー管理                                              │
├─────────────────────────────────────────────────────────────┤
│ [新規作成] [テンプレート] [インポート] [エクスポート]         │
├─────────────────────────────────────────────────────────────┤
│ 検索: [                    ] 状態: [全て▼] 作成者: [全て▼]   │
├─┬─────────────────┬────────┬────────┬────────┬──────────┤
│ │フロー名         │作成者  │状態    │更新日  │アクション  │
├─┼─────────────────┼────────┼────────┼────────┼──────────┤
│ │見積承認フロー   │田中    │有効    │12/15   │[編集][複製]│
│ │契約承認フロー   │佐藤    │有効    │12/10   │[編集][複製]│
│ │緊急承認フロー   │山田    │無効    │11/28   │[編集][削除]│
│ │部署別承認フロー │田中    │有効    │11/20   │[編集][複製]│
├─┴─────────────────┴────────┴────────┴────────┴──────────┤
│ 表示: 1-4 / 12件                                           │
├─────────────────────────────────────────────────────────────┤
│ [一括操作] [設定] [ログ確認]                                 │
└─────────────────────────────────────────────────────────────┘
```

### テストシミュレーション画面

```
┌─────────────────────────────────────────────────────────────┐
│ フローテストシミュレーション                                 │
├─────────────────────────────────────────────────────────────┤
│ フロー: [見積承認フロー v1.2                        ▼]      │
├─────────────────────────────────────────────────────────────┤
│ ■ テストデータ設定                                          │
│ 申請者: [営業担当A ▼]                                       │
│ 見積金額: [2,500,000円     ]                                │
│ 部署: [営業部 ▼]                                           │
│ 緊急度: [通常 ▼]                                           │
├─────────────────────────────────────────────────────────────┤
│ ■ シミュレーション結果                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Step1: 営業課長承認                                     │ │
│ │ ├─ 承認者: 田中課長                                     │ │
│ │ ├─ 期限: 3日以内                                       │ │
│ │ └─ 判定: ✅ 承認権限あり                                │ │
│ │                                                       │ │
│ │ Step2: 営業部長承認                                     │ │
│ │ ├─ 承認者: 佐藤部長                                     │ │
│ │ ├─ 期限: 3日以内                                       │ │
│ │ └─ 判定: ✅ 承認権限あり                                │ │
│ │                                                       │ │
│ │ 予想完了時間: 2-6日                                     │ │
│ │ 通知対象者: 申請者、承認者、関係者 (計5名)               │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [再実行] [詳細ログ] [フロー修正] [本番適用]                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 ノーコード設計のメリット

### ✅ **直感的な操作**
- ドラッグ&ドロップによる視覚的設計
- リアルタイムプレビューで即座確認
- プログラミング知識不要

### ✅ **迅速な設定変更**
- 業務変更に即座対応
- テンプレートによる効率化
- バージョン管理で安全な更新

### ✅ **エラー防止**
- 設計時の妥当性チェック
- シミュレーションによる事前検証
- 設定ミスの自動検出

### ✅ **保守性の向上**
- 設計の可視化で理解容易
- 変更履歴の完全追跡
- 影響範囲の明確化

## 🔧 実装時の考慮事項

### **パフォーマンス最適化**
- 大規模フローの描画最適化
- リアルタイム更新の効率化
- キャッシュ戦略の実装

### **セキュリティ対策**
- 設計権限の厳格管理
- 承認フローの改ざん防止
- 監査ログの完全記録

### **拡張性の確保**
- 新しいノードタイプの追加容易性
- カスタムコンポーネントの対応
- 外部システム連携の考慮

## 🛒 実践例：備品購入申請ワークフローの設定

### 要件整理
```
ワークフロー名: 備品購入申請
条件1: 金額 ≤ 1,000円 → ルートA（上長のみで承認完了）
条件2: 金額 > 1,000円 → ルートB（上長 → 最終決裁者の順で承認）
```

### ステップ1: 新規フロー作成

```
┌─────────────────────────────────────────────────────────────┐
│ 新規フロー作成                                              │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本設定                                                 │
│ フロー名: [備品購入申請ワークフロー      ]                   │
│ 説明: [金額に応じて承認ルートが自動選択される備品購入申請]     │
│ カテゴリ: [購買・調達 ▼]                                   │
│ 業務種別: [備品購入 ▼]                                     │
│                                                           │
│ ■ テンプレート選択                                          │
│ ○ 空白から作成                                             │
│ ● 金額別承認フロー ← 選択                                   │
│ ○ 階層別動的承認フロー                                     │
│ ○ 部署承認フロー                                           │
├─────────────────────────────────────────────────────────────┤
│ [作成] [キャンセル]                                         │
└─────────────────────────────────────────────────────────────┘
```

### ステップ2: フロー設計キャンバス（階層別+金額別）

```
┌─────────────────────────────────────────────────────────────┐
│ 備品購入申請ワークフロー設計（階層別+金額別）                 │
├─────────────────────────────────────────────────────────────┤
│ ■ 設計キャンバス                                           │
│                                                           │
│     ┌─────────┐                                           │
│     │ 申請開始 │                                           │
│     │(備品購入) │                                           │
│     └─────────┘                                           │
│          │                                                │
│          ▼                                                │
│     ┌─────────┐                                           │
│     │申請者判定│ ← 1.まず申請者の階層を判定                  │
│     │(階層確認) │                                           │
│     └─────────┘                                           │
│        │     │                                            │
│     平社員    上長                                          │
│        │     │                                            │
│        ▼     ▼                                            │
│   ┌─────┐ ┌─────┐                                        │
│   │金額判定│ │金額判定│ ← 2.各階層で金額判定                  │
│   │(1000円)│ │(5000円)│                                      │
│   └─────┘ └─────┘                                        │
│    │   │    │   │                                        │
│  ≤1000 >1000 ≤5000 >5000                                  │
│    │   │    │   │                                        │
│    ▼   ▼    ▼   ▼                                        │
│  ┌───┐┌───┐┌───┐┌───┐                                │
│  │上長││上長││最終││最終│                                  │
│  │承認││→最││決裁││決裁│                                  │
│  │完了││終決││完了││   │                                  │
│  │   ││裁 ││   ││   │                                  │
│  └───┘└───┘└───┘└───┘                                │
│    │    │    │    │                                      │
│    ▼    ▼    ▼    ▼                                      │
│         ┌─────────┐                                        │
│         │ 承認完了 │                                        │
│         └─────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### ステップ3: 申請者判定ノード設定（1段階目）

```
┌─────────────────────────────────────────────────────────────┐
│ 申請者判定ノード設定                                         │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [申請者階層判定                ]                    │
│ 説明: [申請者の階層に応じて金額判定基準を変更]                │
│ アイコン: [🎭 ▼] 色: [#4A90E2 ▼]                          │
│                                                           │
│ ■ 判定条件設定                                             │
│ 判定項目: [申請者の役職レベル ▼]                            │
│                                                           │
│ ■ 分岐条件                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 条件1: [平社員（staff）] → [平社員用金額判定]             │ │
│ │ ├─ 対象役職: ☑担当 ☑主任 ☐課長 ☐部長 ☐社長             │ │
│ │ ├─ 次ノード: [amount_judge_staff ▼]                     │ │
│ │ └─ 表示色: [緑 #28A745]                                │ │
│ │                                                       │ │
│ │ 条件2: [上長（manager）] → [上長用金額判定]              │ │
│ │ ├─ 対象役職: ☐担当 ☐主任 ☑課長 ☑部長 ☐社長             │ │
│ │ ├─ 次ノード: [amount_judge_manager ▼]                  │ │
│ │ └─ 表示色: [青 #007BFF]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー]                             │
└─────────────────────────────────────────────────────────────┘
```

### ステップ4: 平社員用金額判定ノード設定

```
┌─────────────────────────────────────────────────────────────┐
│ 平社員用金額判定ノード設定                                   │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [平社員用金額判定              ]                    │
│ 説明: [平社員申請時の金額による承認ルート判定]                │
│ アイコン: [💰 ▼] 色: [#28A745 ▼]                          │
│                                                           │
│ ■ 判定条件設定                                             │
│ 判定項目: [業務データ.購入金額 ▼]                            │
│ データソース: [業務データ直接参照 ▼]                        │
│ 参照テーブル: [purchase_requests ▼]                        │
│ 参照フィールド: [amount ▼]                                 │
│                                                           │
│ ■ 分岐条件                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 条件1: [1000円以下] → [上長承認で完了]                   │ │
│ │ ├─ 演算子: [以下 ≤]                                     │ │
│ │ ├─ 基準値: [1000] 円                                   │ │
│ │ ├─ 次ノード: [supervisor_final_approval ▼]             │ │
│ │ └─ ラベル: [≤1000円]                                   │ │
│ │                                                       │ │
│ │ 条件2: [1000円超過] → [上長→最終決裁者]                 │ │
│ │ ├─ 演算子: [より大きい >]                               │ │
│ │ ├─ 基準値: [1000] 円                                   │ │
│ │ ├─ 次ノード: [supervisor_first_approval ▼]            │ │
│ │ └─ ラベル: [>1000円]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー] [判定テスト]                │
└─────────────────────────────────────────────────────────────┘
```

### ステップ5: 上長用金額判定ノード設定

```
┌─────────────────────────────────────────────────────────────┐
│ 上長用金額判定ノード設定                                     │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [上長用金額判定                ]                    │
│ 説明: [上長申請時の金額による承認ルート判定]                  │
│ アイコン: [💰 ▼] 色: [#007BFF ▼]                          │
│                                                           │
│ ■ 判定条件設定                                             │
│ 判定項目: [業務データ.購入金額 ▼]                            │
│ データソース: [業務データ直接参照 ▼]                        │
│ 参照テーブル: [purchase_requests ▼]                        │
│ 参照フィールド: [amount ▼]                                 │
│                                                           │
│ ■ 分岐条件（上長は金額上限が高い）                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 条件1: [5000円以下] → [最終決裁者承認で完了]             │ │
│ │ ├─ 演算子: [以下 ≤]                                     │ │
│ │ ├─ 基準値: [5000] 円                                   │ │
│ │ ├─ 次ノード: [final_approver_only ▼]                   │ │
│ │ └─ ラベル: [≤5000円]                                   │ │
│ │                                                       │ │
│ │ 条件2: [5000円超過] → [最終決裁者承認（要検討）]         │ │
│ │ ├─ 演算子: [より大きい >]                               │ │
│ │ ├─ 基準値: [5000] 円                                   │ │
│ │ ├─ 次ノード: [final_approver_review ▼]                │ │
│ │ └─ ラベル: [>5000円]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [プレビュー] [判定テスト]                │
└─────────────────────────────────────────────────────────────┘
```

### ステップ4: ルートA（上長のみ承認）設定

```
┌─────────────────────────────────────────────────────────────┐
│ 上長承認ノード設定（ルートA）                                │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [上長承認（1000円以下）        ]                   │
│ 説明: [1000円以下の備品購入承認（最終承認）]                 │
│ アイコン: [👤 ▼] 色: [#28A745 ▼]                          │
│                                                           │
│ ■ 承認者指定                                               │
│ 承認者タイプ: [申請者の上長 ▼]                              │
│ ├─ 上長判定方法: [組織図の直属上司 ▼]                       │
│ ├─ 部署: [申請者と同じ部署]                                │
│ └─ 代理設定: ☑不在時は上位管理者が代理                      │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額制限: [1000円以下] ☑条件に応じた制限                    │
│ 期限設定: [2営業日] ☐期限なし                              │
│ 必須承認: ☑必須                                           │
│ 委譲可能: ☑可能                                           │
│                                                           │
│ ■ 特別設定                                                 │
│ ☑最終承認者（この承認で完了）                               │
│ ☑少額決裁権限                                              │
│ ☐上位承認不要                                              │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑承認依頼通知 ☑完了通知 ☑期限アラート                      │
│ 通知先: ☑メール ☑システム内 ☐Slack                        │
│ 件名: [備品購入申請の承認依頼（1000円以下・最終承認）]        │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [承認者確認テスト]                       │
└─────────────────────────────────────────────────────────────┘
```

### ステップ5: ルートB（上長→最終決裁者）設定

#### 5-1: 上長承認ノード（ルートB-1次）

```
┌─────────────────────────────────────────────────────────────┐
│ 上長承認ノード設定（ルートB-1次）                            │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [上長承認（1000円超・1次）     ]                   │
│ 説明: [1000円超の備品購入1次承認]                           │
│ アイコン: [👤 ▼] 色: [#007BFF ▼]                          │
│                                                           │
│ ■ 承認者指定                                               │
│ 承認者タイプ: [申請者の上長 ▼]                              │
│ ├─ 上長判定方法: [組織図の直属上司 ▼]                       │
│ ├─ 部署: [申請者と同じ部署]                                │
│ └─ 代理設定: ☑不在時は同等職位者が代理                      │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額制限: [制限なし] ☑上位承認前提                          │
│ 期限設定: [3営業日] ☐期限なし                              │
│ 必須承認: ☑必須                                           │
│ 委譲可能: ☑可能                                           │
│                                                           │
│ ■ 特別設定                                                 │
│ ☐最終承認者                                                │
│ ☑1次承認者                                                │
│ ☑上位承認必要                                              │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑承認依頼通知 ☑承認完了通知 ☑期限アラート                  │
│ 件名: [備品購入申請の1次承認依頼（1000円超）]                │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [承認者確認テスト]                       │
└─────────────────────────────────────────────────────────────┘
```

#### 5-2: 最終決裁者ノード（ルートB-最終）

```
┌─────────────────────────────────────────────────────────────┐
│ 最終決裁者ノード設定（ルートB-最終）                         │
├─────────────────────────────────────────────────────────────┤
│ ノード名: [最終決裁者承認（1000円超）    ]                   │
│ 説明: [1000円超の備品購入最終決裁]                          │
│ アイコン: [👑 ▼] 色: [#DC3545 ▼]                          │
│                                                           │
│ ■ 承認者指定                                               │
│ 承認者タイプ: [特定役職で指定 ▼]                            │
│ ├─ 役職: [部長 ▼] または [管理者 ▼]                        │
│ ├─ 部署: [管理部門 ▼] または [申請者の上位部署 ▼]          │
│ └─ 代理設定: ☑不在時は副部長が代理                          │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額制限: [制限なし] ☑最終決裁権限                          │
│ 期限設定: [5営業日] ☐期限なし                              │
│ 必須承認: ☑必須                                           │
│ 委譲可能: ☐不可（最終決裁者のため）                         │
│                                                           │
│ ■ 特別設定                                                 │
│ ☑最終決裁者フラグ                                          │
│ ☑高額決裁権限                                              │
│ ☑予算管理権限                                              │
│                                                           │
│ ■ 通知設定                                                 │
│ ☑承認依頼通知 ☑最終承認完了通知 ☑緊急アラート              │
│ 通知先: ☑メール ☑システム内 ☑SMS(緊急時)                  │
│ 件名: [備品購入申請の最終決裁依頼（1000円超）]               │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [権限確認テスト]                         │
└─────────────────────────────────────────────────────────────┘
```

### ステップ6: フロー全体のテストシミュレーション（階層別+金額別）

```
┌─────────────────────────────────────────────────────────────┐
│ 備品購入申請フローテストシミュレーション（階層別+金額別）     │
├─────────────────────────────────────────────────────────────┤
│ ■ テストケース1: 平社員・少額購入                           │
│ 申請者: [営業担当A（平社員）▼]                              │
│ 備品名: [ボールペン10本セット]                              │
│ 購入金額: [800円] ← 1000円以下                             │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 平社員レベル → 平社員用金額判定          │
│ Step2: 金額判定 → 800円 ≤ 1000円 → 上長承認で完了         │
│ Step3: 上長承認（営業課長）2日以内 ✅権限あり・最終承認      │
│ 予想完了: 1-2営業日                                        │
│ 通知対象: 申請者、上長 (計2名)                              │
│                                                           │
│ ■ テストケース2: 平社員・高額購入                           │
│ 申請者: [技術担当B（平社員）▼]                              │
│ 備品名: [プリンター]                                        │
│ 購入金額: [15000円] ← 1000円超                            │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 平社員レベル → 平社員用金額判定          │
│ Step2: 金額判定 → 15000円 > 1000円 → 上長→最終決裁者       │
│ Step3: 上長承認（技術課長）3日以内 ✅権限あり・1次承認       │
│ Step4: 最終決裁者承認（管理部長）5日以内 ✅権限あり・最終    │
│ 予想完了: 3-8営業日                                        │
│ 通知対象: 申請者、上長、最終決裁者 (計3名)                  │
│                                                           │
│ ■ テストケース3: 上長・少額購入                             │
│ 申請者: [営業課長（上長）▼]                                │
│ 備品名: [デスクライト]                                      │
│ 購入金額: [3000円] ← 5000円以下                            │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 上長レベル → 上長用金額判定             │
│ Step2: 金額判定 → 3000円 ≤ 5000円 → 最終決裁者承認で完了   │
│ Step3: 最終決裁者承認（管理部長）5日以内 ✅権限あり・最終    │
│ 予想完了: 2-5営業日                                        │
│ 通知対象: 申請者、最終決裁者 (計2名)                        │
│                                                           │
│ ■ テストケース4: 上長・高額購入                             │
│ 申請者: [技術課長（上長）▼]                                │
│ 備品名: [高性能PC]                                         │
│ 購入金額: [80000円] ← 5000円超                            │
│                                                           │
│ 【実行結果】                                               │
│ Step1: 申請者判定 → 上長レベル → 上長用金額判定             │
│ Step2: 金額判定 → 80000円 > 5000円 → 最終決裁者承認（要検討）│
│ Step3: 最終決裁者承認（管理部長）7日以内 ✅権限あり・要検討   │
│ 予想完了: 3-7営業日                                        │
│ 通知対象: 申請者、最終決裁者 (計2名)                        │
├─────────────────────────────────────────────────────────────┤
│ [再テスト] [設定修正] [本番適用] [フローエクスポート]        │
└─────────────────────────────────────────────────────────────┘
```

### ステップ7: 申請フォームとの連携設定

```
┌─────────────────────────────────────────────────────────────┐
│ 申請フォーム連携設定                                         │
├─────────────────────────────────────────────────────────────┤
│ ■ 入力フィールド設定                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ フィールド1: 備品名                                     │ │
│ │ ├─ 項目名: [備品名]                                     │ │
│ │ ├─ 入力タイプ: [テキスト ▼]                             │ │
│ │ ├─ 必須: ☑                                             │ │
│ │ └─ データ項目: [item_name]                              │ │
│ │                                                       │ │
│ │ フィールド2: 購入金額 ★重要                             │ │
│ │ ├─ 項目名: [購入金額]                                   │ │
│ │ ├─ 入力タイプ: [数値（円） ▼]                           │ │
│ │ ├─ 必須: ☑                                             │ │
│ │ ├─ 最小値: [1] 最大値: [1000000]                       │ │
│ │ ├─ データ項目: [purchase_amount] ← 判定ノードで使用     │ │
│ │ └─ 入力チェック: ☑正の整数のみ                          │ │
│ │                                                       │ │
│ │ フィールド3: 購入理由                                   │ │
│ │ ├─ 項目名: [購入理由]                                   │ │
│ │ ├─ 入力タイプ: [テキストエリア ▼]                       │ │
│ │ ├─ 必須: ☑                                             │ │
│ │ └─ データ項目: [purchase_reason]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                           │
│ ■ 判定フィールドマッピング                                  │
│ 金額判定ノード ← [purchase_amount] フィールド               │
│ データ型: 数値（整数）                                      │
│ 単位: 円                                                   │
│                                                           │
│ ■ プレビュー                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 備品購入申請フォーム                                     │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 備品名: [                              ] *必須      │ │ │
│ │ │ 購入金額: [            ] 円 *必須                   │ │ │
│ │ │ 購入理由: [                              ] *必須    │ │ │
│ │ │           [                              ]          │ │ │
│ │ │                                                   │ │ │
│ │ │ [申請する] [下書き保存] [キャンセル]                  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [プレビュー] [テスト入力]                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 設定のポイント

### **✅ 金額判定の精度**
- **基準値設定**: 1000円をしきい値として明確に設定
- **演算子選択**: ≤（以下）と >（より大きい）で漏れなく分岐
- **エラーハンドリング**: 無効な金額入力時の適切な処理

### **✅ 承認者の自動選択**
- **上長の自動判定**: 申請者の組織図上の直属上司を自動選択
- **代理設定**: 不在時の代理承認者を事前設定
- **権限チェック**: 承認者の権限範囲を自動確認

### **✅ ルート別の最適化**
- **ルートA**: 迅速な少額決裁（2営業日）
- **ルートB**: 慎重な高額決裁（3+5営業日）
- **通知最適化**: 各ルートに応じた通知設定

この設定により、**申請者が金額を入力するだけで自動的に最適な承認ルートが選択**され、効率的で確実な備品購入承認プロセスが実現できます。

このノーコード承認フロー設計画面により、**プログラミング知識不要で柔軟かつ強力な承認システム**を構築・運用することができます。
