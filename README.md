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

## Usage
### Basic example

```typescript jsx
import React, { FC } from "react"
import Yup from "yup"
import {
  useMultiFormikHook,
  FormikHook,
} from 'multi-formik-hook'

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
  const [pets, setPets] = useState<{id: string}[]>([]);
  const addPet = () => {
    setPets([...pets, {id: uuid()}]);
  };
  const removePet = (id: string) => {
    setPets(pets.filter(pet => pet.id !== id));
  };
  
  const forms = useMultiFormikHook<MetaFormProps>()
  
  return (
    <div>
      <PersonalDataForm
        useFormik={forms.bind('userData')}
      />
      {pets.map(pet => (
        <PetForm
          useFormik={forms.bindGroup('pets', pet.id)}
          key={pet.id}
          initialValues={{
            name: '',
            breed: '',
          }}
        />
      ))}
      <button onClick={addPet}>Add pet</button>
    </div>
  )
}


```
