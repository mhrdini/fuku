import { Control, FieldValues, Path, UseFormResetField } from 'react-hook-form'

type CountryControllerProps<T extends FieldValues> = {
  control: Control<T>
  resetField: UseFormResetField<T>
  name?: Path<T>
  disabled?: boolean
}

export function CountryController<T extends FieldValues>({
  control,
  resetField,
  name = 'country' as Path<T>,
  disabled = false,
}: CountryControllerProps<T>) {
  return null
}
