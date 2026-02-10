<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Invoice;
use MonkeysLegion\Repository\EntityRepository;

class InvoiceRepository extends EntityRepository
{
    protected string $table = 'invoices';
    protected string $entityClass = Invoice::class;
}
