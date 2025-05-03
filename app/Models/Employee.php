<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Employee extends Model
{
    use HasFactory, HasUuids;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'uuid';

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_no',
        'date_hired',
        'employee_firstname',
        'employee_middlename',
        'employee_lastname',
        'employee_name_extension',
        'address',
        'birthday',
        'position',
        'tin_no',
        'sss_no',
        'hdmf_no',
        'phic_no',
        'emergency_name',
        'emergency_contact_number',
        'emergency_address',
        'id_status',
        'reason',
        'employment_status',
        'contract_status',
        'employee_id_counter',
        'image_person',
        'image_signature',
        'image_qrcode',
        'id_last_exported_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_hired' => 'date',
        'birthday' => 'date',
    ];
    
    // /**
    //  * Get the full name of the employee.
    //  *
    //  * @return string
    //  */
    // public function getFullNameAttribute()
    // {
    //     $fullName = $this->employee_firstname;
        
    //     if ($this->employee_middlename) {
    //         $fullName .= ' ' . substr($this->employee_middlename, 0, 1) . '.';
    //     }
        
    //     $fullName .= ' ' . $this->employee_lastname;
        
    //     if ($this->employee_name_extension) {
    //         $fullName .= ' ' . $this->employee_name_extension;
    //     }
        
    //     return $fullName;
    // }

    public function businessUnit()
    {
        // Ensure this matches your database structure
        // If the column is named businessunit_id:
        return $this->belongsTo(BusinessUnit::class, 'businessunit_id');
    }
}
