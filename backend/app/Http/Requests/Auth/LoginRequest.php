<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => __('O campo e-mail é obrigatório.'),
            'email.email' => __('Informe um endereço de e-mail válido.'),
            'password.required' => __('O campo senha é obrigatório.'),
        ];
    }
}
