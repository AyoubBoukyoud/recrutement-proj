FROM php:8.3-cli

# System deps: build headers for PHP extensions, a MySQL client, Tesseract OCR
# (TesseractOcrService shells out to the `tesseract` binary), Python/ffmpeg for
# the faster-whisper transcription script (scripts/transcribe.py), and Node
# to build this app's own Vite assets (resources/js, resources/css).
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl ca-certificates gnupg \
        libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libicu-dev \
        default-mysql-client \
        tesseract-ocr tesseract-ocr-eng tesseract-ocr-fra tesseract-ocr-ara tesseract-ocr-deu \
        python3 python3-pip ffmpeg \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring bcmath gd zip pcntl intl \
    && pip3 install --no-cache-dir --break-system-packages faster-whisper \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    && npm install \
    && npm run build \
    && chmod +x docker/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["bash", "docker/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
