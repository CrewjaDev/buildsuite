<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_code',
        'partner_name',
        'partner_name_print',
        'partner_name_kana',
        'partner_type',
        'representative',
        'representative_kana',
        'branch_name',
        'postal_code',
        'address',
        'building_name',
        'phone',
        'fax',
        'invoice_number',
        'email',
        'is_subcontractor',
        'closing_date',
        'deposit_terms',
        'deposit_date',
        'deposit_method',
        'cash_allocation',
        'bill_allocation',
        'payment_date',
        'payment_method',
        'payment_cash_allocation',
        'payment_bill_allocation',
        'establishment_date',
        'capital_stock',
        'previous_sales',
        'employee_count',
        'business_description',
        'bank_name',
        'branch_name_bank',
        'account_type',
        'account_number',
        'account_holder',
        'login_id',
        'journal_code',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_subcontractor' => 'boolean',
        'is_active' => 'boolean',
        'closing_date' => 'integer',
        'deposit_date' => 'integer',
        'cash_allocation' => 'decimal:2',
        'bill_allocation' => 'decimal:2',
        'payment_date' => 'integer',
        'payment_cash_allocation' => 'decimal:2',
        'payment_bill_allocation' => 'decimal:2',
        'establishment_date' => 'date',
        'capital_stock' => 'integer',
        'previous_sales' => 'integer',
        'employee_count' => 'integer',
    ];

    // リレーション
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function estimates()
    {
        return $this->hasMany(Estimate::class);
    }

    public function estimateItems()
    {
        return $this->hasMany(EstimateItem::class, 'supplier_id');
    }

    public function costPlanItems()
    {
        return $this->hasMany(CostPlanItem::class, 'supplier_id');
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCustomers($query)
    {
        return $query->whereIn('partner_type', ['customer', 'both']);
    }

    public function scopeSuppliers($query)
    {
        return $query->whereIn('partner_type', ['supplier', 'both']);
    }

    public function scopeSubcontractors($query)
    {
        return $query->where('is_subcontractor', true);
    }

    // アクセサ
    public function getFullAddressAttribute()
    {
        $address = $this->address;
        if ($this->building_name) {
            $address .= ' ' . $this->building_name;
        }
        return $address;
    }

    public function getDisplayNameAttribute()
    {
        return $this->partner_name_print ?: $this->partner_name;
    }

    // ミューテータ
    public function setPartnerNameAttribute($value)
    {
        $this->attributes['partner_name'] = $value;
        if (!$this->partner_name_print) {
            $this->attributes['partner_name_print'] = $value;
        }
    }
}
