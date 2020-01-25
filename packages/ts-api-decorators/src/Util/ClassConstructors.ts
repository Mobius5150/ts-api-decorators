export type AbstractClassConstructor<C = {}> = Function & {
	prototype: C;
};
export type ClassConstructor<C = {}> = {
	new(...args: any[]): C;
};
export type ClassConstructor0<C = {}> = {
	new(): C;
};
export type ClassConstructor1<T1, C = {}> = {
	new(a1: T1): C;
};
export type ClassConstructor2<T1, T2, C = {}> = {
	new(a1: T1, a2: T2): C;
};
export type ClassConstructor3<T1, T2, T3, C = {}> = {
	new(a1: T1, a2: T2, a3: T3): C;
};
export type ClassConstructor4<T1, T2, T3, T4, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4): C;
};
export type ClassConstructor5<T1, T2, T3, T4, T5, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): C;
};
export type ClassConstructor6<T1, T2, T3, T4, T5, T6, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): C;
};
export type ClassConstructor7<T1, T2, T3, T4, T5, T6, T7, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7): C;
};
export type ClassConstructor8<T1, T2, T3, T4, T5, T6, T7, T8, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8): C;
};
export type ClassConstructor9<T1, T2, T3, T4, T5, T6, T7, T8, T9, C = {}> = {
	new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9): C;
};
