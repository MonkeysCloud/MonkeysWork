<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\DisputeMessage;
use MonkeysLegion\Repository\EntityRepository;

class DisputeMessageRepository extends EntityRepository
{
    protected string $table = 'dispute_messages';
    protected string $entityClass = DisputeMessage::class;
}
