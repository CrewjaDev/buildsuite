<?php

namespace App\GraphQL\Queries;

use App\Models\Role;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class RolesQuery extends Query
{
    protected $attributes = [
        'name' => 'roles',
        'description' => '役割一覧を取得',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('Role'));
    }

    public function args(): array
    {
        return [
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'is_system' => [
                'name' => 'is_system',
                'type' => Type::boolean(),
                'description' => 'システム役割フラグ',
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $query = Role::with($fields->getRelations());

        if (isset($args['is_active'])) {
            $query->where('is_active', $args['is_active']);
        }

        if (isset($args['is_system'])) {
            $query->where('is_system', $args['is_system']);
        }

        return $query->orderBy('priority', 'desc')->get();
    }
}
