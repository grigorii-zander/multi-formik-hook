import {useCallback, useEffect, useRef, useState} from 'react';
import {useFormik} from 'formik';
import {entries, flat, keys, values} from './utils/object';

type OriginalFormikHook<T = any> = typeof useFormik<T>
type HookParams<T> = Parameters<OriginalFormikHook<T>>[0]

// Remove `onSubmit` handler from required properties because
// it is not required anymore since we control form submission in the higher order hook.
type HookConfig<T> = Omit<HookParams<T>, 'onSubmit'> & {
  onSubmit?: HookParams<T>['onSubmit']
}
type HookReturnType<T> = ReturnType<OriginalFormikHook<T>>

export type FormikHook<T = any> = (config: HookConfig<T>) => HookReturnType<T>

type ArrayItem<T> = T extends Array<infer U> ? U : T
type FormikEntry<T extends Record<string, any>> = {
  [K in keyof T]: {key: K, formik: T[K]};
}[keyof T];

type KeysOfType<MAP, TYPE, KEYS extends keyof MAP> = {
  [K in KEYS]: MAP[K] extends TYPE ? K : never
}[KEYS]

type KeysNotOfType<MAP, TYPE, KEYS extends keyof MAP> = {
  [K in KEYS]: MAP[K] extends TYPE ? never : K
}[KEYS]

export function useMultiFormikHook<
  T extends Record<string, any>,
  KEYS extends keyof T = keyof T,
  ARRAY_KEYS extends KeysOfType<T, any[], KEYS> = KeysOfType<T, any[], KEYS>,
  NON_ARRAY_KEYS extends KeysNotOfType<T, any[], KEYS> = KeysNotOfType<T, any[], KEYS>,
  >() {
  type Instance<T> = ReturnType<FormikHook<T>>
  type InstanceMap = { [K in KEYS]: Instance<T[K]> }
  const instances = useRef<Partial<InstanceMap>>({});

  type GroupInstanceMap = { [K in ARRAY_KEYS]: {[index: string]: Instance<ArrayItem<T[K]>>} }
  const groupInstances = useRef<Partial<GroupInstanceMap>>({}) ;

  type HookFn<T> = FormikHook<T>
  type HookFnMap = { [K in KEYS]: HookFn<T[K]> }
  const hooksRef = useRef<Partial<HookFnMap>>({});

  type HookFnGroup<T> = { [index: string]: HookFn<T> }
  type HookFnGroupMap = { [K in KEYS]: HookFnGroup<ArrayItem<T[K]>> }
  const hooksGroupsRef = useRef<Partial<HookFnGroupMap>>({});

  const [dirty, setDirty] = useState(false);
  const [valid, setValid] = useState(true);

  const map = useCallback(
    <R>(cb: (value: FormikEntry<T[KEYS]>) => R): R[] => {
      const result: R[] = [];
      entries(instances.current).forEach(([key, value]) => {
        result.push(cb({ key, formik: value }));
      });
      entries(groupInstances.current).forEach(([key, group]) => {
        values(group).forEach((value) => {
          result.push(cb({ key, formik: value }));
        });
      });
      return result;
    },
    [],
  );

  const runValidation = useCallback(() => {
    setValid(map((entry) => entry.formik.isValid).every(Boolean));
    setDirty(map((entry) => entry.formik.dirty).some(Boolean));
  }, [map]);

  const useRegister = useCallback(<K extends NON_ARRAY_KEYS>(instanceKey: K, instance: Instance<T[K]>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      instances.current[instanceKey] = instance;
      runValidation();
      // eslint-disable-next-line
    }, [instance])
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return () => {
        delete instances.current[instanceKey];
        delete hooksRef.current[instanceKey];
        runValidation();
      };
      // eslint-disable-next-line
    }, [])
  }, [runValidation]);

  const useRegisterGroup = useCallback(
    <K extends ARRAY_KEYS>(groupKey: K, id: string, instance: Instance<T[K]>) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        (groupInstances.current[groupKey] = groupInstances.current[groupKey] || {})[id] = instance;
        runValidation();
        // eslint-disable-next-line
      }, [instance])
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        return () => {
          delete groupInstances.current[groupKey]?.[id];
          delete hooksGroupsRef.current[groupKey]?.[id];
          runValidation();
        };
        // eslint-disable-next-line
      }, [])
    }, [runValidation]);

  const bind = useCallback(
    <K extends NON_ARRAY_KEYS>(instanceKey: K) => {
      const hook = hooksRef.current[instanceKey] || function useFormikHookInternal(config) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const formikInstance = useFormik({
          ...config,
          onSubmit: config.onSubmit || (() => {}),
          validateOnMount: true,
        });
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRegister(instanceKey, formikInstance);
        return formikInstance;
      };

      hooksRef.current[instanceKey] = hook;

      return hook!;
    },
    [useRegister],
  );

  const bindGroup = useCallback(
    <K extends ARRAY_KEYS>(groupKey: K, id: string) => {
      let hooksGroup = hooksGroupsRef.current[groupKey];
      if(!hooksGroup) {
        hooksGroup = {};
        hooksGroupsRef.current[groupKey] = hooksGroup;
      }
      let instanceGroup = groupInstances.current[groupKey];
      if(!instanceGroup){
        instanceGroup = {};
        groupInstances.current[groupKey] = instanceGroup;
      }

      const hook = hooksGroup[id] || function useFormikGroupHookInternal(config) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const formikInstance = useFormik({
          ...config,
          onSubmit: config.onSubmit || (() => {}),
          validateOnMount: true,
        });
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRegisterGroup(groupKey, id, formikInstance);
        return formikInstance;
      };

      hooksGroup[id] = hook;

      return hooksGroup[id]!;
    },
    [useRegisterGroup],
  );

  const isAllValid = useCallback(() => map(({ formik }) => formik.isValid).every(valid => valid), [map]);

  const submitAll = useCallback(
    (cb?: (valid: boolean, result: Partial<T>) => void) => {
      return Promise.all(
        map(({ formik }) => {
          return formik.submitForm();
        }),
      ).then(() => {
        const result: Partial<T> = {};
        entries(instances.current).forEach(([key, instance]) => {
          result[key as keyof T] = instance.values;
          keys(flat(instance.errors)).forEach(path => {
            instance.setFieldTouched(path, true);
          });
        });

        entries(groupInstances.current).forEach(([key, group]) => {
          result[key] = [] as T[typeof key];
          entries(group).forEach(([, instance]) => {
            result[key].push(instance.values);
            keys(flat(instance.errors)).forEach(path => {
              instance.setFieldTouched(path, true);
            });
          });
        });

        const valid = isAllValid();
        cb && cb(valid, result);
        return [valid, result] as const;
      });
    },
    [isAllValid, map],
  );

  const getValues = useCallback(<K extends keyof T>(instanceName: K) => {
    return instances.current[instanceName]?.values || null;
  }, []);

  const reset = useCallback(
    function<K extends KEYS>(form?: K) {
      if (form) {
        instances.current[form]?.resetForm();

        // TODO: it seems like there is a bug in typescript, it won't resolve nested maps here
        values(groupInstances.current[form] as any || {}).forEach((instance) => instance.resetForm());
      } else {
        map(({ formik }) => {
          formik.resetForm();
        });
      }
    },
    [map],
  );

  return {
    instances: instances.current,
    groupInstances: groupInstances.current,
    map,
    valid,
    dirty,
    submitAll,
    getValues,
    reset,
    bind,
    bindGroup,
  };
}
