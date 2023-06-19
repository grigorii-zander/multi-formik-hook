import { useCallback, useEffect, useRef, useState } from 'react'
import { FormikValues, useFormik } from 'formik'
import { entries, flat, keys, values } from './utils/object'
import { FormikHook } from './formik.types'

type ArrayItem<T> = T extends Array<infer U> ? U : T
type FormikEntry<T extends Record<string, any>, KEYS extends keyof T> = {
  [K in KEYS]: { key: K, formik: ReturnType<FormikHook<ArrayItem<T[K]>>> };
}[KEYS];

type KeysOfType<MAP, TYPE, KEYS extends keyof MAP> = {
  [K in KEYS]: K extends string ? MAP[K] extends TYPE ? K : never : never
}[KEYS]

type KeysNotOfType<MAP, TYPE, KEYS extends keyof MAP> = {
  [K in KEYS]: K extends string ? MAP[K] extends TYPE ? never : K : never
}[KEYS]

export function useMultiFormik<T extends Record<string, any>,
  KEYS extends keyof T = keyof T,
  ARRAY_KEYS extends KeysOfType<T, any[], KEYS> = KeysOfType<T, any[], KEYS>,
  NON_ARRAY_KEYS extends KeysNotOfType<T, any[], KEYS> = KeysNotOfType<T, any[], KEYS>,
>() {
  type Instance<T extends FormikValues> = ReturnType<FormikHook<T>>
  type InstanceMap = { [K in NON_ARRAY_KEYS]?: Instance<T[K]> }
  const instances = useRef<InstanceMap>({} satisfies InstanceMap)

  type GroupInstanceMap = { [K in ARRAY_KEYS]?: { [index: string]: Instance<ArrayItem<T[K]>> } }
  const groupInstances = useRef<GroupInstanceMap>({})

  type HookFn<T extends FormikValues> = FormikHook<T>
  type HookFnMap = { [K in NON_ARRAY_KEYS]?: HookFn<T[K]> }
  const hooksRef = useRef<HookFnMap>({})

  type HookFnGroup<T extends FormikValues> = { [index: string]: HookFn<T> }
  type HookFnGroupMap = { [K in ARRAY_KEYS]?: HookFnGroup<ArrayItem<T[K]>> }
  const hooksGroupsRef = useRef<HookFnGroupMap>({})

  const [dirty, setDirty] = useState(false)
  const [valid, setValid] = useState(true)

  const map = useCallback(
    <R>(cb: (value: FormikEntry<T, NON_ARRAY_KEYS> | FormikEntry<T, ARRAY_KEYS>) => R): R[] => {
      const result: R[] = []
      entries(instances.current).forEach(([key, value]) => {
        result.push(cb({ key: key, formik: value }))
      })
      entries(groupInstances.current).forEach(([key, group]) => {
        values(group).forEach((value) => {
          result.push(cb({ key: key, formik: value }))
        })
      })
      return result
    },
    [],
  )

  const runValidation = useCallback(() => {
    setValid(map((entry) => entry.formik.isValid).every(Boolean))
    setDirty(map((entry) => entry.formik.dirty).some(Boolean))
  }, [map])

  const useRegister = useCallback(<K extends NON_ARRAY_KEYS>(instanceKey: K, instance: Instance<T[K]>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      instances.current[instanceKey] = instance
      runValidation()
      // eslint-disable-next-line
    }, [instance])
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return () => {
        delete instances.current[instanceKey]
        delete hooksRef.current[instanceKey]
        runValidation()
      }
      // eslint-disable-next-line
    }, [])
  }, [runValidation])

  const useRegisterGroup = useCallback(
    <K extends ARRAY_KEYS>(groupKey: K, id: string, instance: Instance<T[K]>) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        const group = groupInstances.current[groupKey] || {}
        group[id] = instance
        runValidation()
        // eslint-disable-next-line
      }, [instance])
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        return () => {
          delete groupInstances.current[groupKey]?.[id]
          delete hooksGroupsRef.current[groupKey]?.[id]
          runValidation()
        }
        // eslint-disable-next-line
      }, [])
    }, [runValidation])

  const bind = useCallback(
    <K extends NON_ARRAY_KEYS>(instanceKey: K) => {
      const hook = hooksRef.current[instanceKey] || function useFormikHookInternal(config) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const formikInstance = useFormik({
          ...config,
          onSubmit: config.onSubmit || (() => {
          }),
          validateOnMount: true,
        })
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRegister(instanceKey, formikInstance)
        return formikInstance
      }

      hooksRef.current[instanceKey] = hook

      return hook!
    },
    [useRegister],
  )

  const bindGroup = useCallback(
    <K extends ARRAY_KEYS>(groupKey: K, id: string) => {
      let hooksGroup = hooksGroupsRef.current[groupKey]
      if (!hooksGroup) {
        hooksGroup = {}
        hooksGroupsRef.current[groupKey] = hooksGroup
      }
      let instanceGroup = groupInstances.current[groupKey]
      if (!instanceGroup) {
        instanceGroup = {}
        groupInstances.current[groupKey] = instanceGroup
      }

      const hook = hooksGroup[id] || function useFormikGroupHookInternal(config) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const formikInstance = useFormik({
          ...config,
          onSubmit: config.onSubmit || (() => {
          }),
          validateOnMount: true,
        })
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRegisterGroup(groupKey, id, formikInstance)
        return formikInstance
      }

      hooksGroup[id] = hook

      return hook!
    },
    [useRegisterGroup],
  )

  const isAllValid = useCallback(() => map(({ formik }) => formik.isValid).every(valid => valid), [map])

  const submitAll = useCallback(
    (cb?: (valid: boolean, result: Partial<T>) => void) => {
      return Promise.all(
        map(({ formik }) => {
          return formik.submitForm()
        }),
      ).then(() => {
        const result: Partial<T> = {}
        entries(instances.current).forEach(([key, instance]) => {
          result[key as keyof T] = instance.values
          keys(flat(instance.errors)).forEach(path => {
            instance.setFieldTouched(path, true)
          })
        })

        entries(groupInstances.current).forEach(([key, group]) => {
          result[key] = [] as T[typeof key]
          entries(group).forEach(([, instance]) => {
            result[key].push(instance.values)
            keys(flat(instance.errors)).forEach(path => {
              instance.setFieldTouched(path, true)
            })
          })
        })

        const valid = isAllValid()
        cb && cb(valid, result)
        return [valid, result] as const
      })
    },
    [isAllValid, map],
  )

  const getValues = useCallback(<K extends NON_ARRAY_KEYS>(instanceKey: K) => {
    return instances.current[instanceKey]?.values || null
  }, [])

  const getGroupValues = useCallback(<K extends ARRAY_KEYS>(instanceKey: K, id: string) => {
    return groupInstances.current[instanceKey]?.[id]?.values || null
  }, [])

  const reset = useCallback(<K extends KEYS>(form?: K) => {
      if (form) {
        instances.current[form]?.resetForm()

        // TODO: it seems like there is a bug in typescript, it won't resolve nested maps here
        // @ts-ignore
        values(groupInstances.current[form] || {}).forEach((instance) => instance.resetForm())
      } else {
        map(({ formik }) => {
          formik.resetForm()
        })
      }
    },
    [map],
  )

  return {
    instances: instances.current,
    groupInstances: groupInstances.current,
    map,
    valid,
    dirty,
    submitAll,
    getValues,
    getGroupValues,
    reset,
    bind,
    bindGroup,
  }
}
