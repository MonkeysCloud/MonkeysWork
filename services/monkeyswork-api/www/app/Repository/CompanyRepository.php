<?php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Company;
use MonkeysLegion\Repository\EntityRepository;

class CompanyRepository extends EntityRepository
{
    protected string $table = 'company';
    protected string $entityClass = Company::class;
}
