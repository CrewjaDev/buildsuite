<?php

namespace App\GraphQL\Queries;

use App\Models\Department;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class DepartmentsQuery extends Query
{
    protected $attributes = [
        'name' => 'departments',
        'description' => '部署一覧を取得',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('Department'));
    }

    public function args(): array
    {
        return [
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'parent_id' => [
                'name' => 'parent_id',
                'type' => Type::int(),
                'description' => '親部署ID',
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $query = Department::with($fields->getRelations());

        if (isset($args['is_active'])) {
            $query->where('is_active', $args['is_active']);
        }

        if (isset($args['parent_id'])) {
            $query->where('parent_id', $args['parent_id']);
        }

        return $query->orderBy('sort_order', 'asc')->get();
    }
}
