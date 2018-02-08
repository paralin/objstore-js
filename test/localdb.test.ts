import { LocalDB } from '../localdb'
import { InmemDB } from '../inmem'

describe('LocalDB', () => {
    it('should digest data correctly', () => {
        let db = new LocalDB(new InmemDB())
        let testVal = new Uint8Array([0, 2, 1, 5, 4])
        let digest = db.digestData(testVal)
        expect(digest).not.toBeFalsy()
    })
})
