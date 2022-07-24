# multi-formik-hook
Utility hook for the [Formik](https://formik.org/) library.  
It helps manage multiple Formik instances by the single hook.

## Requirements
- React>=16.8.0 (for hooks)
- Formik>=2.2.0 (it should work with previous versions, but it is not tested)

## What it can do
- Control multiple forms from one place.
For example if you have several forms on the page, and you want to submit them all at once by a single button.
- Provides a state of all controlled forms (like `valid` and `dirty` state).
- Allows to dynamically add or remove forms on demand.
- Can help with performance in a big forms. On user input only one form will be re-rendered at a time.

## What it can't do
- It doesn't support cross form validation.
If you want to one form rely on data of another, it can't help you with that.
You can access the formik instance of every form and make your own validation, but this library doesn't provide any
special utility for that.
- Nested forms is not supported.

## Installation
```bash
# using NPM
$ npm i multi-formik-hook
# using Yarn
$ yarn add multi-formik-hook
# using pnpm
$ pnpm i multi-formik-hook
```

## API
### `useMultiFormik`
Returns the following object:

#### `valid: boolean`
True if all forms are valid.

#### `dirty: boolean`
True if some form is dirty.

#### `map<R>(cb: (item: {key: string, formik: FormikHook}) => R) => R[]`
Map over all existing forms and return an array.
Where `key` is a unique key of the form, and `formik` is the Formik instance.

It also iterates over grouped forms in a flat manner, so
you don't need to worry about the nesting. Think about it as `someArray.flat(Infinity).map(...)`.

##### Example
```typescript jsx
// Check if some form is currently validating
const instance = useMultiFormik()
const isSomeValidating = instance.map(item => item.formik.isValidating).some(Boolean)
```

#### `bind(formKey: string): FormikHook`
Creates a new Formik hook for the given form key. It dynamically creates a new Formik hook function which you can use
inside your form component.

#### `bindGroup(formKey: string, formId: string): FormikHook`
Same as `bind`, but it creates a new Formik hook dedicated to the given form group (basically form array).
The `formId` is a unique key of the form. It's required to preserve the state of the form on dynamic add it or removal.

#### `instances: Record<string, FormikHook>`
Object containing all created Formik hooks.

#### `groupInstances: Record<string, Record<string, FormikHook>>`
Object containing all created Formik hooks for grouped forms.

#### `submitAll(): Promise<[boolean, result]>`
Submits all forms and returns a tuple with valid/invalid validation status and an object containing all form's current values.

#### `getValues(formKey: string): object`
Shorthand for getting form values (`instance.instances.formKey.values`).

#### `getGroupValues(formKey: string, formId: string): object`
Shorthand for getting form values of the group by form ID (`instance.groupInstances.formKey[formId].values`).

#### `reset(formKey?: string): void`
Resets all forms to their initial values. If `formKey` is provided, it resets only the form with the given key.

## Usage
### Examples

[See interactive example on the Stackblitz](https://stackblitz.com/edit/multi-formik-hook-basic-example)


#### Code example

```typescript jsx
import React, { FC, useState, useCallback } from "react"
import Yup from "yup"
import {
  useMultiFormikHook,
  FormikHook,
} from 'multi-formik-hook'

// Define the type of the form
type PersonalDataFormProps = {
  name: string
  age: string
  email: string
}

// Create a form with the `useFormik` property 
// Use special utility type FormikHook.
const PersonalDataForm: FC<{
  useFormik: FormikHook<PersonalDataFormProps>, initialValues: PersonalDataFormProps 
}> = ({ useFormik, initialValues }) => {
  
  const valudationSchema = useMemo(() => {
    return Yup.object().shape({
      name: Yup.string().required("Name is required"),
      age: Yup.number().required("Age is required"),
      email: Yup.string().email("Email is required").required("Email is required"),
    })
  }, [])
  
  // Use the `useFormik` like a normal Formik hook. All configuration properties are available.
  const formik = useFormik({
    initialValues,
    validationSchema,
  })
  
  return (
    <div>
      <label>
        Name:
        <input
          {...formik.getFieldProps("name")}
        />
        {errors.name && touched.name &&
          <div>{errors.name}</div>}
      </label>
      <label>
        Age:
        <input
          type={'number'}
          {...formik.getFieldProps('age')}
        />
        {errors.age && touched.age &&
          <div>{errors.age}</div>}
      </label>
      <label>
        Email:
        <input
          {...formik.getFieldProps('email')}
        />
        {errors.email && touched.email &&
          <div>{errors.email}</div>}
      </label>
    </div>
  )
}

type PetFormProps = {
  name: string
  breed: 'cat' | 'dog'
}

const PetForm: FC<{
  useFormik: FormikHook<PetFormProps>, initialValues: PetFormProps 
}> = ({ useFormik, initialValues }) => {
  
  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      name: Yup.string().required("Name is required"),
      breed: Yup.mixed().oneOf(["cat", "dog"], "Breed should be cat or dog").required("Breed is required"),
    }),
  })
  
  return (
    <div>
      <label>
        Name:
        <input
          {...formik.getFieldProps("name")}
        />
        {errors.name && touched.name &&
          <div>{errors.name}</div>}
      </label>
      <label>
        Breed:
        <input
          {...formik.getFieldProps('breed')}
        />
        {errors.breed && touched.breed &&
          <div>{errors.breed}</div>}
      </label>
    </div>
  )
}


type MetaFormProps = {
  userData: PersonalDataFormProps
  pets: PetFormProps[]
}

const UserMetaForm:FC = () => {
  const [pets, setPets] = useState<{id: string}[]>([])
  const addPet = () => {
    setPets([...pets, {id: uuid()}])
  }
  const removePet = (id: string) => {
    setPets(pets.filter(pet => pet.id !== id))
  }
  
  const forms = useMultiFormikHook<MetaFormProps>()

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const [valid, result] = await forms.submitAll()
    if(!valid){
      return
    }

    doSomethingWith(result)
    
  }, [forms])
  
  return (
    <form onSubmit={handleSubmit}>
      <PersonalDataForm
        // provide the `useFormik` hook to the form component
        useFormik={forms.bind('userData')}
      />
      {pets.map(pet => (
        <PetForm
          // for the group forms it is required to set an unique id
          useFormik={forms.bindGroup('pets', pet.id)}
          key={pet.id}
          onRemove={() => removePet(pet.id)}
          initialValues={{
            name: '',
            breed: '',
          }}
        />
      ))}
      <button type={'button'} onClick={addPet}>Add pet</button>
      <button type={'submit'}>Submit</button>
    </form>
  )
}

```
