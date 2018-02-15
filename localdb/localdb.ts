import {
    ILocalStore,
    IArrayPtr,
    NotFoundError,
} from '../interfaces'
import { IDb } from '../db/interfaces'
import { pbobject, IObject } from '@aperturerobotics/pbobject'

import isEqual from 'arraybuffer-equal'
import toBuffer from 'typedarray-to-buffer'
import multihashing from 'multihashing'
import multihashes from 'multihashes'

// LocalDB wraps a db.IDb to implement LocalStore.
export class LocalDB implements ILocalStore {
    // db is the key-value database.
    private db: IDb;

    constructor(db: IDb) {
        this.db = db
    }

    // getDigestKey returns the key for the given digest.
    public getDigestKey(hash: Uint8Array): string {
        return toBuffer(hash).toString('hex')
    }

    // digestData digests the unencrypted data.
    public digestData(data: Uint8Array): Uint8Array {
        // let b = multihashing.digest(toBuffer(data), 'sha2-256')
        let mh = multihashing(toBuffer(data), 'sha2-256')
        let decMh = multihashes.decode(mh)
        let b = decMh.digest

        return new Uint8Array(b, b.byteOffset, b.byteLength)
    }

    // getLocal returns an object by digest, assuming it has already been fetched into the decrypted cache.
    public async getLocal(digest: Uint8Array, obj: IObject): Promise<IObject> {
        let digestKey = this.getDigestKey(digest)
        let data = await this.db.getKey(digestKey)
        if (!data || !data.length) {
            throw new NotFoundError()
        }

        return obj.decode(data)
    }

    // storeLocal encodes an object to an unencrypted blob, hashing it with the database hashing scheme.
    public async storeLocal(obj: IObject, hashPtr: IArrayPtr): Promise<void> {
        let digest: Uint8Array | null = null
        if (hashPtr && hashPtr.ptr && hashPtr.ptr.length) {
            digest = hashPtr.ptr
        }

        let data = obj.encode(obj).finish()
        let computedDigest = this.digestData(data)
        if (digest && digest.length) {
            if (!isEqual(new ArrayBuffer(digest as any), new ArrayBuffer(computedDigest as any))) {
                throw new Error('digest of encoded data did not match given digest')
            }
        } else if (hashPtr) {
            hashPtr.ptr = computedDigest
        }

        digest = computedDigest
        return this.db.setKey(this.getDigestKey(digest), data)
    }

    // clearDatabase clears the database.
    public async clearDatabase(): Promise<void> {
        return this.db.clearKeys()
    }
}
