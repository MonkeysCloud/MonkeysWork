<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Conversation;
use MonkeysLegion\Repository\EntityRepository;

class ConversationRepository extends EntityRepository
{
    protected string $table = 'conversations';
    protected string $entityClass = Conversation::class;
}
