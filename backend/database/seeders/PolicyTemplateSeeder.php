<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PolicyTemplate;

class PolicyTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存のテンプレートをクリア
        PolicyTemplate::truncate();

        // 部署・組織関連テンプレート
        $this->createDepartmentTemplates();
        
        // データ属性関連テンプレート
        $this->createDataAttributeTemplates();
        
        // 作成者・権限関連テンプレート
        $this->createUserPermissionTemplates();
        
        // 時間・環境関連テンプレート
        $this->createTimeEnvironmentTemplates();
    }

    /**
     * 部署・組織関連テンプレートを作成
     */
    private function createDepartmentTemplates(): void
    {
        // 部署制限テンプレート（統合版）
        PolicyTemplate::create([
            'template_code' => 'department_restriction',
            'name' => '部署制限',
            'description' => '部署に基づくデータアクセス制限',
            'category' => '部署・組織',
            'condition_type' => 'department_restriction',
            'condition_rule' => [
                'field' => 'data.department_id',
                'operator' => '{{restriction_type}}',
                'value' => '{{department_value}}'
            ],
            'parameters' => [
                'required_fields' => ['data.department_id'],
                'configurable_values' => [
                    'restriction_type' => [
                        'type' => 'select',
                        'label' => '制限タイプ',
                        'default' => 'eq',
                        'options' => [
                            ['value' => 'eq', 'label' => '自部署制限（自分の部署のみ）'],
                            ['value' => 'in', 'label' => '特定部署制限（指定部署のみ）'],
                            ['value' => 'exists', 'label' => '全部署制限（全部署アクセス）']
                        ],
                        'description' => '部署制限のタイプを選択してください'
                    ],
                    'department_ids' => [
                        'type' => 'department_selection',
                        'label' => '対象部署',
                        'default' => [],
                        'description' => '特定部署制限の場合に選択してください',
                        'depends_on' => 'restriction_type',
                        'depends_value' => 'in'
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'delete', 'approve'],
            'tags' => ['部署制限', '基本制限'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'basic_permission',
                'description' => '部署に基づく基本的なアクセス制限'
            ]
        ]);
    }

    /**
     * データ属性関連テンプレートを作成
     */
    private function createDataAttributeTemplates(): void
    {
        // ステータス制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'status_restriction',
            'name' => 'ステータス制限',
            'description' => '特定ステータスのデータのみアクセス可能',
            'category' => 'データ属性',
            'condition_type' => 'status_restriction',
            'condition_rule' => [
                'field' => 'data.status',
                'operator' => 'in',
                'value' => '{{allowed_statuses}}'
            ],
            'parameters' => [
                'required_fields' => ['data.status'],
                'configurable_values' => [
                    'allowed_statuses' => [
                        'type' => 'array',
                        'label' => '許可ステータス',
                        'default' => ['承認済み', '承認依頼中'],
                        'description' => 'アクセス可能なステータスのリスト'
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'approve'],
            'tags' => ['ステータス制限', '業務フロー'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'workflow_permission',
                'description' => '業務フローに基づくステータス制限'
            ]
        ]);

        // 金額制限テンプレート（拡張版）
        PolicyTemplate::create([
            'template_code' => 'amount_limit_restriction',
            'name' => '金額制限',
            'description' => '指定金額条件に基づくデータアクセス制限（上限・下限・範囲制限）',
            'category' => 'データ属性',
            'condition_type' => 'amount_restriction',
            'condition_rule' => [
                'field' => 'data.amount',
                'operator' => '{{restriction_type}}',
                'value' => '{{amount_value}}'
            ],
            'parameters' => [
                'required_fields' => ['data.amount'],
                'configurable_values' => [
                    'restriction_type' => [
                        'type' => 'select',
                        'label' => '制限タイプ',
                        'default' => 'lte',
                        'options' => [
                            ['value' => 'lte', 'label' => '上限制限（以下）'],
                            ['value' => 'gte', 'label' => '下限制限（以上）'],
                            ['value' => 'between', 'label' => '範囲制限']
                        ],
                        'description' => '金額制限の種類を選択'
                    ],
                    'amount_limit' => [
                        'type' => 'number',
                        'label' => '金額上限',
                        'default' => 1000000,
                        'unit' => '円',
                        'description' => 'アクセス可能な最大金額（上限制限・範囲制限で使用）',
                        'min' => 0
                    ],
                    'min_amount' => [
                        'type' => 'number',
                        'label' => '金額下限',
                        'default' => 0,
                        'unit' => '円',
                        'description' => 'アクセス可能な最小金額（下限制限・範囲制限で使用）',
                        'min' => 0
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'delete', 'approve'],
            'tags' => ['金額制限', '承認フロー'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'approval_permission',
                'description' => '承認権限に基づく金額制限（上限・下限・範囲制限対応）'
            ]
        ]);

        // 期間制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'period_restriction',
            'name' => '期間制限',
            'description' => '指定期間内のデータのみアクセス可能',
            'category' => 'データ属性',
            'condition_type' => 'period_restriction',
            'condition_rule' => null,
            'parameters' => [
                'required_fields' => ['data.created_at'],
                'configurable_values' => [
                    'start_date' => [
                        'type' => 'date',
                        'label' => '開始日',
                        'default' => null,
                        'description' => 'アクセス可能な期間の開始日'
                    ],
                    'end_date' => [
                        'type' => 'date',
                        'label' => '終了日',
                        'default' => null,
                        'description' => 'アクセス可能な期間の終了日'
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list'],
            'tags' => ['期間制限', 'データ管理'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'data_management',
                'description' => 'データ管理に基づく期間制限'
            ]
        ]);
    }

    /**
     * 作成者・権限関連テンプレートを作成
     */
    private function createUserPermissionTemplates(): void
    {
        // 作成者制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'creator_restriction',
            'name' => '作成者制限',
            'description' => '自分が作成したデータのみアクセス可能',
            'category' => '作成者・権限',
            'condition_type' => 'creator_restriction',
            'condition_rule' => [
                'field' => 'data.created_by',
                'operator' => 'eq',
                'value' => 'user.id'
            ],
            'parameters' => [
                'required_fields' => ['data.created_by', 'user.id'],
                'configurable_values' => []
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'delete'],
            'tags' => ['作成者制限', '基本制限'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'basic_permission',
                'description' => '基本的な作成者制限'
            ]
        ]);

 
        // 利用者制限テンプレート（統合版）
        PolicyTemplate::create([
            'template_code' => 'user_access_restriction',
            'name' => '利用者制限',
            'description' => 'ユーザー属性に基づく柔軟なアクセス制限（部署・職位・システムレベル等の組み合わせ）',
            'category' => '作成者・権限',
            'condition_type' => 'user_access_restriction',
            'condition_rule' => [
                'field' => 'user.access_restriction',
                'operator' => 'and',
                'rules' => '{{builder_rules}}'
            ],
            'parameters' => [
                'required_fields' => ['user.department_id', 'user.position_id', 'user.system_level_id'],
                'configurable_values' => [
                    'builder_rules' => [
                        'type' => 'condition_builder',
                        'label' => '利用者条件',
                        'default' => [
                            'operator' => 'and',
                            'rules' => []
                        ],
                        'description' => '部署・職位・システムレベル等の組み合わせ条件を設定',
                        'available_fields' => [
                            'user.department_id' => '部署',
                            'user.position_id' => '職位',
                            'user.system_level_id' => 'システムレベル',
                            'user.role_ids' => '役割',
                            'user.id' => 'ユーザーID',
                            'data.created_by' => '作成者'
                        ],
                        'field_operators' => [
                            'user.department_id' => ['in' => '含む'],
                            'user.position_id' => ['in' => '含む', 'gte' => '以上', 'lte' => '以下'],
                            'user.system_level_id' => ['in' => '含む', 'gte' => '以上', 'lte' => '以下'],
                            'user.role_ids' => ['in' => '含む'],
                            'user.id' => ['in' => '含む'],
                            'data.created_by' => ['in' => '含む']
                        ],
                        'available_operators' => [
                            'in' => '含む',
                            'gte' => '以上',
                            'lte' => '以下'
                        ],
                        'max_depth' => 5
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'delete', 'approve'],
            'tags' => ['利用者制限', '柔軟制限'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 40,
            'metadata' => [
                'category' => 'flexible_user_permission',
                'description' => 'ユーザー属性の柔軟な組み合わせによるアクセス制限'
            ]
        ]);
    }

    /**
     * 時間・環境関連テンプレートを作成
     */
    private function createTimeEnvironmentTemplates(): void
    {
        // 営業時間制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'business_hours_restriction',
            'name' => '営業時間制限',
            'description' => '営業時間内のみアクセス可能',
            'category' => '時間・環境',
            'condition_type' => 'time_restriction',
            'condition_rule' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'current_time.hour',
                        'operator' => 'gte',
                        'value' => '{{start_hour}}'
                    ],
                    [
                        'field' => 'current_time.hour',
                        'operator' => 'lt',
                        'value' => '{{end_hour}}'
                    ]
                ]
            ],
            'parameters' => [
                'required_fields' => ['current_time'],
                'configurable_values' => [
                    'start_hour' => [
                        'type' => 'number',
                        'label' => '開始時間',
                        'default' => 9,
                        'min' => 0,
                        'max' => 23,
                        'description' => '営業開始時間（時）'
                    ],
                    'end_hour' => [
                        'type' => 'number',
                        'label' => '終了時間',
                        'default' => 18,
                        'min' => 0,
                        'max' => 23,
                        'description' => '営業終了時間（時）'
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'approve'],
            'tags' => ['時間制限', '営業時間'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'time_permission',
                'description' => '営業時間に基づくアクセス制限'
            ]
        ]);

        // 平日制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'weekday_restriction',
            'name' => '平日制限',
            'description' => '平日のみアクセス可能',
            'category' => '時間・環境',
            'condition_type' => 'time_restriction',
            'condition_rule' => [
                'field' => 'current_time.weekday',
                'operator' => 'in',
                'value' => [1, 2, 3, 4, 5] // 月曜日から金曜日
            ],
            'parameters' => [
                'required_fields' => ['current_time'],
                'configurable_values' => []
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'approve'],
            'tags' => ['時間制限', '平日'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'time_permission',
                'description' => '平日に基づくアクセス制限'
            ]
        ]);

        // 社内IP制限テンプレート
        PolicyTemplate::create([
            'template_code' => 'internal_ip_restriction',
            'name' => '社内IP制限',
            'description' => '社内IPからのアクセスのみ許可',
            'category' => '時間・環境',
            'condition_type' => 'ip_restriction',
            'condition_rule' => [
                'field' => 'request.ip',
                'operator' => 'in',
                'value' => '{{allowed_ips}}'
            ],
            'parameters' => [
                'required_fields' => ['request.ip'],
                'configurable_values' => [
                    'allowed_ips' => [
                        'type' => 'array',
                        'label' => '許可IPアドレス',
                        'default' => ['192.168.1.0/24', '10.0.0.0/8'],
                        'description' => 'アクセス可能なIPアドレスまたはCIDR'
                    ]
                ]
            ],
            'applicable_actions' => ['view', 'list', 'edit', 'approve', 'delete'],
            'tags' => ['IP制限', 'セキュリティ'],
            'is_system' => true,
            'is_active' => true,
            'priority' => 50,
            'metadata' => [
                'category' => 'security_permission',
                'description' => 'セキュリティに基づくIP制限'
            ]
        ]);
    }
}
