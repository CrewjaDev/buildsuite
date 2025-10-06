<?php

namespace Database\Seeders;

use App\Models\AccessPolicy;
use App\Models\BusinessCode;
use Illuminate\Database\Seeder;

class AccessPolicySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存のABACポリシーをクリア
        AccessPolicy::truncate();
        
        // 見積管理のABACポリシーのみ作成
        $this->createEstimatePolicies();
    }

    /**
     * 見積管理のABACポリシーを作成
     */
    private function createEstimatePolicies(): void
    {
        // 見積金額による表示制限ポリシー
        AccessPolicy::create([
            'name' => '見積金額制限ポリシー（課長以下）',
            'description' => '課長以下の職位は100万円以下の見積のみ表示可能',
            'business_code' => 'estimate',
            'action' => 'view',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'position_id',
                        'operator' => 'in',
                        'value' => [1, 2, 3] // 社員、担当、課長のID
                    ],
                    [
                        'field' => 'data.amount',
                        'operator' => 'gt',
                        'value' => 1000000 // 100万円を超える
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'deny',
            'priority' => 100,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'amount_restriction',
                'target_position' => 'section_chief_and_below'
            ]
        ]);

        // 部署別見積表示制限ポリシー
        AccessPolicy::create([
            'name' => '部署別見積表示制限ポリシー',
            'description' => '自部署の見積のみ表示可能（システム管理者除く）',
            'business_code' => 'estimate',
            'action' => 'view',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'user_id',
                        'operator' => 'ne',
                        'value' => 2 // システム管理者（admin）以外
                    ],
                    [
                        'field' => 'department_id',
                        'operator' => 'ne',
                        'value' => 'data.department_id'
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'deny',
            'priority' => 90,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'department_restriction',
                'exclude_system_admin' => true
            ]
        ]);

        // 見積編集権限ポリシー
        AccessPolicy::create([
            'name' => '見積編集権限ポリシー',
            'description' => '作成者以外は編集不可、または承認済み見積は編集不可',
            'business_code' => 'estimate',
            'action' => 'edit',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'or',
                'rules' => [
                    [
                        'field' => 'user_id',
                        'operator' => 'ne',
                        'value' => 'data.created_by'
                    ],
                    [
                        'field' => 'data.status',
                        'operator' => 'in',
                        'value' => ['approved', 'rejected']
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'deny',
            'priority' => 80,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'edit_restriction',
                'target_status' => ['approved', 'rejected']
            ]
        ]);

        // 見積閲覧許可ポリシー（基本権限）
        AccessPolicy::create([
            'name' => '見積閲覧許可ポリシー（基本）',
            'description' => 'すべてのユーザーが見積を閲覧可能',
            'business_code' => 'estimate',
            'action' => 'view',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'user_id',
                        'operator' => 'exists',
                        'value' => null
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'allow',
            'priority' => 10,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'basic_permission',
                'description' => '基本的な閲覧権限'
            ]
        ]);

        // 見積作成許可ポリシー
        AccessPolicy::create([
            'name' => '見積作成許可ポリシー',
            'description' => 'すべてのユーザーが見積を作成可能',
            'business_code' => 'estimate',
            'action' => 'create',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'user_id',
                        'operator' => 'exists',
                        'value' => null
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'allow',
            'priority' => 10,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'basic_permission',
                'description' => '基本的な作成権限'
            ]
        ]);

        // 見積編集許可ポリシー（作成者のみ）
        AccessPolicy::create([
            'name' => '見積編集許可ポリシー（作成者）',
            'description' => '作成者は自分の見積を編集可能',
            'business_code' => 'estimate',
            'action' => 'edit',
            'resource_type' => 'estimate',
            'conditions' => [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'user_id',
                        'operator' => 'eq',
                        'value' => 'data.created_by'
                    ],
                    [
                        'field' => 'data.status',
                        'operator' => 'in',
                        'value' => ['draft', 'pending_approval']
                    ]
                ]
            ],
            'scope' => null,
            'effect' => 'allow',
            'priority' => 20,
            'is_active' => true,
            'is_system' => false,
            'metadata' => [
                'category' => 'edit_permission',
                'description' => '作成者の編集権限'
            ]
        ]);
    }

}
