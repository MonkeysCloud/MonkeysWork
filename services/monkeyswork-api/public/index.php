<?php

// MonkeysWork API Entry Point
require_once __DIR__ . '/../vendor/autoload.php';

// Bootstrap the application
$app = require_once __DIR__ . '/../src/bootstrap.php';

$app->run();
