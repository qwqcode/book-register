<?php

namespace App;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Capsule\Manager;
use Monolog\Logger;
use Slim\App;
use Slim\Exception\NotFoundException;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Views\PhpRenderer;


class ApiBase {
    protected $app, $db, $logger, $renderer;
    
    public function __construct(App $app, Manager $db, PhpRenderer $renderer, Logger $logger)
    {
        $this->app = $app;
        $this->db = $db;
        $this->renderer = $renderer;
        $this->logger = $logger;
        
        $this->initRoute();
    }
    
    /**
     * 初始化 路由
     */
    private function initRoute()
    {
        foreach ($this->getRoutes() as $item) {
            switch (strtoupper($item[0])) {
                case 'GET':
                    $this->app->get($item[1], [
                        $this,
                        $item[2],
                    ]);
                    break;
                case 'POST':
                    $this->app->post($item[1], [
                        $this,
                        $item[2],
                    ]);
                    break;
            }
        }
    }
    
    /**
     * 获取 路由
     *
     * @return array
     */
    protected function getRoutes()
    {
        return [];
    }
    
    /**
     * 数据表 - 类目
     *
     * @param $orderBy
     * @return \Illuminate\Database\Query\Builder|\App\Models\Category
     */
    protected function tableCategory($orderBy = '`created_at` DESC')
    {
        return Category::query()->orderByRaw($orderBy);
    }
    
    /**
     * 数据表 - 类目中的图书
     *
     * @param $orderBy
     * @return \Illuminate\Database\Eloquent\Builder|\App\Models\Book
     */
    protected function tableBook($orderBy = '`created_at` DESC')
    {
        return Book::query()->orderByRaw($orderBy);
    }
    
    /**
     * 响应 - 正确结果
     *
     * @param Response $response
     * @param string $msg 正确信息
     * @param array $data 附带正确数据
     * @return Response
     */
    protected function success(Response $response, $msg, array $data = [])
    {
        return $response->withJson([
            'success' => true,
            'msg'     => $msg,
            'data'    => $data,
        ]);
    }
    
    /**
     * 响应 - 错误结果
     *
     * @param Response $response
     * @param string $msg 错误信息
     * @param array $data 附带错误数据
     * @return Response
     */
    protected function error(Response $response, $msg, array $data = [])
    {
        return $response->withJson([
            'success' => false,
            'msg'     => $msg,
            'data'    => $data,
        ]);
    }
}