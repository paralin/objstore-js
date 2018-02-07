import * as pbobject from '@aperturerobotics/pbobject'
import {
    IArrayPtr,
    ILocalStore,
    IRemoteStore,
    NotFoundError,
} from './interfaces'

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
        obj: pbobject.IObject,
        encConf: pbobject.IEncryptionConfig,
    ): Promise<pbobject.IObject> {
        // Attempt to cache hit the local db
        try {
            let localObj = await this.getLocal(digest, obj)
            if (localObj) {
                return localObj
            }
        } catch (e) {
            if (!(e instanceof NotFoundError)) {
                throw e
            }
        }

        // Call out to the remote database as the next layer of caches.
        let data = await this.fetchRemote(storageRef)
        if (!data) {
            throw new NotFoundError()
        }

        // Decode and decrypt the wrapper
        let wrapperInner = pbobject.ObjectWrapper.decode(data)
        let wrapper = new pbobject.ObjectWrapper(wrapperInner)
        let objDecoded = await wrapper.decodeToObject(obj, encConf)

        // Store it locally
        await this.storeLocal(obj, { ptr: digest })
        return objDecoded
    }

    // getLocal returns an object by digest, assuming it has already been fetched into the decrypted cache.
    public getLocal(digest: Uint8Array, obj: pbobject.IObject): Promise<pbobject.IObject> {
        return this.localStore.getLocal(digest, obj)
    }

    // storeLocal encodes an object to an unencrypted blob, hashing it with the database hashing scheme.
    public storeLocal(obj: pbobject.IObject, hashPtr: IArrayPtr): Promise<void> {
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
}
