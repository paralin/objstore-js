import { IDb } from '../db'
import * as level from 'level-browserify'

// LevelBlobDb is the level blob database implementation.
export class LevelBlobDb implements IDb {
    // db is the leveldb instance.
    private db: any;

    constructor(dbPath: string) {
        this.db = level(dbPath, { valueEncoding: 'binary' })
    }

    // getKey retrieves an object from the database.
    // Not found should return nil
    public async getKey(key: string): Promise<Uint8Array | null> {
        try {
            let val: Uint8Array | null = new Uint8Array(await this.db.get(key))
            return val
        } catch (e) {
            return null
        }
    }

    // setKey sets an object in the database.
    public async setKey(key: string, val: Uint8Array): Promise<void> {
        return this.db.put(key, val)
    }

    // listKeys returns a list of keys with the specified prefix.
    public async listKeys(prefix: string): Promise<string[]> {
        let keys: string[] = []
        return new Promise<string[]>((resolve, reject) => {
            this.db.createKeyStream().
                on('data', (key: string) => {
                    if (!prefix.length || key.startsWith(prefix)) {
                        keys.push(key)
                    }
                }).
                on('close', () => {
                    resolve(keys)
                }).
                on('error', (e: any) => {
                    reject(e)
                })
        })
    }

    // clearKeys clears the keys in the database.
    public async clearKeys(): Promise<void> {
        let keys = await this.listKeys("")
        for (let key of keys) {
            await this.db.del(key)
        }
    }

    public close(): Promise<void> {
        return this.db.close()
    }
}
