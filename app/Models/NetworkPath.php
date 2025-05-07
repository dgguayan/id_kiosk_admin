<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NetworkPath extends Model
{
    protected $table = 'networkPath'; // Match the table name from migration
    protected $fillable = ['key', 'value'];
    
    public static function getNetworkPath($key, $default = null)
    {
        $networkPath = self::where('key', $key)->first();
        return $networkPath ? $networkPath->value : $default;
    }
}
