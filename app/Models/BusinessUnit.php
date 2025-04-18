<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessUnit extends Model
{
    use HasFactory;

    protected $table = 'business_units';
    protected $primaryKey = 'businessunit_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['businessunit_id', 'businessunit_name'];
    
    // Add UUID generation in a boot method or handle it in your controller
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!$model->businessunit_id) {
                $model->businessunit_id = \Illuminate\Support\Str::uuid()->toString();
            }
        });
    }

    public function templateImages()
    {
        return $this->hasMany(TemplateImage::class, 'businessunit_id');
    }
}
