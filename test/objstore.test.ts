import { MockObject } from '@aperturerobotics/pbobject/mock/object'
import { objectenc } from '@aperturerobotics/objectenc'
import { IEncryptionConfig } from '@aperturerobotics/pbobject'
import { IResource } from '@aperturerobotics/objectenc/resource'
import { ISecretBoxResource } from '@aperturerobotics/objectenc/resource-secretbox'

import randombytes from 'randombytes'
import IPFS from 'ipfs'
import { ObjectStore } from '../obj-store'
import { LevelBlobDb } from '../level'
import { RemoteStore } from '../ipfs'
import { LocalDB } from '../localdb'

async function buildIPFS(): Promise<IPFS> {
    let ipfs = new IPFS({
        repo: './test-ipfs-repo',
    })
    return new Promise<IPFS>((resolve, reject) => {
        ipfs.on('ready', () => {
            resolve(ipfs)
        })
    })
}

describe('ObjStore', () => {
    let key = randombytes(32)
    let nonce = randombytes(24)
    let ipfs: IPFS;
    let levelBlob: LevelBlobDb;
    let remoteStore: RemoteStore;
    let localStore: LocalDB;

    beforeAll(async () => {
        ipfs = await buildIPFS()
        levelBlob = new LevelBlobDb('./test-level-db')
        remoteStore = new RemoteStore(ipfs)
        localStore = new LocalDB(levelBlob)
    })

    afterAll(async () => {
        await levelBlob.close()
        ipfs.stop()
    })

    it('should store and retrieve an object', async () => {
        let objStore = new ObjectStore(localStore, remoteStore)

        let encConf: IEncryptionConfig = {
            encryptionType: objectenc.EncryptionType.EncryptionType_SECRET_BOX,
            compressionType: objectenc.CompressionType.CompressionType_SNAPPY,
            resourceLookup: async function(
                blob: objectenc.EncryptedBlob,
                resource: IResource,
            ): Promise<void> {
                if (resource.resourceId !== 'ISecretBoxResource') {
                    throw new Error('expected secret box resource lookup')
                }

                let sbr = resource as ISecretBoxResource
                sbr.keyData = key
                sbr.nonceData = nonce

                return
            },
        }

        let obj = new MockObject({ testField: "testing" })
        let res = await objStore.storeObject(
            obj,
            encConf,
        )
        console.log(res.storageRef.toJSON())

        let objAfter = new MockObject()
        objAfter = await objStore.getOrFetch(
            res.storageRef.objectDigest,
            res.storageRef.ipfs.objectHash,
            objAfter,
            encConf,
        )
        expect(objAfter.testField).toEqual(obj.testField)
    })
})
