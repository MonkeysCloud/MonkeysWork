# ─── Builder stage ───
FROM php:8.4-fpm-alpine AS builder

RUN apk add --no-cache git unzip curl libzip-dev icu-dev oniguruma-dev postgresql-dev linux-headers \
    && docker-php-ext-install pdo_pgsql pgsql zip intl mbstring opcache pcntl sockets pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /build

# Install skeleton into www/ (--no-scripts to avoid migrate during build)
RUN composer create-project monkeyscloud/monkeyslegion-skeleton www --no-interaction --no-dev --no-scripts \
    && cd www \
    && php -r "file_exists('.env') || copy('.env.example', '.env');" \
    && composer dump-autoload --optimize

# ─── Production image ───
FROM php:8.4-fpm-alpine

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
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    mbstring \
    opcache \
    pcntl \
    sockets \
    pdo_mysql

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

# Set permissions
RUN chown -R appuser:www-data /app/www && chmod -R 755 /app/www

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
