import {
  FieldHelperProps,
  FieldInputProps,
  FieldMetaProps,
  FormikConfig,
  FormikErrors,
  FormikState,
  FormikTouched,
} from 'formik'
import * as React from 'react'

export type HookConfig<T> = Omit<FormikConfig<T>, 'onSubmit'> & {
  // it is not required anymore since we control form submission in the higher order hook.
  onSubmit?: FormikConfig<T>['onSubmit']
}

export type GetFieldType<Obj, Path> = Path extends `${infer Left}.${infer Right}`
  ? Left extends keyof Obj
    ? GetFieldType<Exclude<Obj[Left], undefined>, Right> | Extract<Obj[Left], undefined>
    : undefined
  : Path extends keyof Obj
    ? Obj[Path]
    : undefined

type StringKeys<T> = T extends string ? T : never
export type FormikValues = Record<string, number | boolean | string | null | undefined | number[] | boolean[] | string[]>

/*
* This is the almost exact copy of the useFormik function type from the "formik" package.
* The only difference is the `onSubmit` handler is removed from the required properties.
* Unfortunately, the type is not exported from the package, so we have to replicate it.
*
* It is also possible to get the type of the hook by using Instantiation Expressions
* (more about it here https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#instantiation-expressions)
*
* type OriginalHook<T = any> = typeof useFormik<T>
*
* but I want to make this library to be compatible with typescript@<4.7.
*
*/
export type FormikHook<Values extends FormikValues = FormikValues> = ({
  validateOnChange,
  validateOnBlur,
  validateOnMount,
  isInitialValid,
  enableReinitialize,
  onSubmit,
  ...rest
}: HookConfig<Values>) => {
  initialValues: Values;
  initialErrors: FormikErrors<unknown>;
  initialTouched: FormikTouched<unknown>;
  initialStatus: any;
  handleBlur: {
    (e: React.FocusEvent<any>): void;
    <T = any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
  };
  handleChange: {
    (e: React.ChangeEvent<any>): void;
    <T = string | React.ChangeEvent<any>>(field: T): T extends React.ChangeEvent<any> ? void : (e: string | React.ChangeEvent<any>) => void;
  };
  handleReset: (e: any) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
  resetForm: (nextState?: Partial<FormikState<Values>> | undefined) => void;
  setErrors: (errors: FormikErrors<Values>) => void;
  setFormikState: (stateOrCb: FormikState<Values> | ((state: FormikState<Values>) => FormikState<Values>)) => void;
  setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean | undefined) => Promise<FormikErrors<Values>> | Promise<void>;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => Promise<FormikErrors<Values>> | Promise<void>;
  setFieldError: (field: string, value: string | undefined) => void;
  setStatus: (status: any) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setTouched: (touched: FormikTouched<Values>, shouldValidate?: boolean | undefined) => Promise<FormikErrors<Values>> | Promise<void>;
  setValues: (values: React.SetStateAction<Values>, shouldValidate?: boolean | undefined) => Promise<FormikErrors<Values>> | Promise<void>;
  submitForm: () => Promise<any>;
  validateForm: (values?: Values) => Promise<FormikErrors<Values>>;
  validateField: (name: string) => Promise<void> | Promise<string | undefined>;
  isValid: boolean;
  dirty: boolean;
  unregisterField: (name: string) => void;
  registerField: (name: string, { validate }: any) => void;
  getFieldProps: <P extends StringKeys<keyof Values>>(path: P) => FieldInputProps<GetFieldType<Values, P>>
  getFieldMeta: <P extends StringKeys<keyof Values>>(path: P) => FieldMetaProps<GetFieldType<Values, P>>
  getFieldHelpers: <P extends StringKeys<keyof Values>>(path: P) => FieldHelperProps<GetFieldType<Values, P>>
  validateOnBlur: boolean;
  validateOnChange: boolean;
  validateOnMount: boolean;
  values: Values;
  errors: FormikErrors<Values>;
  touched: FormikTouched<Values>;
  isSubmitting: boolean;
  isValidating: boolean;
  status?: any;
  submitCount: number;
}

export type FormikInstance<T extends FormikValues> = ReturnType<FormikHook<T>>
export type FormikInstanceKeys<T extends FormikInstance<any>> = StringKeys<keyof T['values']>
