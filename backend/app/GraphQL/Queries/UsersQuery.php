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
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'search' => [
                'name' => 'search',
                'type' => Type::string(),
                'description' => '検索キーワード',
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $query = User::with($fields->getRelations());

        if (isset($args['is_active'])) {
            $query->where('is_active', $args['is_active']);
        }

        if (isset($args['search'])) {
            $search = $args['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->get();
    }
}
