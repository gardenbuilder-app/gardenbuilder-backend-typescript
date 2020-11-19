import faker from 'faker'
import { Bed, Garden } from '../../src/entities'

export async function createBedInDatabase(
  garden: Garden,
  name: string = faker.commerce.productName()
): Promise<Bed> {
  const bed = Bed.create({
    garden,
    name,
  })
  console.log(bed)
  return await bed.save()
}