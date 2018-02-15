import * as pbobject from '@aperturerobotics/pbobject'

// IArrayPtr is an updatable pointer to an array.
export interface IArrayPtr {
    ptr?: Uint8Array | null
}

// ILocalStore is the local cached unencrypted hash blob store.
export interface ILocalStore {
    // getLocal returns an object by digest, assuming it has already been fetched into the decrypted cache.
    // Implemented by the database layer.
    // The digest is of the innermost data of the object, unencrypted, without the multihash header.
    // If not found, throws NotFoundError
    getLocal(digest: Uint8Array, obj: pbobject.IObject): Promise<pbobject.IObject>;
    // storeLocal encodes an object to an unencrypted blob, hashing it with the database hashing scheme.
    // hashPtr is a pointer to the expected unencrypted hash of the data. If the target array is nil,
    // the target will be written with the computed hash and not verified before storing.
    // If the target array is not nil, the hash will be checked before storage.
    storeLocal(obj: pbobject.IObject, hashPtr: IArrayPtr): Promise<void>;
    // digestData digests the unencrypted data.
    digestData(data: Uint8Array): Uint8Array;
}

// IRemoteStore is the remote blob storage.
export interface IRemoteStore {
    // fetchRemote returns a blob from blob storage given the storage reference string.
    fetchRemote(storageRef: string): Promise<Uint8Array>;

    // storeRemote stores a blob in blob storage and returns the storage reference string.
    storeRemote(blob: Uint8Array): Promise<string>;
}

// NotFoundError is a not found error.
export class NotFoundError extends Error {
    constructor() {
        super("object not found in storage")
    }
}
