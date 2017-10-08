<?php
namespace App;

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
class Actions
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
    public function initRoute() {
        $this->app->get('/', [$this, 'index']);
        $this->app->get('/getTime', [$this, 'getTime']);
        $this->app->get('/getCategories', [$this, 'getCategories']);
        $this->app->get('/getCategoryBooks', [$this, 'getCategoryBooks']);
        $this->app->post('/uploadCategoryBooks', [$this, 'uploadCategoryBooks']);
        $this->app->get('/downloadExcel', [$this, 'downloadExcel']);
    }
    
    /**
     * 主页
     *
     * @inheritdoc
     */
    public function index(Request $request, Response $response, array $args) {
        // Sample log message
        $this->logger->info("Slim-Skeleton '/' route");
    
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
        return $this->resultTrue($response, '获取服务器时间成功', [
            'success' => true,
            'time' => time(),
            'time_format' => date('Y-m-d H:i:s', time())
        ]);
    }
    
    /**
     * 获取所有分类
     *
     * @inheritdoc
     */
    public function getCategories(Request $request, Response $response, $args)
    {
        $categoriesTable = $this->tableCategory();
        $withBooks = $request->getParam('withBooks');
        
        $data = [];
        
        foreach ($categoriesTable->get() as $num => $item) {
            $data[$num] = [];
            foreach ($item as $key => $value)
                $data[$num][$key] = $value;
            
            // 附加
            $data[$num]['update_at_format'] = date('Y-m-d H:i:s', $item->update_at);
            $data[$num]['created_at_format'] = date('Y-m-d H:i:s', $item->created_at);
            
            // 参数：With Books
            if (!!$withBooks) {
                // 查询 Book Table
                $data[$num]['books'] = (function ($item) {
                    if (empty($item->update_at))
                        return [];
    
                    $book = $this->tableBook()->where(['category_name' => $item->name, 'created_at' => $item->update_at]);
                    if (!$book->exists())
                        return [];
                    $book = $book->get()->first();
    
                    // 处理 Books
                    $booksJson = $book->category_book_data;
                    $booksArr = @json_decode($booksJson, true);
                    if (json_last_error() !== JSON_ERROR_NONE)
                        return [];
    
                    $booksData = $this->handleBooks($booksArr);
                    return $booksData;
                })($item);
            }
        }
        
        return $this->resultTrue($response, '类目数据获取成功', [
            'categories_total' => count($data),
            'categories' => $data
        ]);
    }
    
    /**
     * 获取单个分类所有图书
     *
     * @inheritdoc
     */
    public function getCategoryBooks(Request $request, Response $response, $args)
    {
        $categoryName = trim($request->getParam('categoryName'));
        
        if (empty($categoryName))
            return $this->resultFalse($response, '参数 categoryName 是必须的');
        
        // 查询 Category Table
        $category = $this->tableCategory()->where(['name' => $categoryName]);
        if (!$category->exists())
            return $this->resultFalse($response, '该类目不存在');
        $category = $category->get()->first();
        
        // 查询 Book Table
        $dataCatedAt = intval($category->update_at);
        if (empty($dataCatedAt))
            return $this->resultFalse($response, '该类目暂无图书数据');
        
        $book = $this->tableBook()->where(['category_name' => $categoryName, 'created_at' => $dataCatedAt]);
        if (!$book->exists())
            return $this->resultFalse($response, '该类目在 ' . date('Y-m-d H:i:s', $dataCatedAt) . ' 保存的图书数据未找到');
        $book = $book->get()->first();
        
        // 处理 Books
        $booksJson = $book->category_book_data;
        $booksArr = @json_decode($booksJson, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            return $this->resultFalse($response, '该类目图书数据解析错误 ' . json_last_error_msg());
        
        $responseData = $this->handleBooks($booksArr);
        
        return $this->resultTrue($response, '类目' . $categoryName . ' 图书数据获取成功', [
            'category' => $category,
            'category_update_at' => $dataCatedAt,
            'category_update_at_format' => date('Y-m-d H:i:s', $dataCatedAt),
            'books_total' => count($responseData),
            'books' => $responseData
        ]);
    }
    
    /**
     * 处理图书数据 for Android APP
     *
     * @param array $booksArr 原图书数据
     * @return array 处理后的图书数据
     */
    private function handleBooks(array $booksArr)
    {
        if (empty($booksArr) || !is_array($booksArr) || count($booksArr) < 1)
            return [];
        
        $handleData = [];
        $numbering = function () use ($booksArr) {
            // 获取最大的 numbering
            $maxNumbering = 0;
            foreach ($booksArr as $item) {
                $numbering = intval($item['numbering'] ?? 0);
                if ($numbering > $maxNumbering)
                    $maxNumbering = $numbering;
            }
            return $maxNumbering;
        };
        $numbering = $numbering();
        do {
            $index = $numbering - 1;
            
            $handleData[$index] = [
                'numbering' => strval($numbering),
                'name' => '',
                'press' => '',
                'remarks' => ''
            ];
            
            // 搜寻是否有当前 numbering 的图书数据
            foreach ($booksArr as $bookItem) {
                if ($bookItem['numbering'] == $numbering) {
                    $handleData[$index] = $bookItem;
                    break;
                }
            }
            
            $numbering--;
            
        } while ($numbering > 0);
        
        // 数组顺序翻转
        $handleData = array_reverse($handleData);
        
        return $handleData;
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
            return $this->resultFalse($response, 'Who Are U ?');
        
        if (empty($booksInCategoriesJson))
            return $this->resultFalse($response, '图书数据不能没有哇 ~');
        
        // 准备 booksInCategories
        $booksInCategoriesArr = @json_decode($booksInCategoriesJson, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            return $this->resultFalse($response, '类目图书 JSON 解析失败 ' . json_last_error_msg());
        
        $bookTotal = 0; // 导入的图书总数
        
        foreach ($booksInCategoriesArr as $categoryName => $categoryBooks) {
            // 准备类目数据
            $category = $this->tableCategory()->where([
                'name' => $categoryName
            ]);
    
            // 若类目不存在 则创建一个
            if (!$category->exists()) {
                $this->tableCategory()->insert([
                    'name' => $categoryName,
                    'registrar_name' => $registrarName,
                    'update_at' => 0,
                    'created_at' => $currentTime,
                ]);
                
                $category = $this->tableCategory()->where([
                    'name' => $categoryName
                ]);
            }
            
            /** @var $categoryBooks mixed 单个类目中的图书数据 */
            if (empty($categoryBooks) || !is_array($categoryBooks))
                $categoryBooks = [];
            
            // $categoryBooks = $this->handleBooks($categoryBooks); // 上传的数据不管它
            $categoryBooksJson = json_encode($categoryBooks, JSON_UNESCAPED_UNICODE);
            
            // 图书数据插入数据库
            $this->tableBook()->insert([
                'category_name' => $categoryName,
                'category_book_data' => $categoryBooksJson,
                'registrar_name' => $registrarName,
                'created_at' => $currentTime,
            ]);
            
            // 类目 update_at 更新，与 tableBook 中单个项目的 created_at 一致
            $category->update([
                'update_at' => $currentTime,
            ]);
            
            $bookTotal += count($categoryBooks);
        }
        
        return $this->resultTrue($response, '本次共上传了 ' . count($booksInCategoriesArr) . ' 个类目的 ' . $bookTotal . ' 本图书数据', [
            'update_at' => $currentTime,
            'update_at_format' => date('Y-m-d H:i:s', $currentTime)
        ]);
    }
    
    /**
     * 数据表格文件下载
     *
     * @inheritdoc
     */
    public function downloadExcel(Request $request, Response $response, $args) {
        $categoryName = trim($request->getParam('categoryName'));
        
        if (empty($categoryName))
            throw new NotFoundException($request, $response);
        
        // 准备数据
        $categories = $this->tableCategory('`name` ASC');
        $datetime =  date('YmdHis', time());
        
        if ($categoryName !== '__ALL') {
            $categories = $categories->where(['name' => $categoryName]);
            $fileName = '类目'.$categoryName.'的图书数据_' . $datetime;
        } else {
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
            
            $book = $this->tableBook()->where([
                'category_name' => $categoryData->name,
                'created_at' => intval($categoryData->update_at)
            ]);
            
            if (!$book->exists()) return null;
            $book = $book->get()->first();
            $booksJson = $book->category_book_data;
            
            if (empty($booksJson)) return null;
            $booksArr = @json_decode($booksJson, true);
            if (json_last_error() !== JSON_ERROR_NONE) return null;
            
            $booksArr = $this->handleBooks($booksArr);
            if (empty($booksArr)) return null;
            
            $data = [];
            foreach ($booksArr as $bookItem) {
                $numbering = $bookItem['numbering'];
                $numberingFull = $categoryName . ' ' . $numbering;
                $data[] = [
                    $categoryName, $numbering, $numberingFull,
                    $bookItem['name'], $bookItem['press'], $bookItem['remarks'],
                    $registrarName
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
                $objPHPExcel->getActiveSheet()->setCellValue($colName.$rowNum, $item[$index]);
            }
        }
    
        // 设置宽度
        foreach ($cols as $index => $colName) {
            $objPHPExcel->getActiveSheet()->getColumnDimension($colName)->setWidth($width[$index]);
        }
        
        header('Content-Type: application/vnd.ms-excel;charset=UTF-8');
        header('Content-Disposition: attachment;filename="'. $fileName .'.xls"');
        header('Cache-Control: max-age=0');
        $objWriter = \PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
        $objWriter->save('php://output');
    }
    
    /**
     * 数据表 - 类目
     *
     * @param $orderBy
     * @return \Illuminate\Database\Query\Builder
     */
    private function tableCategory($orderBy = '`created_at` DESC') {
        return $this->db->table('category')->orderByRaw($orderBy);
    }
    
    /**
     * 数据表 - 类目中的图书
     *
     * @param $orderBy
     * @return \Illuminate\Database\Query\Builder
     */
    private function tableBook($orderBy = '`created_at` DESC') {
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
    private function resultTrue(Response $response, $msg, array $data = []) {
        return $response->withJson([
            'success' => true,
            'msg' => $msg,
            'data' => $data,
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
    private function resultFalse(Response $response, $msg, array $data = []) {
        return $response->withJson([
            'success' => false,
            'msg' => $msg,
            'data' => $data,
        ]);
    }
}