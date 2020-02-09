export type Func<R = any> =
	(...args: any[]) => R;

export type Func0<R = any> =
	() => R;

export type Func1<T1, R = any> =
	(a1: T1) => R;

export type Func2<T1, T2, R = any> =
	(a1: T1, a2: T2) => R;

export type Func3<T1, T2, T3, R = any> =
	(a1: T1, a2: T2, a3: T3) => R;

export type Func4<T1, T2, T3, T4, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4) => R;

export type Func5<T1, T2, T3, T4, T5, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R;

export type Func6<T1, T2, T3, T4, T5, T6, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R;

export type Func7<T1, T2, T3, T4, T5, T6, T7, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => R;

export type Func8<T1, T2, T3, T4, T5, T6, T7, T8, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => R;

export type Func9<T1, T2, T3, T4, T5, T6, T7, T8, T9, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => R;

export type AsyncFunc<R = any> =
	(...args: any[]) => PromiseLike<R>;

export type AsyncFunc0<R = any> =
	() => PromiseLike<R>;

export type AsyncFunc1<T1, R = any> =
	(a1: T1) => PromiseLike<R>;

export type AsyncFunc2<T1, T2, R = any> =
	(a1: T1, a2: T2) => PromiseLike<R>;

export type AsyncFunc3<T1, T2, T3, R = any> =
	(a1: T1, a2: T2, a3: T3) => PromiseLike<R>;

export type AsyncFunc4<T1, T2, T3, T4, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4) => PromiseLike<R>;

export type AsyncFunc5<T1, T2, T3, T4, T5, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => PromiseLike<R>;

export type AsyncFunc6<T1, T2, T3, T4, T5, T6, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => PromiseLike<R>;

export type AsyncFunc7<T1, T2, T3, T4, T5, T6, T7, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => PromiseLike<R>;

export type AsyncFunc8<T1, T2, T3, T4, T5, T6, T7, T8, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => PromiseLike<R>;

export type AsyncFunc9<T1, T2, T3, T4, T5, T6, T7, T8, T9, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => PromiseLike<R>;


export type OptionalAsyncFunc<R = any> =
	(...args: any[]) => R | PromiseLike<R>;

export type OptionalAsyncFunc0<R = any> =
	() => R | PromiseLike<R>;

export type OptionalAsyncFunc1<T1, R = any> =
	(a1: T1) => R | PromiseLike<R>;

export type OptionalAsyncFunc2<T1, T2, R = any> =
	(a1: T1, a2: T2) => R | PromiseLike<R>;

export type OptionalAsyncFunc3<T1, T2, T3, R = any> =
	(a1: T1, a2: T2, a3: T3) => R | PromiseLike<R>;

export type OptionalAsyncFunc4<T1, T2, T3, T4, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4) => R | PromiseLike<R>;

export type OptionalAsyncFunc5<T1, T2, T3, T4, T5, R = any> =
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R | PromiseLike<R>;

export type OptionalAsyncFunc6<T1, T2, T3, T4, T5, T6, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R | PromiseLike<R>;

export type OptionalAsyncFunc7<T1, T2, T3, T4, T5, T6, T7, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => R | PromiseLike<R>;

export type OptionalAsyncFunc8<T1, T2, T3, T4, T5, T6, T7, T8, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => R | PromiseLike<R>;

export type OptionalAsyncFunc9<T1, T2, T3, T4, T5, T6, T7, T8, T9, R = any> = 
	(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => R | PromiseLike<R>;