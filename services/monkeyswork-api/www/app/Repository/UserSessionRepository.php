<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\UserSession;
use MonkeysLegion\Repository\EntityRepository;

class UserSessionRepository extends EntityRepository
{
    protected string $table = 'user_sessions';
    protected string $entityClass = UserSession::class;
}
