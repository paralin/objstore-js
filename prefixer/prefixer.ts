import { IDb } from '../db'

// Prefixer wraps a IDb implementation with a key prefix.
export class Prefixer implements IDb {
    constructor(private db: IDb, private prefix: string) { }

    // getKey retrieves an object from the database.
    // Not found should return nil
    public async getKey(key: string): Promise<Uint8Array | null> {
        return this.db.getKey(this.prefix + key)
    }

    // setKey sets an object in the database.
    public async setKey(key: string, val: Uint8Array): Promise<void> {
        return this.db.setKey(this.prefix + key, val)
    }

    // listKeys returns a list of keys with the specified prefix.
    public async listKeys(prefix: string): Promise<string[]> {
        prefix = this.prefix + prefix
        return this.db.listKeys(prefix)
    }
}
