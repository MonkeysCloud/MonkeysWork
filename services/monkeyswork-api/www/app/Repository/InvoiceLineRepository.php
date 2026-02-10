<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\InvoiceLine;
use MonkeysLegion\Repository\EntityRepository;

class InvoiceLineRepository extends EntityRepository
{
    protected string $table = 'invoice_lines';
    protected string $entityClass = InvoiceLine::class;
}
