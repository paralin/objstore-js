import { IDb } from '../db'

// InmemDB implements a key-value database in memory.
export class InmemDB implements IDb {
    private db: { [key: string]: Uint8Array } = {}

    // getKey retrieves an object from the database.
    // Not found should return nil
    public async getKey(key: string): Promise<Uint8Array | null> {
        return this.db[key] || null
    }

    // setKey sets an object in the database.
    public async setKey(key: string, val: Uint8Array): Promise<void> {
        this.db[key] = val
        return
    }

    // listKeys returns a list of keys with the specified prefix.
    public async listKeys(prefix: string): Promise<string[]> {
        let result: string[] = []
        for (let key in this.db) {
            if (!this.db.hasOwnProperty(key)) {
                continue
            }

            if (prefix && prefix.length) {
                if (!key.startsWith(prefix)) {
                    continue
                }
            }

            result.push(key)
        }

        return result
    }
}
