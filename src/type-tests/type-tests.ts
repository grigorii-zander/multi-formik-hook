import { useMultiFormik } from '../useMultiFormik'
import { FormikHook } from "../formik.types"

type SingleFormProps1 = {
  single1StringProp: string
  single1NumberProps: number
  single1BooleanProp: boolean
  single1ArrayProp: string[]
}

type SingleFormProps2 = {
  single2StringProp: string
  single2NumberProps: number
  single1BooleanProp: boolean
  single2ArrayProp: string[]
}

type MultiFormProps1 = {
  multi1StringProp: string
  multi1NumberProps: number
  multi1BooleanProp: boolean
  multi1ArrayProp: string[]
}

type MultiFormProps2 = {
  multi2StringProp: string
  multi2NumberProps: number
  multi2BooleanProp: boolean
  multi2ArrayProp: string[]
}

type FormsDataType = {
  single1: SingleFormProps1
  single2: SingleFormProps2
  multi1: MultiFormProps1[]
  multi2: MultiFormProps2[]
}

const expectType = <TExpected>(value: TExpected): any => {
}

const singleForm1Receiver = ({ useFormik }: { useFormik: FormikHook<SingleFormProps1> }) => {
}
const singleForm2Receiver = ({ useFormik }: { useFormik: FormikHook<SingleFormProps2> }) => {
}
const multiForm1Receiver = ({ useFormik }: { useFormik: FormikHook<MultiFormProps1> }) => {
}
const multiForm2Receiver = ({ useFormik }: { useFormik: FormikHook<MultiFormProps2> }) => {
}

const forms = useMultiFormik<FormsDataType>()

/**** `bind` interface test ****/
// Only "single" forms should be available for the "bind" method
forms.bind('single1')
forms.bind('single2')

// @ts-expect-error
forms.bind('multi1')
// @ts-expect-error
forms.bind('multi2')


/**** `bind` consumer test ****/
singleForm1Receiver({ useFormik: forms.bind('single1') })
singleForm2Receiver({ useFormik: forms.bind('single2') })

// @ts-expect-error - receiver should only consume forms with compliant types
singleForm1Receiver({ useFormik: forms.bind('single2') })
// @ts-expect-error - receiver should only consume forms with compliant types
singleForm2Receiver({ useFormik: forms.bind('single1') })

/**** `bindGroup` interface test ****/
forms.bindGroup('multi1', 'id')
forms.bindGroup('multi2', 'id')

// @ts-expect-error
forms.bindGroup('single1', 'id')
// @ts-expect-error
forms.bindGroup('single2', 'id')

multiForm1Receiver({ useFormik: forms.bindGroup('multi1', 'id') })
multiForm2Receiver({ useFormik: forms.bindGroup('multi2', 'id') })

// @ts-expect-error - receiver should only consume forms with compliant types
multiForm1Receiver({ useFormik: forms.bindGroup('multi2', 'id') })
// @ts-expect-error - receiver should only consume forms with compliant types
multiForm2Receiver({ useFormik: forms.bindGroup('multi1', 'id') })


/**** `map` interface test ****/

forms.map(({ key, formik }) => {
  switch (key) {
    case 'single1': {
      expectType<SingleFormProps1>(formik.values)

      // @ts-expect-error
      expectType<SingleFormProps2>(formik.values)
      // @ts-expect-error
      expectType<MultiFormProps1>(formik.values)
      // @ts-expect-error
      expectType<MultiFormProps2>(formik.values)
      break
    }
    case 'single2':
      expectType<SingleFormProps2>(formik.values)

      // @ts-expect-error
      expectType<SingleFormProps1>(formik.values)
      // @ts-expect-error
      expectType<MultiFormProps1>(formik.values)
      // @ts-expect-error
      expectType<MultiFormProps2>(formik.values)
      break
    case 'multi1':
      expectType<MultiFormProps1>(formik.values)
      // @ts-expect-error
      expectType<SingleFormProps1>(formik.values)
      // @ts-expect-error
      expectType<SingleFormProps2>(formik.values)
      // @ts-expect-error
      expectType<MultiFormProps2>(formik.values)
      break
    case 'multi2':
      break

    // @ts-expect-error - key should exist in form data
    case 'unknown':
      break
  }
})

