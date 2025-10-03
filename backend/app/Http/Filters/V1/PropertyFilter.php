<?php

namespace App\Http\Filters\V1;

use App\Http\Filters\ApiFilter;

class PropertyFilter extends ApiFilter
{
    protected $allowed_params = [
        'name' => ['eq', 'like'],
        'host_id' => ['eq'],
        'description' => ['eq', 'like'],
        'address' => ['eq', 'like'],
        'lat' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in','not_in'],
        'lng' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in','not_in'],
        'phone' => ['eq', 'like'],
        'hours' => ['eq','in','not_in','btw','not_btw','gt','lt','gte','lte','ne'],
        'category' => ['eq'],
        'verified' => ['eq'],
    ];

    protected $column_map = [
    ];
}
