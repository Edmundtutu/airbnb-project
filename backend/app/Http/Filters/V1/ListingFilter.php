<?php

namespace App\Http\Filters\V1;

use App\Http\Filters\ApiFilter;

class ListingFilter extends ApiFilter
{
    protected $allowed_params = [
        'name' => ['eq', 'like'],
        'description' => ['eq', 'like'],
        'price_per_night' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in', 'not_in'],
        'max_guests' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in', 'not_in'],
        'bedrooms' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in', 'not_in'],
        'bathrooms' => ['eq', 'btw', 'not_btw','gt','lt','gte','lte','ne','in', 'not_in'],
        'tags' => ['eq', 'like'],
        'category' => ['eq'],
        'is_active' => ['eq'],
        'instant_book' => ['eq'],
        'property_id' => ['eq'],
    ];

    protected $column_map = [];
}
