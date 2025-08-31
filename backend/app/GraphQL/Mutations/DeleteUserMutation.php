<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class DeleteUserMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteUser',
        'description' => 'ユーザーを削除',
    ];

    public function type(): Type
    {
        return Type::boolean();
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

    public function resolve($root, $args)
    {
        // 認証チェック
        if (!Auth::check()) {
            throw new \Exception('認証が必要です');
        }

        $user = Auth::user();

        // 削除対象ユーザー取得
        $targetUser = User::find($args['id']);
        if (!$targetUser) {
            throw new \Exception('ユーザーが見つかりません');
        }

        // 権限チェック
        if (!$user->is_admin && !$user->hasPermission('user.manage')) {
            throw new \Exception('ユーザー削除の権限がありません');
        }

        // 自分自身の削除を防ぐ
        if ($targetUser->id === $user->id) {
            throw new \Exception('自分自身を削除することはできません');
        }

        try {
            // ユーザー削除（ソフトデリート）
            $targetUser->delete();

            return true;

        } catch (\Exception $e) {
            throw new \Exception('ユーザーの削除に失敗しました: ' . $e->getMessage());
        }
    }
}
