# ─── Base stage (Compile extensions once) ───
FROM php:8.4-fpm-alpine AS base

RUN apk add --no-cache \
    nginx \
    supervisor \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    postgresql-dev \
    linux-headers \
    git \
    unzip \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    mbstring \
    opcache \
    pcntl \
    sockets \
    pdo_mysql

# ─── Builder stage ───
FROM base AS builder

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /build

# Install skeleton into www/ (--no-scripts to avoid migrate during build)
RUN composer create-project monkeyscloud/monkeyslegion-skeleton www --no-interaction --no-dev --no-scripts \
    && cd www \
    && php -r "file_exists('.env') || copy('.env.example', '.env');" \
    && composer dump-autoload --optimize

# ─── Production image ───
FROM base

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP production config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Nginx + Supervisor + OPcache config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Create app directory
RUN adduser -D -G www-data appuser && \
    mkdir -p /app/www /run/nginx /var/log/nginx

WORKDIR /app

# Copy skeleton from builder
COPY --from=builder /build/www /app/www

# Copy local overrides (if any exist during build)
COPY . /app/

# Set permissions — www-data (PHP-FPM group) needs write access to var/
RUN chown -R appuser:www-data /app/www \
    && chmod -R 755 /app/www \
    && mkdir -p /app/www/var/logs /app/www/var/cache/mlc /app/www/var/cache/rate_limit /app/www/var/cache/views \
    && chmod -R 775 /app/www/var

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
