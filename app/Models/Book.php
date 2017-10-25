<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 图书
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 * @property string|null $category_name 类目名
 * @property integer|null $numbering 序号
 * @property string|null $name 书名
 * @property string|null $press 出版社
 * @property string|null $remarks 备注
 * @property string|null $user 登记员
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property-read \App\Models\Category $category 类目信息
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereCategoryName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereNumbering($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book wherePress($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereUser($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Book whereUpdatedAt($value)
 */
class Book extends Model
{
    protected $table = 'book';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    
    public function category()
    {
        return $this->belongsTo(Category::class, 'name', 'category_name');
    }
}