import { PromiseRejectionTypes, ApiMethodCallbackFunction } from "./ApiDefinition";

type PromiseResolveFunc<T> = (result?: T | PromiseLike<T>) => void;
type PromiseRejectorFunc = (reason: PromiseRejectionTypes) => void;

export class PromiseCallbackHelper<T> {
    private readonly initPromise: Promise<void>;
    private p: Promise<T>;
    private resolveP: PromiseResolveFunc<T>;
    private rejectP: PromiseRejectorFunc;

    constructor () {
        this.initPromise = new Promise((resolveInit) => {
            this.p = new Promise<T>((resolve, reject) => {
                this.resolveP = (p) => resolve(p);
                this.rejectP = (p) => {
                    reject(p);
                }
                resolveInit();
            });
        });
    }

    public async getCallbackFunc(): Promise<ApiMethodCallbackFunction<T>> {
        await this.initPromise;
        return (err, result) => {
            try {
                if (err) {
                    this.rejectP(err);
                } else {
                    this.resolveP(result);
                }
            } catch (e) {
                console.error('err2', e);
            }
        };
    }

    public async execute(func: () => void): Promise<T> {
        await this.initPromise;
        try {
            func();
            return await this.p;
        } catch (e) {
            return Promise.reject(e);
        }
    }
}