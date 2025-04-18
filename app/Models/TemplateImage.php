<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateImage extends Model
{
    //
    protected $fillable = 
        ['businessunit_id', 
            'image_path', 
            'image_path2', 
            'emp_img_x', 
            'emp_img_y', 
            'emp_name_x', 
            'emp_name_y', 
            'emp_img_width', 
            'emp_img_height', 
            'emp_pos_x',
            'emp_pos_y',
            'emp_idno_x',
            'emp_idno_y',
            'emp_sig_x',
            'emp_sig_y',
            'emp_add_x',
            'emp_add_y',
            'emp_bday_x',
            'emp_bday_y',
            'emp_sss_x',
            'emp_sss_y',
            'emp_phic_x',
            'emp_phic_y',
            'emp_hdmf_x',
            'emp_hdmf_y',
            'emp_tin_x',
            'emp_tin_y',
            'emp_emergency_name_x',
            'emp_emergency_name_y',
            'emp_emergency_num_x',
            'emp_emergency_num_y',
            'emp_emergency_add_x',
            'emp_emergency_add_y',
            'emp_qrcode_x',
            'emp_qrcode_y',
            'emp_qrcode_width',
            'emp_qrcode_height',
            'created_at', 
            'updated_at'];

    public function businessUnit()
    {
        return $this->belongsTo(BusinessUnit::class, 'businessunit_id');
    }
}
