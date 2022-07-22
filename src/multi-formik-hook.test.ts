/**
 * If you run this test file, you will see lots of warning about `an update of component was not wrapped in act`.
 * The issue is that some the methods produced by useMultiFormik will trigger an update of the parent hook state.
 *
 * To make things work, you need to trigger rerender function manually after every interaction with
 * useMultiFormikHook object.
 * Yes, it will trigger lots of rerenders, but at least we got kinda real behavior.
 */

import { useMultiFormikHook } from './multi-formik-hook'
import { renderHook, act } from '@testing-library/react'
import * as Yup from 'yup'


describe('useMultiFormik', () => {
  it('propagates initialValues to useMultiFormik hook handler', () => {
    type FormData = {
      form: {
        a: string,
        b: number
      }
    }

    const initialValues: FormData['form'] = {
      a: 'test string',
      b: 42,
    }

    const { result: forms, rerender: rerenderForms } = renderHook(() => useMultiFormikHook<FormData>())
    const formHook = forms.current.bind('form')
    rerenderForms()
    const { result: formik } = renderHook(() => formHook({
      initialValues,
    }))
    rerenderForms()

    expect(formik.current.values).toStrictEqual(initialValues)
  })

  it('sets `dirty` flag to true when values change and set it back to false when value changed to initial value', () => {
    type FormData = {
      form: {
        a: string,
      }
    }

    const initialValues: FormData['form'] = {
      a: '',
    }

    const changedValues: FormData['form'] = {
      a: 'test string',
    }

    const { result: forms, rerender: rerenderForms } = renderHook(() => useMultiFormikHook<FormData>())
    const formHook = forms.current.bind('form')
    rerenderForms()
    const { result: formik } = renderHook(() => formHook({
      initialValues,
    }))
    rerenderForms()

    act(() => {
      formik.current.setFieldValue('a', changedValues.a)
    })

    expect(formik.current.values).toStrictEqual(changedValues)
    expect(forms.current.dirty).toBe(true)

    act(() => {
      formik.current.setFieldValue('a', initialValues.a)
    })

    expect(forms.current.dirty).toBe(false)
  })


  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  it('sets `invalid` flag to true when values are invalid and set it back to false when values are valid', async () => {
    type FormData = {
      form: {
        a: string,
      }
    }

    const initialValues: FormData['form'] = {
      a: '',
    }

    const invalidString = 'aaaaaaaaaaaaaaaaaa'
    const validString = 'aaaaa'

    const validationSchema = Yup.object().shape({
      a: Yup.string().max(validString.length, 'Too long'),
    })

    const { result: forms, rerender: rerenderForms } = renderHook(() => useMultiFormikHook<FormData>())
    const formHook = forms.current.bind('form')
    rerenderForms()
    const { result: formik } = renderHook(() => formHook({
      initialValues,
      validationSchema,
    }))
    rerenderForms()

    expect(forms.current.valid).toBe(true)

    act(() => {
      formik.current.setFieldValue('a', invalidString)
    })
    rerenderForms()
    await delay(100)
    expect(forms.current.valid).toBe(false)

    act(() => {
      formik.current.setFieldValue('a', validString)
    })
    rerenderForms()
    await delay(100)
    expect(forms.current.valid).toBe(true)
  })
})
