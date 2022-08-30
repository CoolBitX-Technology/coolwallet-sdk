type PromiseValue<T> = T extends Promise<infer V> ? V : never;

export { PromiseValue };
