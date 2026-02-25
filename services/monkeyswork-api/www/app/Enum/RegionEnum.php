<?php
declare(strict_types=1);

namespace App\Enum;

final class RegionEnum
{
    public const COUNTRY_TO_REGION = [
        // North America
        'US' => 'north_america',
        'CA' => 'north_america',
        'MX' => 'north_america',
        // Europe
        'GB' => 'europe',
        'DE' => 'europe',
        'FR' => 'europe',
        'ES' => 'europe',
        'IT' => 'europe',
        'NL' => 'europe',
        'SE' => 'europe',
        'PL' => 'europe',
        'PT' => 'europe',
        'IE' => 'europe',
        'CH' => 'europe',
        'NO' => 'europe',
        'DK' => 'europe',
        'FI' => 'europe',
        'AT' => 'europe',
        'BE' => 'europe',
        'CZ' => 'europe',
        'RO' => 'europe',
        'HU' => 'europe',
        'GR' => 'europe',
        // Latin America
        'BR' => 'latin_america',
        'AR' => 'latin_america',
        'CL' => 'latin_america',
        'CO' => 'latin_america',
        'PE' => 'latin_america',
        'UY' => 'latin_america',
        'EC' => 'latin_america',
        'VE' => 'latin_america',
        'CR' => 'latin_america',
        'PA' => 'latin_america',
        // Asia Pacific
        'AU' => 'asia_pacific',
        'NZ' => 'asia_pacific',
        'JP' => 'asia_pacific',
        'KR' => 'asia_pacific',
        'SG' => 'asia_pacific',
        'IN' => 'asia_pacific',
        'PH' => 'asia_pacific',
        'TH' => 'asia_pacific',
        'MY' => 'asia_pacific',
        'ID' => 'asia_pacific',
        'VN' => 'asia_pacific',
        'TW' => 'asia_pacific',
        'HK' => 'asia_pacific',
        // Middle East & Africa
        'AE' => 'middle_east_africa',
        'SA' => 'middle_east_africa',
        'IL' => 'middle_east_africa',
        'ZA' => 'middle_east_africa',
        'NG' => 'middle_east_africa',
        'KE' => 'middle_east_africa',
        'EG' => 'middle_east_africa',
        'QA' => 'middle_east_africa',
        'KW' => 'middle_east_africa',
        'BH' => 'middle_east_africa',
    ];
}
