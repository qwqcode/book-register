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

/**
 * #(滑稽) 操作
 */
class API
{
    private $app, $db, $logger, $renderer;
    
    public function __construct(App $app, Manager $db, PhpRenderer $renderer, Logger $logger)
    {
        $this->app = $app;
        $this->db = $db;
        $this->renderer = $renderer;
        $this->logger = $logger;
        
        $this->initRoute();
    }
    
    /**
     * 初始化
     */
    public function initRoute()
    {
        $routes = [
            ['GET', '/', 'index'],
            ['GET', '/getTime', 'getTime'],
            ['GET', '/getCategory', 'getCategory'],
            ['POST', '/uploadCategory', 'uploadCategory'],
            ['GET', '/createCategory', 'createCategory'],
            ['GET', '/downloadExcel', 'downloadExcel'],
        ];
        
        foreach ($routes as $item) {
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
     * 主页
     *
     * @inheritdoc
     */
    public function index(Request $request, Response $response, array $args)
    {
        // Sample log message
        // $this->logger->info("Slim-Skeleton '/' route");
        
        // Render index view
        return $this->renderer->render($response, 'index.phtml', $args);
    }
    
    /**
     * 当前时间获取
     *
     * @inheritdoc
     */
    public function getTime(Request $request, Response $response, $args)
    {
        return $this->success($response, '获取服务器时间成功', [
            'success'     => true,
            'time'        => time(),
            'time_format' => date('Y-m-d H:i:s', time()),
        ]);
    }
    
    /**
     * 获取分类
     *
     * @inheritdoc
     */
    public function getCategory(Request $request, Response $response, $args)
    {
        $name = trim($request->getParam('name'));
        $withBooks = trim($request->getParam('withBooks'));
    
        $categoriesTable = $this->tableCategory();
        
        if (!empty($name)) {
            $categories = $categoriesTable->where(['name' => $name]);
            if (!$categories->exists())
                return $this->error($response, '该类目不存在');
            $categories = $categories->get();
        }
        else {
            $categories = $categoriesTable->get();
        }
        
        $apiData = [];
        foreach ($categories as $index => $item) {
            /** @var $item Category */
            
            $apiData[$index] = [
                'name'              => $item->name,
                'user'              => $item->user,
                'remarks'           => $item->remarks,
                'books_count'       => $item->books->count(),
                'updated_at'        => $item->updated_at->timestamp,
                'created_at'        => $item->created_at->timestamp,
                'updated_at_format' => $item->updated_at->toDateTimeString(),
                'created_at_format' => $item->updated_at->toDateTimeString(),
            ];
            
            if (!empty($withBooks) || !empty($name)) {
                $apiData[$index]['books'] = $this->handleBooksForGetting($item->books->toArray());
            }
        }
        
        return $this->success($response, '类目数据获取成功', [
            'categories_total' => $categories->count(),
            'categories'       => $apiData,
        ]);
    }
    
    /**
     * 上传类目数据
     *
     * @inheritdoc
     */
    public function uploadCategory(Request $request, Response $response, $args)
    {
        $user = trim($request->getParam('user'));
        $books = trim($request->getParam('books'));
        $time = time();
    
        if (empty($user))
            return $this->error($response, '参数 user 是必须的');
        if (empty($books))
            return $this->error($response, '参数 books 是必须的');
    
        $books = @json_decode($books, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            return $this->error($response, '图书 JSON 解析失败 ' . json_last_error_msg());
    
        // 导入单个类目图书数据
        $importCategoryBooks = function ($categoryName, array $books) use ($user, $time) {
            foreach ($books as $item) {
                if (empty($item['numbering']) || (empty($item['name']) && empty($item['press']) && empty($item['remarks'])))
                    continue;
    
                $this->tableBook()->updateOrInsert([
                    'category_name' => $categoryName,
                    'numbering'     => $item['numbering'],
                ], [
                    'name'       => $item['name'],
                    'press'      => $item['press'],
                    'remarks'    => $item['remarks'],
                    'user'       => $user,
                    'created_at' => $time,
                    'updated_at' => $time,
                ]);
            }
            return true;
        };
    
        // 导入多类图书
        foreach ($books as $categoryName => $arr) {
            try {
                $category = $this->tableCategory()->where([
                    'name' => $categoryName,
                ]);
    
                if (!$category->exists())
                    throw new \Exception('类目' . $categoryName . ' 未找到');
                
                $importCategoryBooks($categoryName, $arr);
        
                $category->updateTimestamps();
            } catch (\Exception $exception) {
                $this->logger->error($exception->getMessage(), $request->getParams());
                continue;
            }
        }
    
        return $this->success($response, '图书数据已保存');
    }
    
    /**
     * 创建类目
     *
     * @inheritdoc
     */
    public function categoryCreate(Request $request, Response $response, $args)
    {
        $user = trim($request->getParam('user'));
        $name = trim($request->getParam('name'));
        $time = time();
        
        if (empty($user))
            return $this->error($response, '参数 user 是必须的');
        if (empty($name))
            return $this->error($response, '参数 name 是必须的');
        
        // 尝试获取类目
        $category = $this->tableCategory()->where([
            'name' => $name,
        ]);
        
        if (!$category->exists()) {
            // 若类目不存在 则创建一个
            $insert = $this->tableCategory()->insert([
                'name'       => $name,
                'user'       => $user,
                'created_at' => $time,
                'updated_at' => $time,
            ]);
            
            if ($insert)
                return $this->success($response, '类目创建成功');
        }
        else {
            return $this->error($response, '同名类目已存在，无需再次创建');
        }
        
        return $this->success($response, '类目创建失败');
    }
    
    /**
     * 上传多个分类的图书数据
     *
     * @inheritdoc
     */
    public function uploadCategoryBooks(Request $request, Response $response, $args)
    {
        $registrarName = trim($request->getParam('registrarName'));
        $booksInCategoriesJson = trim($request->getParam('booksInCategoriesJson'));
        $currentTime = time();
        
        if (empty($registrarName))
            return $this->error($response, 'Who Are U ?');
        
        if (empty($booksInCategoriesJson))
            return $this->error($response, '图书数据不能没有哇 ~');
        
        // 准备 booksInCategories
        $booksInCategoriesArr = @json_decode($booksInCategoriesJson, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            return $this->error($response, '类目图书 JSON 解析失败 ' . json_last_error_msg());
        
        $bookTotal = 0; // 导入的图书总数
        
        foreach ($booksInCategoriesArr as $categoryName => $categoryBooks) {
            // 准备类目数据
            $category = $this->tableCategory()->where([
                'name' => $categoryName,
            ]);
            
            // 若类目不存在 则创建一个
            if (!$category->exists()) {
                $this->tableCategory()->insert([
                    'name'           => $categoryName,
                    'registrar_name' => $registrarName,
                    'update_at'      => 0,
                    'created_at'     => $currentTime,
                ]);
                
                $category = $this->tableCategory()->where([
                    'name' => $categoryName,
                ]);
            }
            
            /** @var $categoryBooks mixed 单个类目中的图书数据 */
            if (empty($categoryBooks) || !is_array($categoryBooks))
                $categoryBooks = [];
            
            // $categoryBooks = $this->handleBooksOld($categoryBooks); // 上传的数据不管它
            $categoryBooksJson = json_encode($categoryBooks, JSON_UNESCAPED_UNICODE);
            
            // 图书数据插入数据库
            $this->tableBookOld()->insert([
                'category_name'      => $categoryName,
                'category_book_data' => $categoryBooksJson,
                'registrar_name'     => $registrarName,
                'created_at'         => $currentTime,
            ]);
            
            // 类目 update_at 更新，与 tableBook 中单个项目的 created_at 一致
            $category->update([
                'update_at' => $currentTime,
            ]);
            
            $bookTotal += count($categoryBooks);
        }
        
        return $this->success($response, '本次共上传了 ' . count($booksInCategoriesArr) . ' 个类目的 ' . $bookTotal . ' 本图书数据', [
            'update_at'        => $currentTime,
            'update_at_format' => date('Y-m-d H:i:s', $currentTime),
        ]);
    }
    
    /**
     * 数据表格文件下载
     *
     * @inheritdoc
     */
    public function downloadExcel(Request $request, Response $response, $args)
    {
        $categoryName = trim($request->getParam('categoryName'));
        
        if (empty($categoryName))
            throw new NotFoundException($request, $response);
        
        // 准备数据
        $categories = $this->tableCategory('`name` ASC');
        $datetime = date('YmdHis', time());
        
        if ($categoryName !== '__ALL') {
            $categories = $categories->where(['name' => $categoryName]);
            $fileName = '类目' . $categoryName . '的图书数据_' . $datetime;
        }
        else {
            $fileName = '所有类目的图书数据_' . $datetime;
        }
        
        if (!$categories->exists())
            throw new NotFoundException($request, $response);
        
        $categories = $categories->get();
        $data = [];
        $data[1] = []; // 表头占位
        
        $buildSingleCategoryData = function ($categoryData) {
            $categoryName = $categoryData->name;
            $categoryUpdateAt = intval($categoryData->update_at);
            $registrarName = $categoryData->registrar_name ?? '';
            
            if (empty($categoryName) || empty($categoryUpdateAt))
                return null;
            
            $book = $this->tableBookOld()->where([
                'category_name' => $categoryData->name,
                'created_at'    => intval($categoryData->update_at),
            ]);
            
            if (!$book->exists())
                return null;
            $book = $book->get()->first();
            $booksJson = $book->category_book_data;
            
            if (empty($booksJson))
                return null;
            $booksArr = @json_decode($booksJson, true);
            if (json_last_error() !== JSON_ERROR_NONE)
                return null;
            
            $booksArr = $this->handleBooksOld($booksArr);
            if (empty($booksArr))
                return null;
            
            $data = [];
            foreach ($booksArr as $bookItem) {
                $numbering = $bookItem['numbering'];
                $numberingFull = $categoryName . ' ' . $numbering;
                $data[] = [
                    $categoryName,
                    $numbering,
                    $numberingFull,
                    $bookItem['name'],
                    $bookItem['press'],
                    $bookItem['remarks'],
                    $registrarName,
                ];
            }
            
            return $data;
        };
        
        foreach ($categories as $categoryItem) {
            $itemData = $buildSingleCategoryData($categoryItem);
            if (!empty($itemData)) {
                foreach ($itemData as $item) {
                    $data[] = $item;
                }
            }
        }
        
        $objPHPExcel = new \PHPExcel();
        $objPHPExcel->setActiveSheetIndex(0);
        
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        $data[1] = ['类目', '序号', '索引号', '书名', '出版社', '备注', '登记员'];
        $width = [8, 8, 10, 25, 30, 20, 10];
        foreach ($data as $rowNum => $item) {
            foreach ($cols as $index => $colName) {
                $objPHPExcel->getActiveSheet()->setCellValue($colName . $rowNum, $item[$index]);
            }
        }
        
        // 设置宽度
        foreach ($cols as $index => $colName) {
            $objPHPExcel->getActiveSheet()->getColumnDimension($colName)->setWidth($width[$index]);
        }
        
        header('Content-Type: application/vnd.ms-excel;charset=UTF-8');
        header('Content-Disposition: attachment;filename="' . $fileName . '.xls"');
        header('Cache-Control: max-age=0');
        $objWriter = \PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
        $objWriter->save('php://output');
    }
    
    /**
     * 处理图书数据 for Getting API
     *
     * @param array $booksArr 原图书数据
     * @return array 处理后的图书数据
     */
    private function handleBooksForGetting(array $booksArr)
    {
        if (empty($booksArr) || count($booksArr) < 1)
            return [];
        
        $data = [];
        
        $numbering = function () use ($booksArr) {
            // 获取最大的 numbering
            $maxNumbering = 1;
            foreach ($booksArr as $item) {
                $numbering = intval($item['numbering'] ?? 0);
                if ($numbering > $maxNumbering && (!empty($item['name']) || !empty($item['press'] || !empty($item['remarks']))))
                    $maxNumbering = $numbering;
            }
            
            return $maxNumbering;
        };
        $numbering = $numbering();
        
        do {
            $index = $numbering - 1;
            
            $data[$index] = [
                'numbering' => strval($numbering),
                'name'      => '',
                'press'     => '',
                'remarks'   => '',
            ];
            
            // 搜寻是否有当前 numbering 的图书数据
            foreach ($booksArr as $bookItem) {
                if ($bookItem['numbering'] == $numbering) {
                    $data[$index] = [
                        'numbering' => strval($numbering),
                        'name'      => $bookItem['name'],
                        'press'     => $bookItem['press'],
                        'remarks'   => $bookItem['remarks'],
                    ];
                    break;
                }
            }
            
            $numbering--;
            
        } while ($numbering > 0);
        
        // 数组顺序翻转
        $data = array_reverse($data);
        
        return $data;
    }
    
    /**
     * 数据表 - 类目
     *
     * @param $orderBy
     * @return \Illuminate\Database\Query\Builder|\App\Models\Category
     */
    private function tableCategory($orderBy = '`created_at` DESC')
    {
        return Category::query()->orderByRaw($orderBy);
    }
    
    /**
     * 数据表 - 类目中的图书
     *
     * @param $orderBy
     * @return \Illuminate\Database\Eloquent\Builder|\App\Models\Book
     */
    private function tableBook($orderBy = '`created_at` DESC')
    {
        return Book::query()->orderByRaw($orderBy);
    }
    
    /**
     * 数据表 旧 - 类目中的图书
     *
     * @param $orderBy
     * @return \Illuminate\Database\Query\Builder
     */
    private function tableBookOld($orderBy = '`created_at` DESC')
    {
        return $this->db->table('book')->orderByRaw($orderBy);
    }
    
    /**
     * 响应 - 正确结果
     *
     * @param Response $response
     * @param string $msg 正确信息
     * @param array $data 附带正确数据
     * @return Response
     */
    private function success(Response $response, $msg, array $data = [])
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
    private function error(Response $response, $msg, array $data = [])
    {
        return $response->withJson([
            'success' => false,
            'msg'     => $msg,
            'data'    => $data,
        ]);
    }
}