import { LevelBlobDb } from '../level'

describe('Level', () => {
    let db = new LevelBlobDb('./test/tmp')

    it('should set and get a key', async () => {
        let testVal = new Uint8Array([0, 2, 1, 5, 4])
        await db.setKey('test', testVal)
        let afterVal = await db.getKey('test')
        expect(afterVal).toEqual(testVal)
    })

    it('should list keys', async () {
        let testVal = new Uint8Array([0, 2, 1, 5, 4])
        await db.setKey('test-list/1', testVal)
        await db.setKey('test-list/2', testVal)

        let keys = await db.listKeys('test-list/')
        expect(keys).toEqual(['test-list/1', 'test-list/2'])
    })
})
})
