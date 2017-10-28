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
class Api extends ApiBase
{
    /**
     * 路由
     */
    protected function getRoutes()
    {
        return [
            ['GET', '/', 'index'],
            ['GET', '/getTime', 'getTime'],
            ['GET', '/getUser', 'getUser'],
            ['GET', '/getCategory', 'getCategory'],
            ['POST', '/uploadCategory', 'uploadCategory'],
            ['GET', '/categoryCreate', 'categoryCreate'],
            
            ['GET', '/categoryExcel[/{name}]', 'categoryExcel'],
        ];
    }
    
    /**
     * 主页
     *
     * @inheritdoc
     */
    public function index(Request $request, Response $response, array $args)
    {
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
            'time'        => time(),
            'time_format' => date('Y-m-d H:i:s', time()),
        ]);
    }
    
    /**
     * 获取用户资料
     *
     * @inheritdoc
     */
    public function getUser(Request $request, Response $response, $args)
    {
        $user = trim($request->getParam('user'));
    
        if (empty($user))
            return $this->error($response, '参数 user 是必须的');
        
        $categoryTotal = 0;
        $bookTotal = 0;
        
        $categories = $this->tableCategory()->where(['user' => $user]);
        if ($categories->exists()) {
            $categoryTotal = $categories->count();
        }
    
        // Find books
        $books = $this->tableBook()->where(['user' => $user])->where('name', '!=', '');
        if ($books->exists()) {
            $bookTotal = $books->count();
        }
        
        return $this->success($response, '获取用户资料成功', [
            'category_total' => $categoryTotal,
            'book_total'     => $bookTotal,
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
    
        $categoriesTable = $this->tableCategory('`name` ASC');
        
        if (!empty($name)) {
            $categories = $categoriesTable->where(['name' => $name]);
            if (!$categories->exists())
                return $this->error($response, '该类目不存在');
            $categories = $categories->limit(1)->get();
        }
        else {
            $categories = $categoriesTable->get();
        }
        
        $apiData = [];
        foreach ($categories as $index => $item) {
            /** @var $item Category */
            
            $apiData[$index] = [
                'name'              => $item->name,
                'user'              => '测试',
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
        $importCategoryBookItem = function ($categoryName, $numbering, array $bookItem) use ($user, $time) {
            $numbering = intval($numbering);
            
            // $numbering 永不等于 "0"！
            if (empty($numbering) || (empty($bookItem['name']) && empty($bookItem['press']) && empty($bookItem['remarks'])))
                return;
    
            $attributes = [
                'category_name' => $categoryName,
                'numbering'     => $numbering,
            ];
            
            $values = [
                'user'       => $user,
                'updated_at' => $time,
            ];
            
            if (!empty($bookItem['name']))
                $values = array_merge($values, ['name' => $bookItem['name']]);
    
            if (!empty($bookItem['press']))
                $values = array_merge($values, ['press' => $bookItem['press']]);
    
            if (!empty($bookItem['remarks']))
                $values = array_merge($values, ['remarks' => $bookItem['remarks']]);
            
            if (!$this->tableBook()->where($attributes)->exists())
                $values = array_merge($values, ['created_at' => $time]);
            
            $this->tableBook()->updateOrInsert($attributes, $values);
            
            return;
        };
        
        $categoryTotal = 0;
        $bookTotal = 0;
        $error = null;
        
        // 导入多类图书
        foreach ($books as $categoryName => $arr) {
            try {
                $category = $this->tableCategory()->where([
                    'name' => $categoryName,
                ]);
    
                if (!$category->exists())
                    throw new \Exception('类目' . $categoryName . ' 未找到');
                
                foreach ($arr as $numbring => $bookItem) {
                    // Key 即是 Numbring
                    $importCategoryBookItem($categoryName, $numbring, $bookItem);
                    
                    $bookTotal++;
                }
                
                $category->update([
                    'updated_at' => $time
                ]);
            } catch (\Exception $exception) {
                $error = $categoryName . '类 图书数据导入错误： ' . $exception->getMessage();
                $this->logger->error($error);
                break;
            }
    
            $categoryTotal++;
        }
        
        if ($error === null) {
            return $this->success($response, '本次共上传了 ' . $categoryTotal . ' 个类目的 ' . $bookTotal . ' 本图书数据');
        } else {
            return $this->error($response, '图书数据保存失败，请联系网站管理员');
        }
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
        
        if ($category->exists())
            return $this->success($response, '同名类目已存在，无需再次创建', ['categoryExist' => true, 'categoryName' => $name]);
        
        // 若类目不存在 则创建一个
        $insert = $this->tableCategory()->insert([
            'name'       => $name,
            'user'       => $user,
            'remarks'    => '',
            'created_at' => $time,
            'updated_at' => $time,
        ]);
        
        if ($insert)
            return $this->success($response, '类目创建成功', ['categoryExist' => false, 'categoryName' => $name]);
        
        return $this->error($response, '类目创建失败');
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
    
    /*
    |--------------------------------------------------------------------------
    | 附加操作，工具什么的
    |--------------------------------------------------------------------------
    |
    | Tools and more.
    |
    */
    
    /**
     * 数据表格文件下载
     *
     * @inheritdoc
     */
    public function categoryExcel(Request $request, Response $response, $args)
    {
        $name = trim($args['name']);
        
        // 准备数据
        $categories = $this->tableCategory('`name` ASC');
        $datetime = date('Y-m-d His', time());
        
        if (!empty($name)) {
            $categories = $categories->where(['name' => $name]);
            $fileName = 'Category ' . $name . ' ' . $datetime;
        }
        else {
            $fileName = 'All Category ' . $datetime;
        }
        
        if (!$categories->exists())
            throw new NotFoundException($request, $response);
        
        $categories = $categories->get();
        $data = [];
        $data[1] = []; // 表头占位
        
        $buildSingleCategoryData = function (Category $categoryData) {
            $categoryName = $categoryData->name;
            $user = $categoryData->user ?? '';
            
            if (empty($categoryName))
                return null;
            
            $books = $this->tableBook('`numbering` ASC')->where([
                'category_name' => $categoryName,
            ]);
            
            if (!$books->exists())
                return null;
            $books = $books->get()->toArray();
            $books = $this->handleBooksForGetting($books);
            
            $data = [];
            foreach ($books as $bookItem) {
                if (empty($bookItem['numbering']) || (empty($bookItem['name']) && empty($bookItem['press']) && empty($bookItem['remarks'])))
                    continue;
                
                $numbering = $bookItem['numbering'];
                $numberingFull = $categoryName . ' ' . $numbering;
                $data[] = [
                    $categoryName,
                    $numbering,
                    $numberingFull,
                    $bookItem['name'],
                    $bookItem['press'],
                    $bookItem['remarks'],
                    $user,
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
        header('Content-Disposition: attachment;filename="' . addslashes($fileName) . '.xls"');
        header('Cache-Control: max-age=0');
        $objWriter = \PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel5');
        $objWriter->save('php://output');
    }
}