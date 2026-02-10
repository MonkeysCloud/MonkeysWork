<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Message;
use MonkeysLegion\Repository\EntityRepository;

class MessageRepository extends EntityRepository
{
    protected string $table = 'messages';
    protected string $entityClass = Message::class;
}
