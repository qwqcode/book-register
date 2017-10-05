<?php
// DIC configuration

use Psr\Container\ContainerInterface;

$container = $app->getContainer();

// view renderer
$container['renderer'] = function (ContainerInterface $c) {
    $settings = $c->get('settings')['renderer'];
    return new Slim\Views\PhpRenderer($settings['template_path']);
};

// monolog
$container['logger'] = function (ContainerInterface $c) {
    $settings = $c->get('settings')['logger'];
    $logger = new Monolog\Logger($settings['name']);
    $logger->pushProcessor(new Monolog\Processor\UidProcessor());
    $logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
    return $logger;
};

// database
$container['db'] = function (ContainerInterface $c) {
    $settings = $c->get('settings')['db'];
    
    $capsule = new \Illuminate\Database\Capsule\Manager;
    $capsule->addConnection($settings);
    
    $capsule->setAsGlobal();
    $capsule->bootEloquent();
    
    return $capsule;
};