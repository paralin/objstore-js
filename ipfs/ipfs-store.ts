import * as IPFS from 'ipfs'
import { IRemoteStore } from '../interfaces'

// RemoteStore implements the remote store against IPFS.
export class RemoteStore implements IRemoteStore {
    constructor(private client: IPFS) { }

    // fetchRemote returns a blob from blob storage given the storage reference string.
    public async fetchRemote(storageRef: string): Promise<Uint8Array> {
        let fContent: IPFS.FileContent = await this.client.files.cat(storageRef)
        return fContent as Uint8Array
    }

    // storeRemote stores a blob in blob storage and returns the storage reference string.
    public async storeRemote(blob: Uint8Array): Promise<string> {
        let fileRef: IPFS.IPFSFile[] = await this.client.files.add(blob)
        return fileRef[0].path
    }
}
