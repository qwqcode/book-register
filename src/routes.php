<?php

use Slim\Http\Request;
use Slim\Http\Response;

// Globally
$app->add(function (Request $request, Response $response, $next) {
    /** @var Response $response */
    $response = $next($request, $response);
    return $response
        ->withHeader('Pragma', 'no-cache')
        ->withHeader('Cache-Control', 'no-store')
        ->withHeader('X-Powered-By', 'slim/slim')
        ->withHeader('X-Project-Name', 'zneiat/library-register-server')
        ->withHeader('X-Author-Github', 'https://github.com/Zneiat');
});

// Actions
new App\Actions($app,
    $app->getContainer()->get('db'),
    $app->getContainer()->get('renderer'),
    $app->getContainer()->get('logger')
);