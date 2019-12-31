import { expect, assert } from 'chai';
import { CollectionUtil } from '../../src/Util/CollectionUtil';
import 'mocha';
import { ApiDependencyCollection, ApiDependency, IApiDependency, IDependency, DependencyInitializationTime } from '../../src/apiManagement/ApiDependency';
import { ClassConstructor } from '../../src';
import { InternalTypeDefinition } from '../../src/apiManagement/InternalTypes';

class DepClass0 {
    public static readonly HelloStr = 'hello';
    constructor() {}
    public hello() {return DepClass0.HelloStr};
}

class DepClass1 {
    public static readonly HelloStr = 'hello2';
    constructor(
        private readonly dep: DepClass0
    ) {}
    public hello() { return this.dep.hello() };
    public hello2() { return DepClass1.HelloStr }
}

class DepClass2 {
    constructor(
        private readonly dep: DepClass0,
        private readonly dep1: DepClass1,
    ) {}
    public hello() {
        return [this.dep.hello(), this.dep1.hello(), this.dep1.hello2()]
    };
}

class ApiDepMock<C> implements IApiDependency<C> {
    private _instance: C = null;
    public constructor(
        public readonly reference: ClassConstructor<C>,
        public readonly dependencies: IDependency[]
    ) {}

    public getDependencies(): IDependency[] {
        return this.dependencies;
    }

    public get isInstantiated(): boolean {
        return this._instance !== null;
    }

    public get instance(): C | null {
        return this._instance;
    }

    public instantiate(dependencies: Map<ClassConstructor | InternalTypeDefinition, IApiDependency>): C {
        const filled = this.dependencies.map(d => dependencies.get(d.dependency).instance);
        return this._instance = new this.reference(...filled);
    }
}

describe('ApiDependency', () => {
	it('should resolve items with no dependencies', async () => {
        const collection = new ApiDependencyCollection();

        // Register the dependency
        collection.registerDependency(
            ApiDependency.WithConstructor(DepClass0));

        // Instantiate
        const instance = collection.instantiateDependency(DepClass0);
        assert.instanceOf(instance, DepClass0);
        assert.equal(instance.hello(), DepClass0.HelloStr);
    });

    it('should resolve simple dependencies', async () => {
        const helloStr = 'hello';
        const collection = new ApiDependencyCollection();

        // Register the dependency
        collection.registerDependency(
            ApiDependency.WithConstructor(DepClass0));

        collection.registerDependency(
            new ApiDepMock(DepClass1, [{
                dependency: DepClass0,
                propertyKey: 'dep',
                requirementTime: DependencyInitializationTime.OnConstruction,
            }]));

        // Instantiate
        const instance = collection.instantiateDependency(DepClass1);
        assert.instanceOf(instance, DepClass1);
        assert.equal(instance.hello(), helloStr);
    });

    it('should resolve complex dependencies', async () => {
        const helloStr = 'hello';
        const collection = new ApiDependencyCollection();

        // Register the dependency
        collection.registerDependency(
            ApiDependency.WithConstructor(DepClass0));

        collection.registerDependency(
            new ApiDepMock(DepClass2, [
                {
                    dependency: DepClass0,
                    propertyKey: 'dep',
                    requirementTime: DependencyInitializationTime.OnConstruction,
                },
                {
                    dependency: DepClass1,
                    propertyKey: 'dep2',
                    requirementTime: DependencyInitializationTime.OnConstruction,
                },
            ]));

        collection.registerDependency(
            new ApiDepMock(DepClass1, [{
                dependency: DepClass0,
                propertyKey: 'dep',
                requirementTime: DependencyInitializationTime.OnConstruction,
            }]));

        // Instantiate
        const instance = collection.instantiateDependency(DepClass2);
        assert.instanceOf(instance, DepClass2);
        assert.sameOrderedMembers(instance.hello(), [DepClass0.HelloStr, DepClass0.HelloStr, DepClass1.HelloStr]);
    });
});