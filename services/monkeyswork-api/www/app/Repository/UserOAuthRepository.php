<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\UserOAuth;
use MonkeysLegion\Repository\EntityRepository;

class UserOAuthRepository extends EntityRepository
{
    protected string $table = 'user_oauth';
    protected string $entityClass = UserOAuth::class;
}
