<?php

namespace App\GraphQL\Queries;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class UsersQuery extends Query
{
    protected $attributes = [
        'name' => 'users',
        'description' => 'ユーザー一覧を取得',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('User'));
    }

    public function args(): array
    {
        return [
            'search' => [
                'name' => 'search',
                'type' => Type::string(),
                'description' => '検索キーワード',
            ],
            'system_level' => [
                'name' => 'system_level',
                'type' => Type::string(),
                'description' => 'システム権限レベル',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'is_admin' => [
                'name' => 'is_admin',
                'type' => Type::boolean(),
                'description' => '管理者フラグ',
            ],
            'department_id' => [
                'name' => 'department_id',
                'type' => Type::int(),
                'description' => '部署ID',
            ],
            'role_id' => [
                'name' => 'role_id',
                'type' => Type::int(),
                'description' => '役割ID',
            ],
            'limit' => [
                'name' => 'limit',
                'type' => Type::int(),
                'description' => '取得件数',
                'defaultValue' => 15,
            ],
            'offset' => [
                'name' => 'offset',
                'type' => Type::int(),
                'description' => 'オフセット',
                'defaultValue' => 0,
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $query = User::with($fields->getRelations());

        // 検索条件
        if (isset($args['search'])) {
            $search = $args['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_kana', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // システム権限レベルでフィルタ
        if (isset($args['system_level'])) {
            $query->where('system_level', $args['system_level']);
        }

        // アクティブ状態でフィルタ
        if (isset($args['is_active'])) {
            $query->where('is_active', $args['is_active']);
        }

        // 管理者フラグでフィルタ
        if (isset($args['is_admin'])) {
            $query->where('is_admin', $args['is_admin']);
        }

        // 部署でフィルタ
        if (isset($args['department_id'])) {
            $query->whereHas('departments', function ($q) use ($args) {
                $q->where('departments.id', $args['department_id']);
            });
        }

        // 役割でフィルタ
        if (isset($args['role_id'])) {
            $query->whereHas('roles', function ($q) use ($args) {
                $q->where('roles.id', $args['role_id']);
            });
        }

        // ソート
        $query->orderBy('created_at', 'desc');

        // ページネーション
        if (isset($args['limit'])) {
            $query->limit($args['limit']);
        }

        if (isset($args['offset'])) {
            $query->offset($args['offset']);
        }

        return $query->get();
    }
}
