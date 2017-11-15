<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

/** @var $router Laravel\Lumen\Routing\Router */
/*$router->get('/', function () use ($router) {
    return $router->app->version();
});*/

$router->get('/', 'ApiController@index');
$router->get('/getTime', 'ApiController@getTime');
$router->get('/getUser', 'ApiController@getUser');
$router->get('/getRanking', 'ApiController@getRanking');
$router->get('/getCategory', 'ApiController@getCategory');
$router->post('/uploadCategory', 'ApiController@uploadCategory');
$router->get('/categoryCreate', 'ApiController@categoryCreate');
$router->get('/categoryExcel', 'ApiController@categoryExcel');