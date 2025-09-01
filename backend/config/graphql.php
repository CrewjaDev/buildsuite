<?php

return [
    /*
    |--------------------------------------------------------------------------
    | GraphQL endpoint
    |--------------------------------------------------------------------------
    |
    | The endpoint where GraphQL will be served.
    |
    */
    'route' => [
        'uri' => 'graphql',
        'name' => 'graphql',
        // 'middleware' => [
        //     'auth:sanctum',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL controller
    |--------------------------------------------------------------------------
    |
    | The controller that handles GraphQL requests.
    |
    */
    'controller' => \Rebing\GraphQL\GraphQLController::class,

    /*
    |--------------------------------------------------------------------------
    | GraphQL schemas
    |--------------------------------------------------------------------------
    |
    | The schemas that are available for GraphQL.
    |
    */
    'schemas' => [
        'default' => [
            'query' => [
                'users' => \App\GraphQL\Queries\UsersQuery::class,
                'user' => \App\GraphQL\Queries\UserQuery::class,
                'roles' => \App\GraphQL\Queries\RolesQuery::class,
                'departments' => \App\GraphQL\Queries\DepartmentsQuery::class,
                'approvalRequests' => \App\GraphQL\Queries\ApprovalRequestsQuery::class,
                'approvalFlows' => \App\GraphQL\Queries\ApprovalFlowsQuery::class,
                'approvalRequestsByApprover' => \App\GraphQL\Queries\ApprovalRequestsByApproverQuery::class,
                'userPermissions' => \App\GraphQL\Queries\UserPermissionsQuery::class,

                'test' => \App\GraphQL\Queries\TestQuery::class,
            ],
            'mutation' => [
                'createUser' => \App\GraphQL\Mutations\CreateUserMutation::class,
                'updateUser' => \App\GraphQL\Mutations\UpdateUserMutation::class,
                'deleteUser' => \App\GraphQL\Mutations\DeleteUserMutation::class,
                'approveRequest' => \App\GraphQL\Mutations\ApproveRequestMutation::class,
                'rejectRequest' => \App\GraphQL\Mutations\RejectRequestMutation::class,
                'returnRequest' => \App\GraphQL\Mutations\ReturnRequestMutation::class,
                'cancelRequest' => \App\GraphQL\Mutations\CancelRequestMutation::class,
                'createApprovalFlow' => \App\GraphQL\Mutations\CreateApprovalFlowMutation::class,
                'updateApprovalFlow' => \App\GraphQL\Mutations\UpdateApprovalFlowMutation::class,
                'deleteApprovalFlow' => \App\GraphQL\Mutations\DeleteApprovalFlowMutation::class,
                'getApprovalFlow' => \App\GraphQL\Mutations\GetApprovalFlowMutation::class,
                'createApprovalRequest' => \App\GraphQL\Mutations\CreateApprovalRequestMutation::class,
                'updateApprovalRequest' => \App\GraphQL\Mutations\UpdateApprovalRequestMutation::class,
                'deleteApprovalRequest' => \App\GraphQL\Mutations\DeleteApprovalRequestMutation::class,
                'getApprovalRequest' => \App\GraphQL\Mutations\GetApprovalRequestMutation::class,
                'createApprovalStep' => \App\GraphQL\Mutations\CreateApprovalStepMutation::class,

            ],
            // 'middleware' => [
            //     'auth:sanctum',
            // ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL types
    |--------------------------------------------------------------------------
    |
    | The types that are available for GraphQL.
    |
    */
    'types' => [
        'User' => \App\GraphQL\Types\UserType::class,
        'Role' => \App\GraphQL\Types\RoleType::class,
        'Department' => \App\GraphQL\Types\DepartmentType::class,
        'Permission' => \App\GraphQL\Types\PermissionType::class,
        'SystemLevel' => \App\GraphQL\Types\SystemLevelType::class,
        'ApprovalFlow' => \App\GraphQL\Types\ApprovalFlowType::class,
        'ApprovalStep' => \App\GraphQL\Types\ApprovalStepType::class,
        'ApprovalCondition' => \App\GraphQL\Types\ApprovalConditionType::class,
        'ApprovalRequest' => \App\GraphQL\Types\ApprovalRequestType::class,
        'ApprovalHistory' => \App\GraphQL\Types\ApprovalHistoryType::class,

    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL security
    |--------------------------------------------------------------------------
    |
    | Security settings for GraphQL.
    |
    */
    'security' => [
        'query_max_complexity' => 1000,
        'query_max_depth' => 15,
        'disable_introspection' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | GraphQL error handling
    |--------------------------------------------------------------------------
    |
    | Error handling settings for GraphQL.
    |
    */
    'error_handling' => [
        'debug' => env('APP_DEBUG', false),
        'log_errors' => true,
        'log_exceptions' => true,
    ],
];
