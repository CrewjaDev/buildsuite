<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUserMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createUser',
        'description' => 'ユーザーを作成',
    ];

    public function type(): Type
    {
        return \GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'name' => [
                'name' => 'name',
                'type' => Type::nonNull(Type::string()),
                'description' => 'ユーザー名',
            ],
            'email' => [
                'name' => 'email',
                'type' => Type::nonNull(Type::string()),
                'description' => 'メールアドレス',
            ],
            'password' => [
                'name' => 'password',
                'type' => Type::nonNull(Type::string()),
                'description' => 'パスワード',
            ],
            'first_name' => [
                'name' => 'first_name',
                'type' => Type::string(),
                'description' => '名',
            ],
            'last_name' => [
                'name' => 'last_name',
                'type' => Type::string(),
                'description' => '姓',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
                'defaultValue' => true,
            ],
        ];
    }

    public function resolve($root, $args)
    {
        // 認証チェック
        if (!Auth::check()) {
            throw new \Exception('認証が必要です');
        }

        $user = Auth::user();

        // 権限チェック
        if (!$user->is_admin && !$user->hasPermission('user.manage')) {
            throw new \Exception('ユーザー作成の権限がありません');
        }

        // バリデーション
        $validator = Validator::make($args, [
            'name' => 'required|string|max:255|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // ユーザー作成
            $newUser = User::create([
                'name' => $args['name'],
                'email' => $args['email'],
                'password' => Hash::make($args['password']),
                'first_name' => $args['first_name'] ?? null,
                'last_name' => $args['last_name'] ?? null,
                'is_active' => $args['is_active'] ?? true,
            ]);

            return $newUser;

        } catch (\Exception $e) {
            throw new \Exception('ユーザーの作成に失敗しました: ' . $e->getMessage());
        }
    }
}
