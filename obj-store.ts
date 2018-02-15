import {
    IEncryptionConfig,
    IObject,
    ObjectWrapper,
    pbobject,
    newObjectWrapper,
} from '@aperturerobotics/pbobject'
import { storageref } from '@aperturerobotics/storageref';

import {
    IArrayPtr,
    ILocalStore,
    IRemoteStore,
    NotFoundError,
} from './interfaces'

// IStoreObjectResult contains the result of the storeObject call.
export interface IStoreObjectResult {
    // storageRef contains the built storage reference.
    storageRef: storageref.StorageRef
    // data contains the encoded object.
    data: Uint8Array
}

// ObjectStore overlays a remote encrypted-at-rest blob store over the local unencrypted hash-based storage.
export class ObjectStore implements ILocalStore, IRemoteStore {
    constructor(private localStore: ILocalStore, private remoteStore: IRemoteStore) { }

    // getOrFetch returns an object by hash if it has been fetched into the decrypted cache, or attempts to
    // fetch the requested data from the backing store (IPFS) given the reference string. This will start OR join
    // a process to attempt to fetch this storage ref with this hash.
    // TODO: If the function is called multiple times simultaneously, only one actual fetch routine will be spawned.
    // The multihash code and length must match the database multihash code and length or an error is returned.
    // The digest is of the innermost data of the object, unencrypted.
    public async getOrFetch(
        digest: Uint8Array,
        storageRef: string,
        obj: IObject,
        encConf: IEncryptionConfig,
    ): Promise<IObject> {
        // Attempt to cache hit the local db
        try {
            let localObj = await this.getLocal(digest, obj)
            if (localObj) {
                return localObj
            }
        } catch (e) {
            /*
            if (!(e instanceof NotFoundError)) {
                throw e
            }
            */
        }

        // Call out to the remote database as the next layer of caches.
        let data = await this.fetchRemote(storageRef)
        if (!data) {
            throw new NotFoundError()
        }

        // Decode and decrypt the wrapper
        let wrapperInner = pbobject.ObjectWrapper.decode(data)
        let wrapper = new ObjectWrapper(wrapperInner)
        let objDecoded = await wrapper.decodeToObject(obj, encConf)

        // Store it locally
        await this.storeLocal(obj, { ptr: digest })
        return objDecoded
    }

    // storeObject digests, seals, encrypts, and stores a object locally and remotely.
    // Returns a result or throws an error.
    public async storeObject(obj: IObject, encConf: IEncryptionConfig): Promise<IStoreObjectResult> {
        let owres = await newObjectWrapper(obj, encConf)
        let ow = owres.wrapper
        let blob = ObjectWrapper.encode(ow).finish()
        let digest = this.digestData(owres.data)
        let storageRefStr = await this.storeRemote(blob)
        let storageRef = new storageref.StorageRef({
            storageType: storageref.StorageType.StorageType_IPFS,
            objectDigest: digest,
            ipfs: {
                objectHash: storageRefStr,
            },
        })

        await this.storeLocal(obj, { ptr: digest })
        return { storageRef: storageRef, data: blob }
    }

    // getLocal returns an object by digest, assuming it has already been fetched into the decrypted cache.
    public getLocal(digest: Uint8Array, obj: IObject): Promise<IObject> {
        return this.localStore.getLocal(digest, obj)
    }

    // storeLocal encodes an object to an unencrypted blob, hashing it with the database hashing scheme.
    public storeLocal(obj: IObject, hashPtr: IArrayPtr): Promise<void> {
        return this.localStore.storeLocal(obj, hashPtr)
    }


    // digestData digests the unencrypted data.
    public digestData(data: Uint8Array): Uint8Array {
        return this.localStore.digestData(data)
    }

    // fetchRemote returns a blob from blob storage given the storage reference string.
    public fetchRemote(storageRef: string): Promise<Uint8Array> {
        return this.remoteStore.fetchRemote(storageRef)
    }

    // storeRemote stores a blob in blob storage and returns the storage reference string.
    public storeRemote(blob: Uint8Array): Promise<string> {
        return this.remoteStore.storeRemote(blob)
    }

    // getOrFetchReference gets or fetches a reference, checking the reference type.
    public getOrFetchReference(
        ref: storageref.IStorageRef | null,
        obj: IObject,
        encConf: IEncryptionConfig,
    ): Promise<IObject> {
        if (!ref) {
            throw new Error('storage reference expected')
        }

        if (!ref.ipfs || ref.storageType !== storageref.StorageType.StorageType_IPFS) {
            throw new Error(`expected ipfs storage ref, got ${ref.storageType}`)
        }

        if (!ref.ipfs.objectHash || !ref.ipfs.objectHash.length) {
            throw new Error('ipfs object hash empty')
        }

        if (!ref.objectDigest) {
            throw new Error('expected ipfs storage reference to have object digest')
        }

        return this.getOrFetch(ref.objectDigest, ref.ipfs.objectHash, obj, encConf)
    }
}
