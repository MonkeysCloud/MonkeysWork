<?php

// Application bootstrap
// This will be replaced by the MonkeysLegion skeleton bootstrap

return new class {
    public function run(): void
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        
        if ($uri === '/healthz') {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'ok', 'service' => 'monkeyswork-api']);
            return;
        }

        header('Content-Type: application/json');
        echo json_encode([
            'service' => 'monkeyswork-api',
            'version' => '0.1.0',
            'status' => 'running'
        ]);
    }
};
