import { AES } from '../aes'
import { crypto } from '../crypto'
import { objectenc } from '../pb'
import { IResource, ResourceResolverFunc } from '../resource'
import { IKeyResource } from '../resource-key'
import * as Protobuf from 'protobufjs/minimal'
import { Encrypt } from '../encrypt'
import { Decrypt } from '../decrypt'

describe('AES', () => {
  it('is instantiable', () => {
    expect(new AES({})).toBeInstanceOf(AES)
  })

  let data = new Uint8Array([5, 4, 3, 2, 1])
  let key = crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ])
  let keyResolver: ResourceResolverFunc = async function(
    blob: objectenc.EncryptedBlob,
    resource: IResource
  ) {
    if (resource.resourceId === 'IKeyResource') {
      let keyResource = resource as IKeyResource
      keyResource.keyData = await key
    }
  }

  it('encrypts and decrypts correctly', async () => {
    let aes = new AES()
    let encBlob = await aes.encryptBlob(keyResolver, data)
    let dec = await aes.decryptBlob(keyResolver, encBlob)
    expect(data).toEqual(dec)
  })

  it('encrypts and decrypts correctly from registered implementation', async () => {
    let blob = await Encrypt(objectenc.EncryptionType.EncryptionType_AES, data, keyResolver)
    let decBlob = await Decrypt(blob, keyResolver)
    expect(decBlob).toEqual(data)
  })

  it('throws an error without a resolver', async () => {
    expect(Encrypt(objectenc.EncryptionType.EncryptionType_AES, data, null)).rejects.toThrow()
  })
})
