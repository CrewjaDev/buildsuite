// テンプレートデータの型定義

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface TemplateData {
  title_format: string
  description_template: string
  required_fields: Record<string, string>
  optional_fields: Record<string, string>
  default_values: Record<string, string | number | boolean>
  field_configs?: TemplateField[]
}

export interface TemplateDataForm {
  title_format: string
  description_template: string
  required_fields: Array<{ key: string; label: string }>
  optional_fields: Array<{ key: string; label: string }>
  default_values: Array<{ key: string; value: string | number | boolean }>
  field_configs: TemplateField[]
}
