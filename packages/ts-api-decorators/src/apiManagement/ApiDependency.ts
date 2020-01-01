import { ClassConstructor, ClassConstructor1, ClassConstructor2, ClassConstructor3, ClassConstructor4, ClassConstructor5, ClassConstructor6, ClassConstructor7, ClassConstructor8, ClassConstructor9, ClassConstructor0 } from "../decorators";
import { DepGraph } from 'dependency-graph';
import { ManagedApiInternal } from "./ManagedApiInternal";
import { InternalTypeDefinition } from "./InternalTypes";

/**
 * The symbol descriptor defines a depedency and allows us to uniquely determine
 * define a dependency for resolution.
 */
export interface ISymbolDescriptor {
    // TODO: Verify if this is the right way to describe the dependency
    filename: string;
    symbolName: string;
    scope?: string;
}

export const enum DependencyInitializationTime {
    OnConstruction = 'constr',
    OnUse = 'use',
}

export interface IDependency {
    requirementTime: DependencyInitializationTime;
    dependency: ClassConstructor | InternalTypeDefinition;
    propertyKey: string;
}

export interface IDependencyParam extends IDependency {
    parameterIndex: number;
}

export interface IFilledDependency<T = any> extends IDependency {
    instance: T;
}

export class ApiDependencyCollection {
    private static readonly HashSepChar = '\0';
    private DepNo = 0;

    private dependencyGraph: DepGraph<IApiDependency> = new DepGraph();
    private registeredDependencies: Map<ClassConstructor | InternalTypeDefinition, string> = new Map();
    private filledDependencies: Map<ClassConstructor | InternalTypeDefinition, IApiDependency> = new Map();

    public instantiateDependency<C>(dependency: ClassConstructor<C>): C;
    public instantiateDependency(dependency: InternalTypeDefinition): any;
    public instantiateDependency(dependency: IDependency['dependency']): any {
        if (!this.filledDependencies.has(dependency)) {
            let dependencies = this.walkDependencyGraph(dependency);
            for (const d of dependencies) {
                const filled = this.getFilledDependencies(d.name);
                if (filled.size !== d.numDependencies) {
                    throw new Error('Cannot instantiate dependency: unfilled dependencies');
                }

                const apiDep = this.dependencyGraph.getNodeData(d.name);
                apiDep.instantiate(filled);
                this.addFilledDependency(apiDep);
            }
        }
        
        return this.filledDependencies.get(dependency).instance;
    }

    private walkDependencyGraph(dependency: IDependency['dependency']): { name: string, numDependencies: number }[] {
        const depMap = new Map<string, number>();
        const descrHash = this.getHash(dependency);
        let nodesToWalk = [descrHash];
        do {
            const node = nodesToWalk.pop();
            if (depMap.has(node)) {
                // Already walked this
                continue;
            }

            const nodeData = this.dependencyGraph.getNodeData(node);
            if (!nodeData || this.filledDependencies.has(nodeData.reference)) {
                // Already filled this dependency, or not enough info to fill - skip
                continue;
            }

            const nodeDependencies = this.dependencyGraph.dependenciesOf(node);
            depMap.set(node, nodeDependencies.length);
            nodesToWalk = nodesToWalk.concat(nodeDependencies);
        } while (nodesToWalk.length > 0);
        
        return Array.from(depMap.entries())
            .map(([name, numDependencies]) => ({ name, numDependencies }))
            .sort((a,b) => a.numDependencies - b.numDependencies);
    }

    private getFilledDependencies(name: string): Map<ClassConstructor | InternalTypeDefinition, IApiDependency> {
        const depMap = new Map<ClassConstructor | InternalTypeDefinition, IApiDependency>();
        const dependencies = this.dependencyGraph.dependenciesOf(name);
        for (const d of dependencies) {
            const idep = this.dependencyGraph.getNodeData(d);
            if (!this.filledDependencies.has(idep.reference)) {
                throw new Error('Expected dependency to be filled: ' + d);
            }

            const filled = this.filledDependencies.get(idep.reference);
            depMap.set(filled.reference, filled);
        }
        return depMap;
    }

    private addFilledDependency(apiDep: IApiDependency) {
        this.filledDependencies.set(apiDep.reference, apiDep);
    }

    public registerDependency(dep: IApiDependency) {
        const hash = this.getHash(dep.reference);
        if (this.dependencyGraph.hasNode(hash)) {
            if (this.dependencyGraph.getNodeData(hash)) {
                throw new Error('Dependency already registered');
            } else {
                this.dependencyGraph.setNodeData(hash, dep)
            }
        } else {
            this.dependencyGraph.addNode(hash, dep);
        }
        
        for (const dependency of dep.getDependencies()) {
            const depHash = this.getHash(dependency.dependency);
            if (!this.dependencyGraph.hasNode(depHash)) {
                this.dependencyGraph.addNode(depHash, null);
            }

            this.dependencyGraph.addDependency(hash, depHash);
        }
    }

    private getHash(descr: IDependency['dependency']): string {
        if (!this.registeredDependencies.has(descr)) {
            this.registeredDependencies.set(descr, (this.DepNo++).toString());
        }

        return this.registeredDependencies.get(descr);
    }
}

export const enum ApiDependencyReferenceMode {
    Constructor = 'constructor',
    Function = 'function',
}

export interface IApiDependency<C = {}> {
    getDependencies(): IDependency[];
    isInstantiated: boolean;
    instance: C | null;
    reference: ClassConstructor | InternalTypeDefinition;
    instantiate(dependencies: Map<ClassConstructor | InternalTypeDefinition, IApiDependency>): C;
}

export class ApiDependency<C = {}> implements IApiDependency<C> {
    private _instance: C | null = null;

    private constructor(
        public readonly scope: string | null,
        public readonly reference: ClassConstructor,
        public readonly referenceMode: ApiDependencyReferenceMode,
        private readonly constructionFunc: (args: any[]) => C,
    ) {}

    public static WithConstructor<C>(dependencyClass: ClassConstructor<C>): ApiDependency<C> {
        return new ApiDependency<C>(
            null,
            dependencyClass,
            ApiDependencyReferenceMode.Constructor,
            a => new dependencyClass(...a)
        );
    }

    public static WithFunc<C>(dependencyClass: ClassConstructor<C>, getterFunc: (...args: any[]) => C): ApiDependency<C> {
        return new ApiDependency<C>(
            null,
            dependencyClass,
            ApiDependencyReferenceMode.Function,
            a => getterFunc(...a)
        );
    }

    public getDependencies(): IDependency[] {
        return [
            ...ManagedApiInternal.GetDependenciesOnConstructor(this.reference),
            ...ManagedApiInternal.GetDependencyParams(this.reference, undefined)
        ];
    }

    public get isInstantiated(): boolean {
        return this._instance !== null;
    }

    public get instance(): C | null {
        return this._instance;
    }

    public instantiate(dependencies: Map<ClassConstructor | InternalTypeDefinition, ApiDependency>): C {
        if (this._instance) {
            return this._instance;
        }

        const dependencyParams = 
            ManagedApiInternal.GetDependencyParams(this.reference, undefined)
            .map(d => dependencies.get(d.dependency).instance);

        this._instance = this.constructionFunc(dependencyParams);
        for (const dep of ManagedApiInternal.GetDependenciesOnConstructor(this.reference)) {
            this._instance[dep.propertyKey] = dependencies.get(dep.dependency).instance;
        }

        return this._instance;
    }
}