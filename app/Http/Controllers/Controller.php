<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Response;
use Laravel\Lumen\Routing\Controller as BaseController;

class Controller extends BaseController
{
    /**
     * 处理图书数据 for Getting API
     *
     * @param array $booksArr 原图书数据
     * @return array 处理后的图书数据
     */
    protected function handleBooksForGetting(array $booksArr)
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
                'user'      => '',
            ];
            
            // 搜寻是否有当前 numbering 的图书数据
            foreach ($booksArr as $bookItem) {
                if ($bookItem['numbering'] == $numbering) {
                    $data[$index]['numbering'] = strval($numbering);
                    $data[$index]['name'] = $bookItem['name'] ?? '';
                    $data[$index]['press'] = $bookItem['press'] ?? '';
                    $data[$index]['remarks'] = $bookItem['remarks'] ?? '';
                    $data[$index]['user'] = $bookItem['user'] ?? '';
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
     * @param string $msg 正确信息
     * @param array $data 附带正确数据
     * @return Response
     */
    protected function success($msg, array $data = [])
    {
        $response = [
            'success' => true,
            'status'  => 'success',
            'msg'     => $msg,
            'data'    => $data
        ];
        
        return response()->json($response)
            ->header('Access-Control-Allow-Origin', '*');
    }
    
    /**
     * 响应 - 错误结果
     *
     * @param string $msg 错误信息
     * @param array $data 附带错误数据
     * @return Response
     */
    protected function error($msg, array $data = [])
    {
        $response = [
            'success' => false,
            'status'  => 'error',
            'msg'     => $msg,
            'data'    => $data
        ];
        
        return response()->json($response)
            ->header('Access-Control-Allow-Origin', '*');
    }
}
