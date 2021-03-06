import faker from 'faker'
import { Connection } from 'typeorm'
import jwt from '../../src/utils/jwt'
import {
  callGraphQL,
  createBed,
  createGarden,
  createUser,
  testConnection,
} from '../testUtils'
import { Bed, Garden, User } from '../../src/entities'

let connection: Connection
let owner: User
let garden: Garden
let bed: Bed
let token: string

beforeAll(async () => {
  connection = await testConnection()
  owner = createUser()
  garden = createGarden(owner)
  bed = await createBed(garden).save()
  token = jwt.assign(bed.gardenId.toString())
})

afterAll(async () => {
  connection.close()
})

const bedQuery = `
query Bed($id: Int!) {
  bed(id: $id) {
    name
  }
}
`

const bedsQuery = `
query Beds {
  beds {
    name
  }
}
`

const createBedMutation = `
mutation CreateBed($gardenId: Int! $name: String! $length: Int! $width: Int! $unitOfMeasurement: String!) {
  createBed(gardenId: $gardenId, name: $name, length: $length, width: $width, unitOfMeasurement: $unitOfMeasurement) {
    name
    length
    width
    unitOfMeasurement
  }
}
`

const updateBedDimensionsMutation = `
mutation updateBedDimensions($input: UpdateBedDimensionsInput!) {
  updateBedDimensions(input: $input) {
    id
    length
    width
    unitOfMeasurement
  }
}
`

describe('the bed query', () => {
  it('returns the name of an existing bed', async () => {
    const response = await callGraphQL({
      source: bedQuery,
      variableValues: { id: bed.id },
      authorizationHeader: token,
    })
    expect(response?.data?.bed.name).toBe(bed.name)
  })

  it('returns no beds if called with a nonexistent id', async () => {
    const FAKE_ID = 666
    const response = await callGraphQL({
      source: bedQuery,
      variableValues: { id: FAKE_ID },
      authorizationHeader: token,
    })
    expect(response?.data?.bed).toBeFalsy()
  })
})

describe('the beds query', () => {
  it('returns a list of beds', async () => {
    const response = await callGraphQL({
      source: bedsQuery,
      authorizationHeader: token,
    })
    expect(response?.data?.beds.includes({ name: bed.name }))
  })
})

describe('the createBed mutation', () => {
  let name: string
  let gardenId: number
  let response: any
  let length: number
  let width: number
  let unitOfMeasurement: string

  beforeAll(async () => {
    name = faker.commerce.productName()
    gardenId = bed.gardenId
    length = bed.length
    width = bed.width
    unitOfMeasurement = bed.unitOfMeasurement

    response = await callGraphQL({
      source: createBedMutation,
      variableValues: { gardenId, name, length, width, unitOfMeasurement },
      authorizationHeader: token,
    })
  })

  it('inserts a bed into the database', async () => {
    const bed = await Bed.findOne({ where: { name } })
    expect(bed).toBeTruthy()
  })

  it('returns its name after creation if one is passed', async () => {
    expect(response).toMatchObject({
      data: {
        createBed: {
          name,
        },
      },
    })
  })
})

describe('the updateBedDimensions mutation', () => {
  it('updates a bed in the database', async () => {
    const length = 3
    const width = 3
    const unitOfMeasurement = 'cm'
    const bedId = bed.id

    const response = await callGraphQL({
      source: updateBedDimensionsMutation,
      variableValues: {
        input: {
          id: bedId,
          length,
          width,
          unitOfMeasurement: 'cm',
        },
      },
      authorizationHeader: token,
    })

    const updatedBed = await Bed.findOne({ where: { id: bedId } })

    expect(updatedBed?.width).toEqual(width)
    expect(updatedBed?.length).toEqual(length)
    expect(updatedBed?.unitOfMeasurement).toEqual(unitOfMeasurement)
    expect(response?.data?.updateBedDimensions.width).toEqual(width)
    expect(response?.data?.updateBedDimensions.length).toEqual(length)
    expect(response?.data?.updateBedDimensions.unitOfMeasurement).toEqual(
      unitOfMeasurement
    )
  })
})
