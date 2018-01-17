import { EncryptedBlob } from '../blob'

describe('EncryptedBlob', () => {
  it('is instantiable', () => {
    expect(new EncryptedBlob({})).toBeInstanceOf(EncryptedBlob)
  })
})
