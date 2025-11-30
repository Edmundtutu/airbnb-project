<?php
namespace App\Http\Filters;

use Illuminate\Http\Request;

class ApiFilter {
    protected $allowed_params = [];
    protected $column_map = [];
    protected $operator_map =[
        'eq' => '=',
        'lt' => '<',
        'lte' => '<=',
        'gt' => '>',
        'gte' => '>=',
        'ne' => '!=',
        'in' => 'IN',
        'not_in' => 'NOT IN',
        'btw' => 'BETWEEN',
        'not_btw' => 'NOT BETWEEN',
        'like'=>'LIKE',
    ];

    public function transform(Request $request){
        $eloquent_query = [];
        foreach($this->allowed_params as $param => $operators){
            $query = $request->query($param);

            if(!isset($query)){
                continue;
            }

            $column = $this->column_map[$param] ?? $param;

            foreach($operators as $operator){
                if(isset($query[$operator])){
                    $value = $this->castValue($query[$operator]);
                    $eloquent_query[] = [$column, $this->operator_map[$operator], $value];
                }
            }
            
        }
        return $eloquent_query;
    }

    /**
     * Cast string values to appropriate PHP types
     * Handles boolean strings ('true'/'false'), numeric strings, and null
     */
    protected function castValue($value)
    {
        // Handle arrays (for IN, NOT IN operators)
        if (is_array($value)) {
            return array_map([$this, 'castValue'], $value);
        }

        // Handle boolean strings
        if (strtolower($value) === 'true' || $value === '1') {
            return true;
        }
        if (strtolower($value) === 'false' || $value === '0') {
            return false;
        }

        // Handle null string
        if (strtolower($value) === 'null') {
            return null;
        }

        // Return as-is for other values
        return $value;
    }
}