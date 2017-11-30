<?php
namespace App;

use Illuminate\Database\Eloquent\Model;

/**
 * 类目
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 * @property string $name 类目名
 * @property string $user 登记员
 * @property string $remarks 备注
 * @property int $status 状态
 * @property int $type 类型
 * @property bool $isDone 是否已完成
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Book[] $books 该类目下的图书
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereUser($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Category whereUpdatedAt($value)
 */
class Category extends Model
{
    protected $table = 'category';
    
    const STATUS_WORK = 1;
    const STATUS_DONE = 2;
    
    const TYPE_DEFAULT = 1;
    
    protected $attributes = [
        'status' => self::STATUS_WORK,
        'type' => self::TYPE_DEFAULT,
    ];
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    
    protected $fillable = [
        'name',
        'user',
        'remarks',
        'status',
        'type'
    ];
    
    public function books()
    {
        return $this->hasMany(Book::class, 'category_name', 'name');
    }
    
    /**
     * 类目是否已完成
     *
     * @return bool
     */
    public function getIsDoneAttribute()
    {
        return $this->status == self::STATUS_DONE;
    }
}