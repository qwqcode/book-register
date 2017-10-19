<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 类目
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 * @property string $name 类目名
 * @property string $user 登记员
 * @property string $remarks 备注
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Book[] $books 该类目下的图书
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Category whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Category whereUser($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Category whereRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Category whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Category whereUpdatedAt($value)
 */
class Category extends Model
{
    protected $table = 'category';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    
    public function books()
    {
        return $this->hasMany(Book::class, 'category_name', 'name');
    }
}