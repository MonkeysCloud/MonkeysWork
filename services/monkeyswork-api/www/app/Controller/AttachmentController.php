<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/attachments')]
final class AttachmentController
{
    use ApiController;

    private const ALLOWED_MIME  = [
        // Images
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        // Documents
        'application/pdf',
        'application/msword',                                                          // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      // .docx
        'application/vnd.ms-excel',                                                    // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',            // .xlsx
        'application/vnd.oasis.opendocument.text',                                     // .odt
        'application/rtf',                                                             // .rtf
        'text/plain',                                                                  // .txt
        'text/csv',                                                                    // .csv
    ];
    private const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    private const UPLOAD_DIR    = '/app/www/public/files/attachments';

    public function __construct(private ConnectionInterface $db) {}

    /* ------------------------------------------------------------------ */
    /*  POST /attachments/upload  (multipart/form-data)                    */
    /* ------------------------------------------------------------------ */
    #[Route('POST', '/upload', name: 'attachments.upload', summary: 'Upload files', tags: ['Attachments'])]
    public function upload(ServerRequestInterface $request): JsonResponse
    {
      try {
        error_log('[ATTACH] upload() entered');
        $userId = $this->userId($request);
        error_log('[ATTACH] userId=' . ($userId ?? 'NULL'));
        if (!$userId) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        $params = $request->getParsedBody() ?? [];
        $entityType = $params['entity_type'] ?? null;
        $entityId   = $params['entity_id']   ?? null;

        if (!$entityType || !$entityId) {
            error_log('[ATTACH] missing entity_type or entity_id');
            return $this->error('entity_type and entity_id are required');
        }

        $uploadedFiles = $request->getUploadedFiles();
        $raw = $uploadedFiles['files'] ?? [];

        // The framework returns raw $_FILES structure for files[]:
        // $raw = ['name' => [...], 'type' => [...], 'tmp_name' => [...], 'error' => [...], 'size' => [...]]
        // Normalize to a list of file info arrays
        $files = [];
        if (is_array($raw) && isset($raw['name'])) {
            // Raw $_FILES format — multiple files via files[]
            $names = is_array($raw['name']) ? $raw['name'] : [$raw['name']];
            for ($i = 0; $i < count($names); $i++) {
                $files[] = [
                    'name'     => is_array($raw['name']) ? $raw['name'][$i] : $raw['name'],
                    'type'     => is_array($raw['type']) ? $raw['type'][$i] : $raw['type'],
                    'tmp_name' => is_array($raw['tmp_name']) ? $raw['tmp_name'][$i] : $raw['tmp_name'],
                    'error'    => is_array($raw['error']) ? $raw['error'][$i] : $raw['error'],
                    'size'     => is_array($raw['size']) ? $raw['size'][$i] : $raw['size'],
                ];
            }
        } elseif (is_array($raw)) {
            // Possibly already normalized array of UploadedFileInterface objects
            foreach ($raw as $item) {
                if (is_object($item)) {
                    $files[] = [
                        'name'     => $item->getClientFilename(),
                        'type'     => $item->getClientMediaType(),
                        'tmp_name' => $item->getStream()->getMetadata('uri'),
                        'error'    => $item->getError(),
                        'size'     => $item->getSize(),
                        '_psr7'    => $item,
                    ];
                }
            }
        }

        if (empty($files)) {
            return $this->error('No files uploaded');
        }

        // Prepare storage directory
        $dir = self::UPLOAD_DIR . "/{$entityType}/{$entityId}";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $saved = [];
        $stmt  = $this->db->pdo()->prepare(
            'INSERT INTO "attachment" (id, entity_type, entity_id, uploaded_by,
                                       file_name, file_path, file_url, file_size,
                                       mime_type, sort_order)
             VALUES (:id, :etype, :eid, :uid, :fname, :fpath, :furl, :fsize, :mime, :sort)'
        );

        $sortOrder = 0;

        foreach ($files as $idx => $f) {
            if ((int)($f['error'] ?? 1) !== UPLOAD_ERR_OK) {
                continue;
            }

            $mime = $f['type'] ?? '';
            $size = (int)($f['size'] ?? 0);
            $originalName = $f['name'] ?? 'unknown';
            $tmpName = $f['tmp_name'] ?? '';

            // Validate MIME
            if (!in_array($mime, self::ALLOWED_MIME, true)) {
                continue;
            }

            // Validate size
            if ($size > self::MAX_FILE_SIZE) {
                continue;
            }

            // Generate safe filename
            $ext = pathinfo($originalName, PATHINFO_EXTENSION);
            $safeName = bin2hex(random_bytes(16)) . ($ext ? ".{$ext}" : '');
            $filePath = "{$dir}/{$safeName}";
            $fileUrl  = "/files/attachments/{$entityType}/{$entityId}/{$safeName}";

            // Move file
            if (isset($f['_psr7'])) {
                $f['_psr7']->moveTo($filePath);
            } else {
                move_uploaded_file($tmpName, $filePath);
            }

            // Insert DB record
            $bytes = random_bytes(16);
            $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
            $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant RFC 4122
            $id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
            $stmt->execute([
                'id'    => $id,
                'etype' => $entityType,
                'eid'   => $entityId,
                'uid'   => $userId,
                'fname' => $originalName,
                'fpath' => $filePath,
                'furl'  => $fileUrl,
                'fsize' => $size,
                'mime'  => $mime,
                'sort'  => $sortOrder++,
            ]);

            $saved[] = [
                'id'        => $id,
                'file_name' => $originalName,
                'file_url'  => $fileUrl,
                'file_size' => $size,
                'mime_type' => $mime,
            ];
        }

        if (empty($saved)) {
            return $this->error('No valid files were uploaded');
        }

        return $this->created(['data' => $saved]);
      } catch (\Throwable $e) {
          return $this->json([
              'error'   => $e->getMessage(),
              'file'    => $e->getFile(),
              'line'    => $e->getLine(),
              'trace'   => array_slice(explode("\n", $e->getTraceAsString()), 0, 5),
          ], 500);
      }
    }

    /* ------------------------------------------------------------------ */
    /*  GET /attachments/{entity_type}/{entity_id}                         */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/{entity_type}/{entity_id}', name: 'attachments.list', summary: 'List attachments', tags: ['Attachments'])]
    public function list(ServerRequestInterface $request, string $entity_type, string $entity_id): JsonResponse
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, file_name, file_url, file_size, mime_type, sort_order, created_at
             FROM "attachment"
             WHERE entity_type = :etype AND entity_id = :eid
             ORDER BY sort_order ASC, created_at ASC'
        );
        $stmt->execute(['etype' => $entity_type, 'eid' => $entity_id]);

        return $this->json(['data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    /* ------------------------------------------------------------------ */
    /*  DELETE /attachments/{id}                                            */
    /* ------------------------------------------------------------------ */
    #[Route('DELETE', '/{id}', name: 'attachments.delete', summary: 'Delete attachment', tags: ['Attachments'])]
    public function delete(ServerRequestInterface $request, string $id): JsonResponse
    {
        $userId = $this->userId($request);
        if (!$userId) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        // Fetch the record
        $stmt = $this->db->pdo()->prepare(
            'SELECT id, file_path, uploaded_by FROM "attachment" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) {
            return $this->error('Attachment not found', 404);
        }

        // Only the uploader can delete
        if ($row['uploaded_by'] !== $userId) {
            return $this->error('Forbidden', 403);
        }

        // Delete file from disk
        if (file_exists($row['file_path'])) {
            unlink($row['file_path']);
        }

        // Delete DB record
        $this->db->pdo()->prepare('DELETE FROM "attachment" WHERE id = :id')->execute(['id' => $id]);

        return $this->noContent();
    }

    /* ------------------------------------------------------------------ */
    /*  GET /attachments/download/{id}                                      */
    /* ------------------------------------------------------------------ */
    #[Route('GET', '/download/{id}', name: 'attachments.download', summary: 'Download attachment', tags: ['Attachments'])]
    public function download(ServerRequestInterface $request, string $id): \Psr\Http\Message\ResponseInterface
    {
        $stmt = $this->db->pdo()->prepare(
            'SELECT file_name, file_path, mime_type FROM "attachment" WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row || !file_exists($row['file_path'])) {
            return $this->json(['error' => 'File not found'], 404);
        }

        $fileName = $row['file_name'];
        $mimeType = $row['mime_type'] ?: 'application/octet-stream';

        // Create a stream from the file
        $stream = new \MonkeysLegion\Http\Message\Stream(fopen($row['file_path'], 'rb'));

        return new \MonkeysLegion\Http\Message\Response(
            $stream,
            200,
            [
                'Content-Type'        => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . addslashes($fileName) . '"',
                'Content-Length'      => (string) filesize($row['file_path']),
                'Access-Control-Allow-Origin' => '*',
            ]
        );
    }
}
