<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BusinessType;

class BusinessTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessTypes = [
            // 財務関連
            [
                'code' => 'estimate',
                'name' => '見積',
                'description' => '見積書の作成・承認業務',
                'category' => 'financial',
                'sort_order' => 10,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'estimate.create',
                    'estimate.view',
                    'estimate.edit',
                    'estimate.delete',
                    'estimate.approval.request',
                    'estimate.approval.view',
                    'estimate.approval.approve',
                    'estimate.approval.reject',
                    'estimate.approval.return',
                    'estimate.approval.cancel'
                ],
                'settings' => [
                    'max_amount' => 10000000,
                    'currency' => 'JPY',
                    'validity_days' => 30
                ]
            ],
            [
                'code' => 'budget',
                'name' => '予算',
                'description' => '予算の申請・承認業務',
                'category' => 'financial',
                'sort_order' => 20,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'budget.create',
                    'budget.view',
                    'budget.edit',
                    'budget.delete',
                    'budget.approval.request',
                    'budget.approval.view',
                    'budget.approval.approve',
                    'budget.approval.reject',
                    'budget.approval.return',
                    'budget.approval.cancel'
                ],
                'settings' => [
                    'fiscal_year' => true,
                    'department_budget' => true
                ]
            ],
            [
                'code' => 'purchase',
                'name' => '発注',
                'description' => '物品・サービスの発注業務',
                'category' => 'financial',
                'sort_order' => 30,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'purchase.create',
                    'purchase.view',
                    'purchase.edit',
                    'purchase.delete',
                    'purchase.approval.request',
                    'purchase.approval.view',
                    'purchase.approval.approve',
                    'purchase.approval.reject',
                    'purchase.approval.return',
                    'purchase.approval.cancel'
                ],
                'settings' => [
                    'vendor_management' => true,
                    'contract_management' => true
                ]
            ],
            [
                'code' => 'payment',
                'name' => '支払',
                'description' => '支払いの承認業務',
                'category' => 'financial',
                'sort_order' => 40,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'payment.create',
                    'payment.view',
                    'payment.edit',
                    'payment.delete',
                    'payment.approval.request',
                    'payment.approval.view',
                    'payment.approval.approve',
                    'payment.approval.reject',
                    'payment.approval.return',
                    'payment.approval.cancel'
                ],
                'settings' => [
                    'payment_methods' => ['bank_transfer', 'check', 'cash'],
                    'approval_threshold' => 100000
                ]
            ],

            // 契約関連
            [
                'code' => 'contract',
                'name' => '契約',
                'description' => '契約書の締結・承認業務',
                'category' => 'legal',
                'sort_order' => 50,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'contract.create',
                    'contract.view',
                    'contract.edit',
                    'contract.delete',
                    'contract.approval.request',
                    'contract.approval.view',
                    'contract.approval.approve',
                    'contract.approval.reject',
                    'contract.approval.return',
                    'contract.approval.cancel'
                ],
                'settings' => [
                    'legal_review_required' => true,
                    'contract_types' => ['service', 'supply', 'employment', 'nda']
                ]
            ],

            // 人事関連
            [
                'code' => 'leave',
                'name' => '休暇',
                'description' => '休暇申請・承認業務',
                'category' => 'hr',
                'sort_order' => 60,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'leave.create',
                    'leave.view',
                    'leave.edit',
                    'leave.delete',
                    'leave.approval.request',
                    'leave.approval.view',
                    'leave.approval.approve',
                    'leave.approval.reject',
                    'leave.approval.return',
                    'leave.approval.cancel'
                ],
                'settings' => [
                    'leave_types' => ['annual', 'sick', 'personal', 'maternity'],
                    'max_consecutive_days' => 30
                ]
            ],
            [
                'code' => 'overtime',
                'name' => '残業',
                'description' => '残業申請・承認業務',
                'category' => 'hr',
                'sort_order' => 70,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'overtime.create',
                    'overtime.view',
                    'overtime.edit',
                    'overtime.delete',
                    'overtime.approval.request',
                    'overtime.approval.view',
                    'overtime.approval.approve',
                    'overtime.approval.reject',
                    'overtime.approval.return',
                    'overtime.approval.cancel'
                ],
                'settings' => [
                    'max_hours_per_day' => 8,
                    'compensation_rate' => 1.25
                ]
            ],

            // 工事関連
            [
                'code' => 'construction',
                'name' => '工事',
                'description' => '工事関連の承認業務',
                'category' => 'construction',
                'sort_order' => 100,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'construction.create',
                    'construction.view',
                    'construction.edit',
                    'construction.delete',
                    'construction.approval.request',
                    'construction.approval.view',
                    'construction.approval.approve',
                    'construction.approval.reject',
                    'construction.approval.return',
                    'construction.approval.cancel'
                ],
                'settings' => [
                    'max_amount' => 50000000,
                    'currency' => 'JPY',
                    'validity_days' => 60
                ]
            ],

            // 一般業務
            [
                'code' => 'general',
                'name' => '一般',
                'description' => '一般的な承認業務',
                'category' => 'general',
                'sort_order' => 110,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'general.create',
                    'general.view',
                    'general.edit',
                    'general.delete',
                    'general.approval.request',
                    'general.approval.view',
                    'general.approval.approve',
                    'general.approval.reject',
                    'general.approval.return',
                    'general.approval.cancel'
                ],
                'settings' => []
            ],

            // システム管理
            [
                'code' => 'system',
                'name' => 'システム',
                'description' => 'システム管理関連の承認業務',
                'category' => 'system',
                'sort_order' => 120,
                'is_active' => true,
                'requires_approval' => true,
                'default_permissions' => [
                    'system.create',
                    'system.view',
                    'system.edit',
                    'system.delete',
                    'system.approval.request',
                    'system.approval.view',
                    'system.approval.approve',
                    'system.approval.reject',
                    'system.approval.return',
                    'system.approval.cancel'
                ],
                'settings' => [
                    'admin_only' => true
                ]
            ]
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::updateOrCreate(
                ['code' => $businessType['code']],
                $businessType
            );
        }
    }
}
