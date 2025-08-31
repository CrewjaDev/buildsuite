<?php

namespace App\GraphQL\Queries;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class UserQuery extends Query
{
    protected $attributes = [
        'name' => 'user',
        'description' => 'ユーザー詳細を取得',
    ];

    public function type(): Type
    {
        return \GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ユーザーID',
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $user = User::with($fields->getRelations())->find($args['id']);

        if (!$user) {
            throw new \Exception('ユーザーが見つかりません');
        }

        return $user;
    }
}