/**** `instances` type test ****/
expectType<SingleFormProps1 | undefined>(forms.instances.single1?.values)
expectType<ReturnType<FormikHook<SingleFormProps1>> | undefined>(forms.instances.single1)

// @ts-expect-error
expectType<SingleFormProps2 | undefined>(forms.instances.single1?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<SingleFormProps2>> | undefined>(forms.instances.single1)

// @ts-expect-error
expectType<MultiFormProps1 | undefined>(forms.instances.single1?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<MultiFormProps1>> | undefined>(forms.instances.single1)

// @ts-expect-error
expectType<MultiFormProps2 | undefined>(forms.instances.single1?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<MultiFormProps2>> | undefined>(forms.instances.single1)


expectType<SingleFormProps2 | undefined>(forms.instances.single2?.values)
expectType<ReturnType<FormikHook<SingleFormProps2>> | undefined>(forms.instances.single2)

// @ts-expect-error
expectType<SingleFormProps1 | undefined>(forms.instances.single2?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<SingleFormProps1>> | undefined>(forms.instances.single2)

// @ts-expect-error
expectType<MultiFormProps1 | undefined>(forms.instances.single2?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<MultiFormProps1>> | undefined>(forms.instances.single2)

// @ts-expect-error
expectType<MultiFormProps2 | undefined>(forms.instances.single2?.values)
// @ts-expect-error
expectType<ReturnType<FormikHook<MultiFormProps2>> | undefined>(forms.instances.single2)


expectType<MultiFormProps1 | undefined>(forms.groupInstances.multi1?.['id'].values)
expectType<Record<string, ReturnType<FormikHook<MultiFormProps1>>> | undefined>(forms.groupInstances.multi1)

// @ts-expect-error
expectType<MultiFormProps1 | undefined>(forms.groupInstances.multi2?.['id'].values)
// @ts-expect-error
expectType<Record<string, ReturnType<FormikHook<MultiFormProps1>>> | undefined>(forms.groupInstances.multi2)


/**** `getValues` interface test ****/

forms.getValues('single1')
forms.getValues('single2')

// @ts-expect-error
forms.getValues('multi1')
// @ts-expect-error
forms.getValues('multi2')


expectType<SingleFormProps1 | null>(forms.getValues('single1'))
expectType<SingleFormProps2 | null>(forms.getValues('single2'))

// @ts-expect-error
expectType<SingleFormProps1 | null>(forms.getValues('single2'))
// @ts-expect-error
expectType<SingleFormProps2 | null>(forms.getValues('single1'))

/**** `getGroupValues` interface test ****/

forms.getGroupValues('multi1', 'id')
forms.getGroupValues('multi2', 'id')

// @ts-expect-error
forms.getGroupValues('single1', 'id')
// @ts-expect-error
forms.getGroupValues('single2', 'id')


expectType<MultiFormProps1 | null>(forms.getGroupValues('multi1', 'id'))
expectType<MultiFormProps2 | null>(forms.getGroupValues('multi2', 'id'))

// @ts-expect-error
expectType<MultiFormProps1 | null>(forms.getGroupValues('multi2', 'id'))
// @ts-expect-error
expectType<MultiFormProps2 | null>(forms.getGroupValues('multi1', 'id'))


/**** submitAll interface test ****/

async function submitAll() {
  const [, result] = await forms.submitAll()

  expectType<SingleFormProps1 | undefined>(result.single1)
  expectType<SingleFormProps2 | undefined>(result.single2)

  // @ts-expect-error
  expectType<SingleFormProps1 | undefined>(result.multi1)
  // @ts-expect-error
  expectType<SingleFormProps2 | undefined>(result.multi1)
  // @ts-expect-error
  expectType<SingleFormProps1 | undefined>(result.multi2)
  // @ts-expect-error
  expectType<SingleFormProps2 | undefined>(result.multi2)


  expectType<MultiFormProps1[] | undefined>(result.multi1)
  expectType<MultiFormProps2[] | undefined>(result.multi2)

  // @ts-expect-error
  expectType<MultiFormProps1[] | undefined>(result.single1)
  // @ts-expect-error
  expectType<MultiFormProps2[] | undefined>(result.single1)

  // @ts-expect-error
  expectType<MultiFormProps1[] | undefined>(result.single2)
  // @ts-expect-error
  expectType<MultiFormProps2[] | undefined>(result.single2)
}
