import { expect, assert } from 'chai';
import { CollectionUtil } from '../../src/Util/CollectionUtil';
import 'mocha';

describe('CollectionUtil', () => {
    const compFunc = (a,b) => a === b;
    const key = "key", value = "value";
	it('should add and remove things', async () => {
        const mapSet = new Map<string, Set<string>>();
        CollectionUtil.addToMapSet(mapSet, key, value);
        assert(CollectionUtil.mapSetContains(mapSet, key, value));

        CollectionUtil.removeFromMapSet(mapSet, key, value);
        assert(!CollectionUtil.mapSetContains(mapSet, key, value));
    });
    
    it('should use compfuncs', async () => {
        const mapSet = new Map<string, Set<string>>();
        CollectionUtil.addToMapSet(mapSet, key, value);
        assert(CollectionUtil.mapSetContains(mapSet, key, value));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, () => false));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, undefined, () => false));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, () => false, () => false));

        CollectionUtil.removeFromMapSet(mapSet, key, value);
        assert(!CollectionUtil.mapSetContains(mapSet, key, value));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, () => false));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, undefined, () => false));
        assert(!CollectionUtil.mapSetContains(mapSet, key, value, () => false, () => false));

        CollectionUtil.addToMapSet(mapSet, key, value);
        CollectionUtil.addToMapSet(mapSet, key, value + '0');
        assert(CollectionUtil.mapSetContains(mapSet, key, value));
        assert(CollectionUtil.mapSetContains(mapSet, key, value + '0'));
        assert(CollectionUtil.mapSetContains(mapSet, key, value, undefined, (a,b) => a === value + '0'));
	});

	it('should add and remove the right things', async () => {
        const mapSet = new Map<string, Set<string>>();
        CollectionUtil.addToMapSet(mapSet, key + '0', value, undefined, compFunc);
        assert(CollectionUtil.mapSetContains(mapSet, key + '0', value, undefined, compFunc));
        for (let i = 0; i < 3; ++i) {
            CollectionUtil.addToMapSet(mapSet, key + i, value + i, undefined, compFunc);
            assert(CollectionUtil.mapSetContains(mapSet, key + i, value + i, undefined, compFunc));
        }

        CollectionUtil.removeFromMapSet(mapSet, key + '0', value, undefined, compFunc);
        assert(!CollectionUtil.mapSetContains(mapSet, key + '0', value, undefined, compFunc));
        for (let i = 0; i < 3; ++i) {
            assert(CollectionUtil.mapSetContains(mapSet, key + i, value + i, undefined, compFunc));
        }

        for (let i = 0; i < 3; ++i) {
            CollectionUtil.removeFromMapSet(mapSet, key + i, value + i, undefined, compFunc);
            assert(!CollectionUtil.mapSetContains(mapSet, key + i, value + i, undefined, compFunc));
        }
    });
    
    it('shouldn\'t add duplicates', async () => {
        const mapSet = new Map<string, Set<string>>();
        CollectionUtil.addToMapSet(mapSet, key, value, undefined, compFunc);
        assert.throw(() => CollectionUtil.addToMapSet(mapSet, key, value, undefined, compFunc));
    });
    
    it('throw for invalid arguments', async () => {
        const mapSet = new Map<string, Set<string>>();
        assert.throw(() => CollectionUtil.addToMapSet(null, key, value, undefined, compFunc));
        assert.throw(() => CollectionUtil.addToMapSet(undefined, key, value, undefined, compFunc));
        // @ts-ignore
        assert.throw(() => CollectionUtil.addToMapSet({}, key, value, undefined, compFunc));
        // @ts-ignore
        assert.throw(() => CollectionUtil.addToMapSet(mapSet, {}, key, value));
	});
});