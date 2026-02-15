<?php
declare(strict_types=1);

// Direct PDO connection to bypass framework config issues
$host = '127.0.0.1';
$port = '5432';
$db   = 'monkeyswork';
$user = 'mw_app';
$pass = 'localdev';

echo "Connecting to postgresql://$user:****@$host:$port/$db ...\n";

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}


echo "Seeding categories...\n";

$categories = [
    [
        'name' => 'Development & IT',
        'slug' => 'development-it',
        'icon' => 'code',
        'description' => 'Software development, DevOps, and IT support',
    ],
    [
        'name' => 'Design & Creative',
        'slug' => 'design-creative',
        'icon' => 'palette',
        'description' => 'Graphic design, UI/UX, and creative arts',
    ],
    [
        'name' => 'Sales & Marketing',
        'slug' => 'sales-marketing',
        'icon' => 'trending-up',
        'description' => 'Digital marketing, sales, and content strategy',
    ],
    [
        'name' => 'Writing & Translation',
        'slug' => 'writing-translation',
        'icon' => 'pen-tool',
        'description' => 'Copywriting, translation, and editing',
    ],
    [
        'name' => 'Admin & Customer Support',
        'slug' => 'admin-customer-support',
        'icon' => 'headphones',
        'description' => 'Virtual assistance and customer service',
    ],
    [
        'name' => 'Finance & Accounting',
        'slug' => 'finance-accounting',
        'icon' => 'dollar-sign',
        'description' => 'Accounting, bookkeeping, and financial planning',
    ],
    [
        'name' => 'Engineering & Architecture',
        'slug' => 'engineering-architecture',
        'icon' => 'pen-tool',
        'description' => 'CAD, civil engineering, and architecture',
    ],
    [
        'name' => 'Legal',
        'slug' => 'legal',
        'icon' => 'briefcase',
        'description' => 'Legal consulting and contract review',
    ],
];



echo "Connected. Seeding 'category' table...\n";

// Drop the plural table I created by mistake
try {
    $pdo->exec('DROP TABLE IF EXISTS "categories"');
    echo "Dropped 'categories' (plural) table.\n";
} catch (PDOException $e) {
    // ignore
}

$stmt = $pdo->prepare('SELECT count(*) FROM "category" WHERE slug = :slug');
$insert = $pdo->prepare('INSERT INTO "category" (id, name, slug, icon, description, created_at) VALUES (:id, :name, :slug, :icon, :desc, NOW())');

foreach ($categories as $cat) {
    $stmt->execute(['slug' => $cat['slug']]);
    if ($stmt->fetchColumn() > 0) {
        echo "Skipping {$cat['name']} (already exists)\n";
        continue;
    }

    $id = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Ensure we handle potential missing columns or constraint violations
    // We assume 'category' has same schema as what we expected.
    // If it fails, we catch it.
    try {
        $insert->execute([
            'id' => $id,
            'name' => $cat['name'],
            'slug' => $cat['slug'],
            'icon' => $cat['icon'],
            'desc' => $cat['description'],
        ]);
        echo "Inserted {$cat['name']} ({$id})\n";
    } catch (PDOException $e) {
        echo "Failed to insert {$cat['name']}: " . $e->getMessage() . "\n";
    }
}

echo "Done.\n";
