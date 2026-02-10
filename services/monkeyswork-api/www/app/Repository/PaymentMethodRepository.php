<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\PaymentMethod;
use MonkeysLegion\Repository\EntityRepository;

class PaymentMethodRepository extends EntityRepository
{
    protected string $table = 'payment_methods';
    protected string $entityClass = PaymentMethod::class;
}
