import {
  FieldHelperProps,
  FieldInputProps,
  FieldMetaProps,
  FormikConfig,
  FormikErrors,
  FormikState,
  FormikTouched,
  FormikValues,
  FieldConfig,
} from 'formik'
import * as React from 'react'

type HookConfig<T> = Omit<FormikConfig<T>, 'onSubmit'> & {
  // it is not required anymore since we control form submission in the higher order hook.
  onSubmit?: FormikConfig<T>['onSubmit']
}

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
    (e: React.FocusEvent<any, Element>): void;
    <T = any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
  };
  handleChange: {
    (e: React.ChangeEvent<any>): void;
    <T_1 = string | React.ChangeEvent<any>>(field: T_1): T_1 extends React.ChangeEvent<any> ? void : (e: string | React.ChangeEvent<any>) => void;
  };
  handleReset: (e: any) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  resetForm: (nextState?: Partial<FormikState<Values>>) => void;
  setErrors: (errors: FormikErrors<Values>) => void;
  setFormikState: (stateOrCb: FormikState<Values> | ((state: FormikState<Values>) => FormikState<Values>)) => void;
  setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
  setFieldError: (field: string, value: string | undefined) => void;
  setStatus: (status: any) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setTouched: (touched: FormikTouched<Values>, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
  setValues: (values: React.SetStateAction<Values>, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
  submitForm: () => Promise<any>;
  validateForm: (values?: Values) => Promise<FormikErrors<Values>>;
  validateField: (name: string) => Promise<void> | Promise<string | undefined>;
  isValid: boolean;
  dirty: boolean;
  unregisterField: (name: string) => void;
  registerField: (name: string, { validate }: any) => void;
  getFieldProps: (nameOrOptions: string | FieldConfig<any>) => FieldInputProps<any>;
  getFieldMeta: (name: string) => FieldMetaProps<any>;
  getFieldHelpers: (name: string) => FieldHelperProps<any>;
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
