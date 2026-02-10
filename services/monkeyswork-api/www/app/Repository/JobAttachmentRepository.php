<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\JobAttachment;
use MonkeysLegion\Repository\EntityRepository;

class JobAttachmentRepository extends EntityRepository
{
    protected string $table = 'job_attachments';
    protected string $entityClass = JobAttachment::class;
}
