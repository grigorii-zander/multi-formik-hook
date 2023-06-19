import { FormikInstance, HookConfig, FormikValues } from './formik.types'
import { useFormik as _useFormik } from 'formik'

export function useFormik<T extends FormikValues>(config: HookConfig<T>) {
  return _useFormik(config as any) as FormikInstance<T>
}
export * from './formik.types'
export * from './useMultiFormik'
