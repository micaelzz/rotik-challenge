<?php

namespace App\Http\Requests;

use App\Enums\AgentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(array_column(AgentType::cases(), 'value'))],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('O campo nome do agente é obrigatório.'),
            'name.string' => __('O campo nome do agente deve ser um texto válido.'),
            'name.max' => __('O campo nome do agente não pode ter mais de 255 caracteres.'),
            'type.required' => __('O campo tipo de agente é obrigatório.'),
            'type.in' => __('O tipo de agente informado é inválido.'),
        ];
    }
}
