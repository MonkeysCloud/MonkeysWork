FROM php:8.4-fpm-alpine AS builder

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    git \
    unzip \
    curl \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    postgresql-dev \
    linux-headers \
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

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY . .
RUN composer dump-autoload --optimize

# Production image
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    postgresql-dev \
    linux-headers \
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

# PHP production config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Create app user
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app /app
RUN chown -R appuser:appgroup /app/var 2>/dev/null || true
RUN chown -R appuser:appgroup /app/storage 2>/dev/null || true

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
