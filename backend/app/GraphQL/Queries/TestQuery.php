<?php

namespace App\GraphQL\Queries;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;

class TestQuery extends Query
{
    protected $attributes = [
        'name' => 'test',
        'description' => 'テスト用クエリ',
    ];

    public function type(): Type
    {
        return Type::string();
    }

    public function args(): array
    {
        return [];
    }

    public function resolve($root, $args)
    {
        return 'GraphQL is working!';
    }
}
