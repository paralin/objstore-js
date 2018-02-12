export interface IDb {
    // getKey retrieves an object from the database.
    // Not found should return nil
    getKey(key: string): Promise<Uint8Array | null>;
    // setKey sets an object in the database.
    setKey(key: string, val: Uint8Array): Promise<void>;
    // listKeys returns a list of keys with the specified prefix.
    listKeys(prefix: string): Promise<string[]>;
    // clearKeys deletes all the keys.
    clearKeys(): Promise<void>
}
