export class CollectionUtil {
    private constructor() {}

    public static addToMapSet<K, T>(mapSet: Map<K, Set<T>>, addKey: K, addVal: T, kcompFunc?: (a: K, b: K) => boolean, tcompFunc?: (a: T, b: T) => boolean) {
        CollectionUtil.assertMapSet(mapSet);
        CollectionUtil.assertCompFunc(tcompFunc);
        CollectionUtil.assertCompFunc(kcompFunc);
        
        let set: Set<T>;
        if (kcompFunc) {
            for (const k of mapSet.keys()) {
                if (kcompFunc(k, addKey)) {
                    set = mapSet.get(k);
                    break;
                }
            }

            if (!set) {
                set = new Set();
                mapSet.set(addKey, set);
            }
        } else if (!mapSet.has(addKey)) {
            set = new Set();
            mapSet.set(addKey, set);
        } else {
            set = mapSet.get(addKey);
        }

        if (tcompFunc) {
            for (const entry of set) {
                if (tcompFunc(entry, addVal)) {
                    throw new Error('Generator/Decorator pair already registered');
                }
            }
        } else {
            if (set.has(addVal)) {
                throw new Error('Generator/Decorator pair already registered');
            }
        }

        set.add(addVal)
    }

    public static mapSetContains<K, T>(mapSet: Map<K, Set<T>>, addKey: K, addVal: T, kcompFunc?: (a: K, b: K) => boolean, tcompFunc?: (a: T, b: T) => boolean): boolean {
        CollectionUtil.assertMapSet(mapSet);
        CollectionUtil.assertCompFunc(tcompFunc);
        CollectionUtil.assertCompFunc(kcompFunc);
        
        let set: Set<T>;
        if (kcompFunc) {
            for (const k of mapSet.keys()) {
                if (kcompFunc(k, addKey)) {
                    set = mapSet.get(k);
                    break;
                }
            }

            if (!set) {
                return false;
            }
        } else if (!mapSet.has(addKey)) {
            return false;
        } else {
            set = mapSet.get(addKey);
        }

        if (tcompFunc) {
            for (const entry of set) {
                if (tcompFunc(entry, addVal)) {
                    return true;
                }
            }
        } else {
            if (set.has(addVal)) {
                return true;
            }
        }

        return false;
    }

    public static getSet<K, T>(mapSet: Map<K, Set<T>>, addKey: K, kcompFunc?: (a: K, b: K) => boolean): Set<T> | undefined {
        CollectionUtil.assertMapSet(mapSet);
        CollectionUtil.assertCompFunc(kcompFunc);
        
        if (kcompFunc) {
            for (const k of mapSet.keys()) {
                if (kcompFunc(k, addKey)) {
                    return mapSet.get(k);
                }
            }
        } else if (mapSet.has(addKey)) {
            return mapSet.get(addKey);
        }
    }

    public static removeFromMapSet<K, T>(mapSet: Map<K, Set<T>>, removeKey: K, removeVal: T, kcompFunc?: (a: K, b: K) => boolean, tcompFunc?: (a: T, b: T) => boolean): void {
        CollectionUtil.assertMapSet(mapSet);
        CollectionUtil.assertCompFunc(tcompFunc);
        CollectionUtil.assertCompFunc(kcompFunc);

        let set: Set<T>;
        if (kcompFunc) {
            for (const k of mapSet.keys()) {
                if (kcompFunc(k, removeKey)) {
                    set = mapSet.get(k);
                    break;
                }
            }

            if (!set) {
                return;
            }
        } else if (!mapSet.has(removeKey)) {
            return;
        } else {
            set = mapSet.get(removeKey);
        }

        if (tcompFunc) {
            for (const entry of set) {
                if (tcompFunc(entry, removeVal)) {
                    CollectionUtil.removeEntry(mapSet, removeKey, set, removeVal);
                    return;
                }
            }
        } else {
            if (set.has(removeVal)) {
                CollectionUtil.removeEntry(mapSet, removeKey, set, removeVal);
                return;
            }
        }
    }

    private static removeEntry<K, T>(mapSet: Map<K, Set<T>>, removeKey: K, set: Set<T>, removeVal: T) {
        set.delete(removeVal);
        if (!set.size) {
            mapSet.delete(removeKey);
        }
    }

    private static assertMapSet<K, T>(mapSet: Map<K, Set<T>>) {
        if (!mapSet || !(mapSet instanceof Map)) {
            throw new Error('Invalid mapSet');
        }
    }

    private static assertCompFunc<T>(tcompFunc: (a: T, b: T) => boolean) {
        if (typeof tcompFunc !== 'function' && typeof tcompFunc !== 'undefined') {
            throw new Error('Invalid compFunc');
        }
    }
}