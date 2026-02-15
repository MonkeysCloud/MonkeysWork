<?php
use MonkeysLegion\Framework\HttpBootstrap;
use MonkeysLegion\Router\Router;
use MonkeysLegion\Core\Routing\RouteLoader;

require 'vendor/autoload.php';

define('ML_BASE_PATH', __DIR__);

// Bootstrap container
$container = HttpBootstrap::buildContainer(ML_BASE_PATH);

// Get Router and RouteLoader
$router = $container->get(Router::class);
$loader = $container->get(RouteLoader::class);

echo "Loading controllers...\n";
$loader->loadControllers();

echo "Checking routes...\n";
$routes = $router->getRoutes()->all();

$found = false;
foreach ($routes as $route) {
    if (strpos($route['path'], 'categories') !== false) {
        echo "Found route: [{$route['method']}] {$route['path']} -> " . json_encode($route['handler']) . "\n";
        $found = true;
    }
}

if (!$found) {
    echo "No routes found containing 'categories'\n";
}

// Dump all routes to see if we see anything
echo "\nTotal routes: " . count($routes) . "\n";
