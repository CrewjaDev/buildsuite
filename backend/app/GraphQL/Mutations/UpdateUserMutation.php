<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UpdateUserMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateUser',
        'description' => 'ユーザーを更新',
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
            'name' => [
                'name' => 'name',
                'type' => Type::string(),
                'description' => 'ユーザー名',
            ],
            'email' => [
                'name' => 'email',
                'type' => Type::string(),
                'description' => 'メールアドレス',
            ],
            'password' => [
                'name' => 'password',
                'type' => Type::string(),
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

        // 更新対象ユーザー取得
        $targetUser = User::find($args['id']);
        if (!$targetUser) {
            throw new \Exception('ユーザーが見つかりません');
        }

        // 権限チェック
        if (!$user->is_admin && !$user->hasPermission('user.manage')) {
            throw new \Exception('ユーザー更新の権限がありません');
        }

        // バリデーション
        $validator = Validator::make($args, [
            'name' => 'nullable|string|max:255|unique:users,name,' . $args['id'],
            'email' => 'nullable|email|unique:users,email,' . $args['id'],
            'password' => 'nullable|string|min:8',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 更新データの準備
            $updateData = [];
            $fields = ['name', 'email', 'first_name', 'last_name', 'is_active'];
            
            foreach ($fields as $field) {
                if (isset($args[$field])) {
                    $updateData[$field] = $args[$field];
                }
            }

            // パスワードの更新
            if (isset($args['password'])) {
                $updateData['password'] = Hash::make($args['password']);
            }

            // ユーザー更新
            $targetUser->update($updateData);

            return $targetUser;

        } catch (\Exception $e) {
            throw new \Exception('ユーザーの更新に失敗しました: ' . $e->getMessage());
        }
    }
}
