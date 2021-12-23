FROM php:7.2-fpm

# Arguments defined in docker-compose.yml
ARG user
ARG uid

# 换源
RUN echo \
    deb https://mirrors.cloud.tencent.com/debian/ buster main contrib non-free \
    deb https://mirrors.cloud.tencent.com/debian/ buster-updates main contrib non-free \
    deb https://mirrors.cloud.tencent.com/debian/ buster-backports main contrib non-free \
    deb https://mirrors.cloud.tencent.com/debian-security buster/updates main contrib non-free \
    > /etc/apt/sources.list \
    && rm -Rf /var/lib/apt/lists/* \
    && cat /etc/apt/sources.list

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user to run Composer and Artisan Commands
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

# Set working directory
WORKDIR /var/www

USER $user
